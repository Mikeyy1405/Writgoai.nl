

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getOrCreateProfile, createPlatformInvite } from '@/lib/latedev';

/**
 * POST /api/client/latedev/connect/[platform]
 * Generate a platform-specific invite URL
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const platform = params.platform;

    // Validate platform
    const supportedPlatforms = [
      'instagram',
      'tiktok',
      'youtube',
      'facebook',
      'twitter',
      'x',
      'linkedin',
      'threads',
      'reddit',
      'pinterest',
      'bluesky',
    ];

    if (!supportedPlatforms.includes(platform.toLowerCase())) {
      return NextResponse.json(
        { error: 'Unsupported platform' },
        { status: 400 }
      );
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { id: session.user.id },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get or create Late.dev profile
    let profileId = client.lateDevProfileId;
    
    if (!profileId) {
      profileId = await getOrCreateProfile(client.companyName || client.name);
      
      // Save profile ID
      await prisma.client.update({
        where: { id: client.id },
        data: { lateDevProfileId: profileId },
      });
    }

    // Create platform-specific invite with client ID for callback
    const invite = await createPlatformInvite(platform, profileId);

    return NextResponse.json({
      inviteUrl: invite.inviteUrl,
      platform,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error('Late.dev platform invite error:', error);
    return NextResponse.json(
      { error: 'Failed to generate invite' },
      { status: 500 }
    );
  }
}
