import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/simplified/platforms/[id]
 * Haal specifieke platform informatie op
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const platformId = params.id;

    // TODO: Fetch from database
    // Voor nu return mock data gebaseerd op platform ID
    const platforms: Record<string, any> = {
      linkedin: {
        id: 'linkedin',
        platform: 'linkedin',
        display_name: 'LinkedIn',
        username: 'jouw-bedrijf',
        connected: true,
        is_enabled: true,
        last_post_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        posts_this_month: 12,
      },
      facebook: {
        id: 'facebook',
        platform: 'facebook',
        display_name: 'Facebook',
        username: 'jouw-pagina',
        connected: true,
        is_enabled: true,
        last_post_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        posts_this_month: 15,
      },
    };

    const platform = platforms[platformId];

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: platform,
    });
  } catch (error) {
    console.error('Error fetching platform:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/simplified/platforms/[id]
 * Update platform settings
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const platformId = params.id;
    const body = await request.json();
    const { enabled, username } = body;

    // TODO: Update in database
    console.log(`Updating platform ${platformId}:`, { enabled, username });

    return NextResponse.json({
      success: true,
      message: `Platform ${platformId} updated successfully`,
      data: {
        id: platformId,
        enabled,
        username,
      },
    });
  } catch (error) {
    console.error('Error updating platform:', error);
    return NextResponse.json(
      { error: 'Failed to update platform' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/simplified/platforms/[id]
 * Disconnect platform
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const platformId = params.id;

    // TODO: Remove from database
    console.log(`Disconnecting platform ${platformId}`);

    return NextResponse.json({
      success: true,
      message: `Platform ${platformId} disconnected successfully`,
    });
  } catch (error) {
    console.error('Error deleting platform:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect platform' },
      { status: 500 }
    );
  }
}
