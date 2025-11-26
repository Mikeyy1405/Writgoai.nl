
/**
 * Platform Connection API
 * Generates invite link for specific platform if not exists
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createPlatformInvite, getPlatformInvites } from '@/lib/late-dev-api';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, platform } = body;

    if (!projectId || !platform) {
      return NextResponse.json(
        { error: 'Project ID en platform zijn vereist' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: { email: session.user.email },
      },
      include: {
        socialMediaConfig: true,
      },
    });

    if (!project || !project.socialMediaConfig) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    if (!project.socialMediaConfig.lateDevProfileId) {
      return NextResponse.json(
        { error: 'Geen Late.dev profile gevonden. Run auto-setup eerst.' },
        { status: 400 }
      );
    }

    const profileId = project.socialMediaConfig.lateDevProfileId;

    // Check of er al een invite bestaat voor dit platform MET geldige URL
    try {
      const existingInvites = await getPlatformInvites(profileId);
      const platformInvite = existingInvites.find(
        inv => inv.platform === platform && !inv.isUsed && inv.inviteUrl
      );

      if (platformInvite) {
        console.log('[Connect] Using existing invite for:', platform);
        return NextResponse.json({
          success: true,
          inviteUrl: platformInvite.inviteUrl,
          platform,
        });
      }
    } catch (error) {
      console.error('[Connect] Error checking existing invites:', error);
    }

    // Maak nieuwe invite aan
    console.log('[Connect] Creating new invite for:', platform);
    const invite = await createPlatformInvite(profileId, platform);

    if (!invite) {
      return NextResponse.json(
        { error: 'Kon invite link niet aanmaken' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inviteUrl: invite.inviteUrl,
      platform: invite.platform,
    });
  } catch (error: any) {
    console.error('[Connect] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
