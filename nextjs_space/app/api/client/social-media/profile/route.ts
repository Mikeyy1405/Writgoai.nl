
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { 

  createLateDevProfile, 
  getLateDevAccountsByProfile,
  createPlatformInvite,
  getPlatformInvites
} from '@/lib/late-dev-api';

export const dynamic = 'force-dynamic';

/**
 * GET: Haal profile informatie op
 * POST: Maak nieuw profile aan voor project
 */

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID vereist' }, { status: 400 });
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

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Als er nog geen profile is, return dat we er een moeten aanmaken
    if (!project.socialMediaConfig?.lateDevProfileId) {
      return NextResponse.json({
        hasProfile: false,
        profileId: null,
        connectedAccounts: [],
        pendingInvites: [],
      });
    }

    // Haal connected accounts op
    const accounts = await getLateDevAccountsByProfile(
      project.socialMediaConfig.lateDevProfileId
    );

    // Haal pending invites op
    const invites = await getPlatformInvites(
      project.socialMediaConfig.lateDevProfileId
    );

    return NextResponse.json({
      hasProfile: true,
      profileId: project.socialMediaConfig.lateDevProfileId,
      profileName: project.socialMediaConfig.lateDevProfileName,
      connectedAccounts: accounts,
      pendingInvites: invites.filter(inv => !inv.isUsed),
    });
  } catch (error: any) {
    console.error('[Social Media Profile] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID vereist' }, { status: 400 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: { email: session.user.email },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Create Late.dev profile
    const profileResult = await createLateDevProfile(project.name, project.id);

    if (!profileResult) {
      return NextResponse.json(
        { error: 'Kon Late.dev profile niet aanmaken' },
        { status: 500 }
      );
    }

    // Save profile ID in database
    const config = await prisma.socialMediaConfig.upsert({
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

    return NextResponse.json({
      success: true,
      profileId: profileResult.profileId,
      profileName: profileResult.name,
    });
  } catch (error: any) {
    console.error('[Social Media Profile] Error creating profile:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
