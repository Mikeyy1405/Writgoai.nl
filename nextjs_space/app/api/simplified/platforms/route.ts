import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/simplified/platforms
 * Fetch all social media platforms for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Replace with actual database query
    // For now, return mock data
    const platforms = [
      {
        platform: 'linkedin',
        display_name: 'LinkedIn',
        username: 'jouw-bedrijf',
        connected: true,
        is_enabled: true,
        last_post_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        posts_this_month: 12,
      },
      {
        platform: 'facebook',
        display_name: 'Facebook',
        username: 'jouw-pagina',
        connected: true,
        is_enabled: true,
        last_post_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        posts_this_month: 15,
      },
      {
        platform: 'instagram',
        display_name: 'Instagram',
        connected: false,
        is_enabled: false,
      },
      {
        platform: 'twitter',
        display_name: 'Twitter/X',
        connected: false,
        is_enabled: false,
      },
      {
        platform: 'tiktok',
        display_name: 'TikTok',
        connected: false,
        is_enabled: false,
      },
      {
        platform: 'pinterest',
        display_name: 'Pinterest',
        connected: false,
        is_enabled: false,
      },
      {
        platform: 'youtube',
        display_name: 'YouTube',
        connected: false,
        is_enabled: false,
      },
      {
        platform: 'google_business',
        display_name: 'Google My Business',
        connected: false,
        is_enabled: false,
      },
    ];

    return NextResponse.json(platforms);
  } catch (error) {
    console.error('Error fetching platforms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platforms' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/simplified/platforms
 * Update platform connection status
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { platform, enabled } = body;

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      );
    }

    // TODO: Update database with platform status
    console.log(`Updating platform ${platform} to enabled=${enabled}`);

    return NextResponse.json({ 
      success: true,
      message: `Platform ${platform} updated successfully` 
    });
  } catch (error) {
    console.error('Error updating platform:', error);
    return NextResponse.json(
      { error: 'Failed to update platform' },
      { status: 500 }
    );
  }
}
