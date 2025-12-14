/**
 * Client Platforms API Route
 * 
 * GET: List all connected platforms for logged-in client
 * POST: Connect a new platform
 * DELETE: Disconnect a platform
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient, isAuthError } from '@/lib/auth-helpers';
import {
  getConnectedPlatforms,
  connectPlatform,
  disconnectPlatform,
} from '@/lib/supabase/client-helpers';
import { ConnectedPlatformInsert } from '@/lib/supabase/database.types';
import { getPlatformByType } from '@/lib/constants/packages';

export const dynamic = 'force-dynamic';

/**
 * GET /api/client/platforms
 * Get all connected platforms for the logged-in client
 */
export async function GET() {
  try {
    const auth = await getAuthenticatedClient();
    
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    // Use client.id (from Client table), NOT session.user.id
    const clientId = auth.client.id;
    const platforms = await getConnectedPlatforms(clientId);

    // Enrich with platform info
    const enrichedPlatforms = platforms.map((platform) => ({
      ...platform,
      platform_info: getPlatformByType(platform.platform_type),
    }));

    return NextResponse.json({
      platforms: enrichedPlatforms,
      count: enrichedPlatforms.length,
    });
  } catch (error) {
    console.error('Error fetching platforms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platforms' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/client/platforms
 * Connect a new platform for the logged-in client
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedClient();
    
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    // Use client.id (from Client table), NOT session.user.id
    const clientId = auth.client.id;
    const body = await request.json();

    // Validate required fields
    if (!body.platform_type || !body.platform_name) {
      return NextResponse.json(
        { error: 'Missing required fields: platform_type, platform_name' },
        { status: 400 }
      );
    }

    const platformData: ConnectedPlatformInsert = {
      client_id: clientId,
      platform_type: body.platform_type,
      platform_name: body.platform_name,
      access_token: body.access_token,
      refresh_token: body.refresh_token,
      token_expiry: body.token_expiry,
      platform_user_id: body.platform_user_id,
      platform_username: body.platform_username,
      connected_at: new Date(),
      metadata: body.metadata || {},
      active: true,
    };

    const newPlatform = await connectPlatform(platformData);

    // Enrich with platform info
    const platformInfo = getPlatformByType(newPlatform.platform_type);

    return NextResponse.json(
      {
        platform: {
          ...newPlatform,
          platform_info: platformInfo,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error connecting platform:', error);
    return NextResponse.json(
      { error: 'Failed to connect platform' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/client/platforms
 * Disconnect a platform for the logged-in client
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedClient();
    
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const platformId = searchParams.get('id');

    if (!platformId) {
      return NextResponse.json(
        { error: 'Missing platform ID' },
        { status: 400 }
      );
    }

    await disconnectPlatform(platformId);

    return NextResponse.json(
      { message: 'Platform disconnected successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error disconnecting platform:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect platform' },
      { status: 500 }
    );
  }
}
