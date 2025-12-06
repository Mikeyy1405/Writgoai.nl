
/**
 * Platform Connection API
 * Generates invite link for specific platform - ALWAYS creates fresh invite
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createPlatformInvite } from '@/lib/late-dev-api';

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

    // ALWAYS create a fresh invite to avoid expired token issues
    console.log('[Connect] Creating fresh invite for:', platform);
    const invite = await createPlatformInvite(profileId, platform);

    if (!invite) {
      return NextResponse.json(
        { error: 'Kon invite link niet aanmaken' },
        { status: 500 }
      );
    }

    console.log('[Connect] Fresh invite created, expires:', invite.expiresAt);

    return NextResponse.json({
      success: true,
      inviteUrl: invite.inviteUrl,
      platform: invite.platform,
      expiresAt: invite.expiresAt,
    });
  } catch (error: any) {
    console.error('[Connect] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
