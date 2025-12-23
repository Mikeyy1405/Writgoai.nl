import { NextResponse } from 'next/server';
import { getLateClient } from '@/lib/late-client';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Activate social media for a project (create or find Late.dev profile)
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_id } = await request.json();

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const lateClient = getLateClient();
    
    if (!lateClient.isConfigured()) {
      return NextResponse.json({ 
        error: 'Later.dev API key not configured. Contact support.',
        configured: false 
      }, { status: 400 });
    }

    // Check if profile already exists in our database
    const { data: existingProfile } = await supabaseAdmin
      .from('social_profiles')
      .select('*')
      .eq('project_id', project_id)
      .single();

    if (existingProfile?.late_profile_id) {
      return NextResponse.json({ 
        success: true,
        message: 'Social media already activated',
        profile: existingProfile,
      });
    }

    // Get project info
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('name, website_url')
      .eq('id', project_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const profileName = project.name || `Project ${project_id}`;
    let lateProfileId: string | null = null;

    // FIRST: Try to find existing profile before creating
    try {
      console.log('Checking for existing Late.dev profiles...');
      const { profiles } = await lateClient.listProfiles();
      const existingLateProfile = profiles.find(p => p.name === profileName);
      
      if (existingLateProfile) {
        lateProfileId = existingLateProfile._id;
        console.log('✅ Found and syncing existing Late.dev profile:', lateProfileId);
      }
    } catch (listError) {
      console.error('Failed to list Late.dev profiles:', listError);
      // Continue to try creating if listing fails
    }

    // If no existing profile found, create a new one
    if (!lateProfileId) {
      try {
        console.log('Creating new Late.dev profile:', profileName);
        const lateProfile = await lateClient.createProfile(
          profileName,
          `WritGo social media profile for ${project.website_url || project.name}`
        );
        lateProfileId = lateProfile._id;
        console.log('✅ Created new Late.dev profile:', lateProfileId);
      } catch (createError: any) {
        // If profile already exists (race condition), try to find it again
        if (createError.message?.includes('already exists')) {
          console.log('⚠️ Profile was created by another request, fetching it...');
          
          try {
            const { profiles } = await lateClient.listProfiles();
            const existingLateProfile = profiles.find(p => p.name === profileName);
            
            if (existingLateProfile) {
              lateProfileId = existingLateProfile._id;
              console.log('✅ Found profile after conflict:', lateProfileId);
            } else {
              return NextResponse.json({ 
                error: 'Profile creation conflict. Please try again.',
              }, { status: 409 });
            }
          } catch (secondListError) {
            console.error('Failed to resolve profile conflict:', secondListError);
            return NextResponse.json({ 
              error: 'Unable to sync with Late.dev. Please try again or contact support.',
            }, { status: 500 });
          }
        } else {
          throw createError;
        }
      }
    }

    if (!lateProfileId) {
      return NextResponse.json({ 
        error: 'Failed to create or find Late.dev profile',
      }, { status: 500 });
    }

    // Save or update in our database
    let profileRecord;
    
    if (existingProfile) {
      // Update existing record
      const { data, error } = await supabaseAdmin
        .from('social_profiles')
        .update({ 
          late_profile_id: lateProfileId,
          name: project.name,
        })
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (error) throw error;
      profileRecord = data;
    } else {
      // Create new record
      const { data, error } = await supabaseAdmin
        .from('social_profiles')
        .insert({
          project_id,
          late_profile_id: lateProfileId,
          name: project.name,
        })
        .select()
        .single();

      if (error) throw error;
      profileRecord = data;
    }

    return NextResponse.json({ 
      success: true,
      message: 'Social media activated successfully',
      profile: profileRecord,
      late_profile_id: lateProfileId,
    });

  } catch (error: any) {
    console.error('Activate social error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Check if social media is activated for a project
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const lateClient = getLateClient();
    const isConfigured = lateClient.isConfigured();

    const { data: profile } = await supabaseAdmin
      .from('social_profiles')
      .select('*')
      .eq('project_id', projectId)
      .single();

    return NextResponse.json({ 
      activated: !!profile?.late_profile_id,
      profile: profile || null,
      late_configured: isConfigured,
    });

  } catch (error: any) {
    console.error('Check activation error:', error);
    return NextResponse.json({ 
      activated: false, 
      profile: null,
      late_configured: false,
    });
  }
}
