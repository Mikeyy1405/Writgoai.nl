
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createPlatformInvite, createLateDevProfile } from '@/lib/late-dev-api';

/**
 * Generate Late.dev invite link for connecting social media accounts
 * POST /api/client/late-dev/connect
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { projectId, platform } = await req.json();

    if (!projectId || !platform) {
      return NextResponse.json({ error: 'Project ID and platform are required' }, { status: 400 });
    }

    // Verify project belongs to client
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
      include: {
        socialMediaConfig: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Ensure we have a Late.dev profile for this project
    let profileId = project.socialMediaConfig?.lateDevProfileId;
    
    if (!profileId) {
      console.log('[Late.dev Connect] No profile found, creating one...');
      const profileResult = await createLateDevProfile(project.name, project.id);
      
      if (!profileResult) {
        return NextResponse.json(
          { error: 'Failed to create Late.dev profile' },
          { status: 500 }
        );
      }

      profileId = profileResult.profileId;

      // Save profile ID in database
      await prisma.socialMediaConfig.upsert({
        where: { projectId },
        create: {
          projectId,
          lateDevProfileId: profileResult.profileId,
          lateDevProfileName: profileResult.name,
        },
        update: {
          lateDevProfileId: profileResult.profileId,
          lateDevProfileName: profileResult.name,
        },
      });
    }

    // Create platform invite using late-dev-api
    console.log('[Late.dev Connect] Creating platform invite for:', platform);
    const invite = await createPlatformInvite(profileId, platform);

    if (!invite) {
      return NextResponse.json(
        { error: 'Failed to create invite link' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      inviteUrl: invite.inviteUrl,
      inviteId: invite._id,
      expiresAt: invite.expiresAt,
    });
  } catch (error: any) {
    console.error('[Late.dev Connect] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
