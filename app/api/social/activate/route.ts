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
      .from('Project')
      .select('name, website_url')
      .eq('id', project_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const profileName = project.name || `Project ${project_id}`;
    let lateProfileId: string | null = null;

    // Try to create Late.dev profile, or find existing one
    try {
      const lateProfile = await lateClient.createProfile(
        profileName,
        `WritGo social media profile for ${project.website_url || project.name}`
      );
      lateProfileId = lateProfile._id;
    } catch (createError: any) {
      // If profile already exists, try to find it
      if (createError.message?.includes('already exists')) {
        console.log('Profile already exists in Late.dev, searching for it...');
        
        try {
          const { profiles } = await lateClient.listProfiles();
          const existingLateProfile = profiles.find(p => p.name === profileName);
          
          if (existingLateProfile) {
            lateProfileId = existingLateProfile._id;
            console.log('Found existing Late.dev profile:', lateProfileId);
          } else {
            // Try with a unique name
            const uniqueName = `${profileName} - ${project_id.slice(0, 8)}`;
            const newProfile = await lateClient.createProfile(
              uniqueName,
              `WritGo social media profile for ${project.website_url || project.name}`
            );
            lateProfileId = newProfile._id;
            console.log('Created Late.dev profile with unique name:', lateProfileId);
          }
        } catch (listError) {
          console.error('Failed to list/create Late.dev profiles:', listError);
          throw createError; // Re-throw original error
        }
      } else {
        throw createError;
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
