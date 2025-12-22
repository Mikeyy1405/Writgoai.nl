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
      return NextResponse.json({ error: 'No Late profile ID' }, { status: 500 });
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
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const lateClient = getLateClient();
    
    if (!lateClient.isConfigured()) {
      return NextResponse.json({ 
        accounts: [],
        configured: false,
        message: 'Later.dev API key not configured. You can still create posts manually.'
      });
    }

    // Get our social profile
    const { data: socialProfile } = await supabaseAdmin
      .from('social_profiles')
      .select('*')
      .eq('project_id', project_id)
      .single();

    if (!socialProfile?.late_profile_id) {
      return NextResponse.json({ accounts: [], configured: true });
    }

    // Get accounts from Late
    const { accounts: lateAccounts } = await lateClient.listAccounts(socialProfile.late_profile_id);

    // Sync to our database
    for (const account of lateAccounts) {
      const { error } = await supabaseAdmin
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
    const { data: accounts } = await supabaseAdmin
      .from('social_accounts')
      .select('*')
      .eq('social_profile_id', socialProfile.id);

    return NextResponse.json({ 
      accounts: accounts || [],
      configured: true,
    });
  } catch (error: any) {
    console.error('Sync accounts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
