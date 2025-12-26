import { NextResponse } from 'next/server';
import { getLateClient } from '@/lib/late-client';
import { createClient } from '@supabase/supabase-js';


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


// Lazy initialization to prevent build-time errors
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin as any; // Type assertion needed for tables not in generated types
}

// Get connect URL for a platform
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const platform = searchParams.get('platform');

    console.log('🔗 GET /api/social/connect', { projectId, platform });

    if (!projectId || !platform) {
      console.error('❌ Missing required parameters');
      return NextResponse.json({ error: 'Project ID and platform are required' }, { status: 400 });
    }

    const lateClient = getLateClient();

    if (!lateClient.isConfigured()) {
      console.error('❌ Late API key not configured');
      return NextResponse.json({
        error: 'Later.dev API key not configured',
        configured: false
      }, { status: 400 });
    }

    console.log('✅ Late client configured');

    // Check if project has a Late profile, create one if not
    let { data: socialProfile } = await getSupabaseAdmin()
      .from('social_profiles')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (!socialProfile) {
      // Get project name for the profile
      const { data: project } = await getSupabaseAdmin()
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single();

      // Create Late profile
      const lateProfile = await lateClient.createProfile(
        project?.name || `Project ${projectId}`,
        `WritGo social media profile`
      );

      // Save to our database
      const { data: newProfile, error: insertError } = await getSupabaseAdmin()
        .from('social_profiles')
        .insert({
          project_id: projectId,
          late_profile_id: lateProfile._id,
          name: project?.name || `Project ${projectId}`,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to save profile:', insertError);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }

      socialProfile = newProfile;
    }

    if (!socialProfile.late_profile_id) {
      // Try to create Late profile if it doesn't exist
      try {
        const { data: project } = await getSupabaseAdmin()
          .from('projects')
          .select('name')
          .eq('id', projectId)
          .single();

        const lateProfile = await lateClient.createProfile(
          project?.name || `Project ${projectId}`,
          `WritGo social media profile`
        );

        // Update the profile with the Late ID
        await getSupabaseAdmin()
          .from('social_profiles')
          .update({ late_profile_id: lateProfile._id })
          .eq('id', socialProfile.id);

        socialProfile.late_profile_id = lateProfile._id;
        
        console.log(`✅ Created Late.dev profile: ${lateProfile._id} for ${project?.name}`);
      } catch (createError: any) {
        console.error('❌ Failed to create Late profile:', createError);
        
        // CRITICAL: Return detailed error to frontend
        const { data: project } = await getSupabaseAdmin()
          .from('projects')
          .select('name')
          .eq('id', projectId)
          .single();
        
        return NextResponse.json({ 
          error: `Late.dev profile creation failed: ${createError.message}`,
          details: createError.toString(),
          configured: true, // API key IS configured
          needsManualFix: true,
          projectName: project?.name
        }, { status: 500 });
      }
    }

    // Generate connect URL by calling Late.dev API
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://writgo.nl'}/dashboard/social?connected=${platform}&project=${projectId}`;

    console.log('🔗 Requesting authUrl from Late.dev...', {
      platform,
      profileId: socialProfile.late_profile_id,
      redirectUrl
    });

    const connectUrl = await lateClient.getConnectUrl(platform, socialProfile.late_profile_id, redirectUrl);

    console.log('✅ Received connect URL from Late.dev:', {
      connectUrlLength: connectUrl.length,
      connectUrlPreview: connectUrl.substring(0, 100)
    });

    return NextResponse.json({
      connectUrl,
      profileId: socialProfile.late_profile_id,
    });
  } catch (error: any) {
    console.error('❌ Connect error:', error);
    return NextResponse.json({
      error: error.message || 'Unknown error occurred',
      details: error.toString()
    }, { status: 500 });
  }
}

// Sync connected accounts from Late
export async function POST(request: Request) {
  try {
    const { project_id } = await request.json();

    console.log('🔄 POST /api/social/connect - Syncing accounts for project:', project_id);

    if (!project_id) {
      console.error('❌ Project ID missing');
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const lateClient = getLateClient();

    if (!lateClient.isConfigured()) {
      console.warn('⚠️ Late API key not configured');
      return NextResponse.json({
        configured: false,
        accounts: []
      });
    }

    console.log('✅ Late client configured, proceeding with sync');

    // Get project from database
    const { data: project } = await getSupabaseAdmin()
      .from('projects')
      .select('name')
      .eq('id', project_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get or create social profile
    let { data: socialProfile } = await getSupabaseAdmin()
      .from('social_profiles')
      .select('*')
      .eq('project_id', project_id)
      .single();

    // If no social profile exists, create one
    if (!socialProfile) {
      const { data: newProfile, error: insertError } = await getSupabaseAdmin()
        .from('social_profiles')
        .insert({
          project_id: project_id,
          name: project.name,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create social profile:', insertError);
        return NextResponse.json({ error: 'Failed to create social profile' }, { status: 500 });
      }

      socialProfile = newProfile;
    }

    // If late_profile_id is already set, get accounts
    if (socialProfile.late_profile_id) {
      console.log(`📋 Profile exists with Late ID: ${socialProfile.late_profile_id}`);
      try {
        console.log('🔍 Fetching accounts from Late.dev...');
        const { accounts: lateAccounts } = await lateClient.listAccounts(socialProfile.late_profile_id);

        console.log(`✅ Found ${lateAccounts.length} accounts in Late.dev:`,
          lateAccounts.map(a => `${a.platform}:${a.username}`));

        // Sync to our database
        for (const account of lateAccounts) {
          console.log(`💾 Syncing account: ${account.platform} (${account.username})`);
          const { error } = await getSupabaseAdmin()
            .from('social_accounts')
            .upsert({
              social_profile_id: socialProfile.id,
              late_account_id: account._id,
              platform: account.platform,
              username: account.username,
              connected: true,
            }, {
              onConflict: 'late_account_id',
            });

          if (error) {
            console.error(`❌ Failed to sync ${account.platform} account:`, error);
          } else {
            console.log(`✅ Synced ${account.platform} account`);
          }
        }

        // Get our synced accounts
        const { data: accounts } = await getSupabaseAdmin()
          .from('social_accounts')
          .select('*')
          .eq('social_profile_id', socialProfile.id);

        console.log(`✅ Total synced accounts in DB: ${accounts?.length || 0}`);

        return NextResponse.json({
          accounts: accounts || [],
          configured: true,
          profile_id: socialProfile.late_profile_id,
          synced: true
        });
      } catch (error: any) {
        console.error('❌ Failed to list/sync accounts:', error);
        console.error('Error details:', error.message, error.stack);
        return NextResponse.json({
          configured: true,
          accounts: [],
          profile_id: socialProfile.late_profile_id,
          error: error.message
        });
      }
    }

    // Try to create Late.dev profile
    try {
      console.log(`Creating Late.dev profile for: ${project.name}`);
      
      const lateProfile = await lateClient.createProfile(
        project.name,
        `WritGo social media profile for ${project.name}`
      );

      console.log(`✅ Created Late.dev profile: ${lateProfile._id}`);

      // Update database with the profile ID
      const { error: updateError } = await getSupabaseAdmin()
        .from('social_profiles')
        .update({
          late_profile_id: lateProfile._id,
          updated_at: new Date().toISOString()
        })
        .eq('id', socialProfile.id);

      if (updateError) {
        console.error('Failed to update social profile with Late ID:', updateError);
      }

      return NextResponse.json({ 
        configured: true,
        accounts: [],
        profile_id: lateProfile._id,
        created: true
      });

    } catch (createError: any) {
      console.error('❌ Late.dev profile creation failed:', createError);
      
      // Check if profile might already exist
      try {
        const { profiles } = await lateClient.listProfiles();
        
        // Normalize names for better matching
        const normalizedProjectName = project.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]/g, ''); // Remove special characters
        
        const existingProfile = profiles.find(p => {
          const normalizedProfileName = p.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]/g, '');
          return normalizedProfileName === normalizedProjectName;
        });

        if (existingProfile) {
          console.log(`Found existing Late.dev profile: ${existingProfile._id}`);
          
          // Update database with existing profile ID
          const { error: syncError } = await getSupabaseAdmin()
            .from('social_profiles')
            .update({ 
              late_profile_id: existingProfile._id,
              updated_at: new Date().toISOString()
            })
            .eq('id', socialProfile.id);

          if (syncError) {
            console.error('Failed to update social profile with existing profile ID:', syncError);
            return NextResponse.json({ 
              error: 'Failed to sync profile ID to database',
              configured: true,
              manual_mode: true
            }, { status: 500 });
          }

          // Get accounts for this profile
          try {
            const { accounts: lateAccounts } = await lateClient.listAccounts(existingProfile._id);

            // Sync to our database
            for (const account of lateAccounts) {
              const { error } = await getSupabaseAdmin()
                .from('social_accounts')
                .upsert({
                  social_profile_id: socialProfile.id,
                  late_account_id: account._id,
                  platform: account.platform,
                  username: account.username,
                  connected: true,
                }, {
                  onConflict: 'late_account_id',
                });

              if (error) {
                console.error('Failed to sync account:', error);
              }
            }

            // Get our synced accounts
            const { data: accounts } = await getSupabaseAdmin()
              .from('social_accounts')
              .select('*')
              .eq('social_profile_id', socialProfile.id);

            return NextResponse.json({ 
              configured: true,
              accounts: accounts || [],
              profile_id: existingProfile._id,
              found_existing: true
            });
          } catch (accountsError) {
            console.error('Failed to list accounts for existing profile:', accountsError);
            // Still return success with empty accounts - profile ID is synced
            return NextResponse.json({ 
              configured: true,
              accounts: [],
              profile_id: existingProfile._id,
              found_existing: true
            });
          }
        }
      } catch (listError) {
        console.error('Failed to list existing profiles:', listError);
      }

      return NextResponse.json({ 
        error: `Failed to create or find Late.dev profile: ${createError.message}`,
        configured: true,
        manual_mode: true
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('POST /api/social/connect error:', error);
    return NextResponse.json({ 
      error: error.message,
      configured: false
    }, { status: 500 });
  }
}
