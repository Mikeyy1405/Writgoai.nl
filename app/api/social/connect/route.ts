import { NextResponse } from 'next/server';
import { getLateClient } from '@/lib/late-client';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get connect URL for a platform
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const platform = searchParams.get('platform');

    if (!projectId || !platform) {
      return NextResponse.json({ error: 'Project ID and platform are required' }, { status: 400 });
    }

    const lateClient = getLateClient();
    
    if (!lateClient.isConfigured()) {
      return NextResponse.json({ 
        error: 'Later.dev API key not configured',
        configured: false 
      }, { status: 400 });
    }

    // Check if project has a Late profile, create one if not
    let { data: socialProfile } = await supabaseAdmin
      .from('social_profiles')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (!socialProfile) {
      // Get project name for the profile
      const { data: project } = await supabaseAdmin
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
      const { data: newProfile, error: insertError } = await supabaseAdmin
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
        const { data: project } = await supabaseAdmin
          .from('projects')
          .select('name')
          .eq('id', projectId)
          .single();

        const lateProfile = await lateClient.createProfile(
          project?.name || `Project ${projectId}`,
          `WritGo social media profile`
        );

        // Update the profile with the Late ID
        await supabaseAdmin
          .from('social_profiles')
          .update({ late_profile_id: lateProfile._id })
          .eq('id', socialProfile.id);

        socialProfile.late_profile_id = lateProfile._id;
        
        console.log(`✅ Late.dev profile created: ${lateProfile._id}`);
      } catch (createError: any) {
        console.error('❌ Late.dev create failed:', createError.message);
        
        // Try to find existing profile by name
        try {
          const { profiles } = await lateClient.listProfiles();
          const { data: project } = await supabaseAdmin
            .from('projects')
            .select('name')
            .eq('id', projectId)
            .single();
            
          const existing = profiles.find(
            p => p.name.toLowerCase().includes((project?.name || '').toLowerCase())
          );

          if (existing) {
            console.log(`Found existing profile: ${existing._id}`);
            
            await supabaseAdmin
              .from('social_profiles')
              .update({ late_profile_id: existing._id })
              .eq('id', socialProfile.id);

            socialProfile.late_profile_id = existing._id;
          } else {
            return NextResponse.json({ 
              error: 'Could not create or find Late.dev profile',
              manual_mode: true
            }, { status: 500 });
          }
        } catch (listError) {
          console.error('Failed to list profiles:', listError);
          return NextResponse.json({ 
            error: 'Late.dev connection failed',
            manual_mode: true
          }, { status: 500 });
        }
      }
    }

    // Generate connect URL
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://writgo.nl'}/dashboard/social?connected=${platform}&project=${projectId}`;
    const connectUrl = lateClient.getConnectUrl(platform, socialProfile.late_profile_id, redirectUrl);

    return NextResponse.json({ 
      connectUrl,
      profileId: socialProfile.late_profile_id,
    });
  } catch (error: any) {
    console.error('Connect error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Sync connected accounts from Late
export async function POST(request: Request) {
  try {
    const { project_id } = await request.json();

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const lateClient = getLateClient();
    
    if (!lateClient.isConfigured()) {
      return NextResponse.json({ 
        configured: false,
        accounts: []
      });
    }

    // Get project
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('name')
      .eq('id', project_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get or create social profile
    let { data: socialProfile } = await supabaseAdmin
      .from('social_profiles')
      .select('*')
      .eq('project_id', project_id)
      .single();

    if (!socialProfile) {
      const { data: newProfile } = await supabaseAdmin
        .from('social_profiles')
        .insert({ project_id, name: project.name })
        .select()
        .single();
      socialProfile = newProfile;
    }

    // If late_profile_id exists, get accounts
    if (socialProfile?.late_profile_id) {
      try {
        const { accounts } = await lateClient.listAccounts(socialProfile.late_profile_id);
        return NextResponse.json({ 
          configured: true,
          accounts: accounts || []
        });
      } catch (err) {
        console.error('List accounts failed:', err);
      }
    }

    // Try to create or find Late.dev profile
    try {
      // First try to create
      const lateProfile = await lateClient.createProfile(
        project.name,
        `WritGo profile for ${project.name}`
      );

      await supabaseAdmin
        .from('social_profiles')
        .update({ late_profile_id: lateProfile._id })
        .eq('id', socialProfile.id);

      return NextResponse.json({ 
        configured: true,
        accounts: [],
        profile_created: true
      });

    } catch (createError) {
      console.error('Create failed, trying to find existing:', createError);
      
      // If create fails, try to find existing
      try {
        const { profiles } = await lateClient.listProfiles();
        const existing = profiles.find(p => 
          p.name.toLowerCase() === project.name.toLowerCase()
        );

        if (existing) {
          await supabaseAdmin
            .from('social_profiles')
            .update({ late_profile_id: existing._id })
            .eq('id', socialProfile.id);

          const { accounts } = await lateClient.listAccounts(existing._id);

          return NextResponse.json({ 
            configured: true,
            accounts: accounts || [],
            profile_found: true
          });
        }
      } catch (findError) {
        console.error('Find existing failed:', findError);
      }

      // Fallback: manual mode
      return NextResponse.json({ 
        configured: false,
        accounts: [],
        manual_mode: true
      });
    }

  } catch (error: any) {
    console.error('POST /api/social/connect error:', error);
    return NextResponse.json({ 
      error: error.message,
      configured: false,
      accounts: []
    }, { status: 500 });
  }
}
