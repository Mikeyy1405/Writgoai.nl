

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getOrCreateProfile, createPlatformInvite } from '@/lib/latedev';

/**
 * POST /api/client/latedev/invite
 * Generate a Late.dev platform connection invite URL
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Parse request body for specific platform (optional)
    const body = await request.json().catch(() => ({}));
    const platform = body.platform || null;

    // If specific platform requested, create invite for that platform
    if (platform) {
      const invite = await createPlatformInvite(platform, profileId);
      return NextResponse.json({
        inviteUrl: invite.inviteUrl,
        platform,
        expiresAt: invite.expiresAt,
      });
    }

    // Otherwise, generate a generic invite URL (user will select platform on Late.dev)
    // Direct callback to our app without Late.dev promotion
    const baseUrl = process.env.NEXTAUTH_URL || 'https://WritgoAI.nl';
    const callbackUrl = `${baseUrl}/api/client/latedev/callback?profileId=${profileId}&externalId=${client.id}`;
    const inviteUrl = `https://getlate.dev/connect?profileId=${profileId}&redirectUrl=${encodeURIComponent(callbackUrl)}`;

    return NextResponse.json({
      inviteUrl,
      profileId,
    });
  } catch (error) {
    console.error('Late.dev invite error:', error);
    return NextResponse.json(
      { error: 'Failed to generate invite' },
      { status: 500 }
    );
  }
}
