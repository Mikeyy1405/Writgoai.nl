
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createPlatformInvite } from '@/lib/late-dev-api';

export const dynamic = 'force-dynamic';

/**
 * POST: Maak platform invite aan voor client
 */

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
        { error: 'Geen Late.dev profile gevonden. Maak eerst een profile aan.' },
        { status: 400 }
      );
    }

    // Create platform invite
    const invite = await createPlatformInvite(
      project.socialMediaConfig.lateDevProfileId,
      platform
    );

    if (!invite) {
      return NextResponse.json(
        { error: 'Kon invite link niet aanmaken' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invite: {
        id: invite._id,
        platform: invite.platform,
        inviteUrl: invite.inviteUrl,
        expiresAt: invite.expiresAt,
        isUsed: invite.isUsed,
      },
    });
  } catch (error: any) {
    console.error('[Platform Invites] Error creating invite:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
