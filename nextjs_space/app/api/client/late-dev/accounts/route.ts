
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getLateDevAccountsByProfile, createLateDevProfile } from '@/lib/late-dev-api';

/**
 * Get connected accounts for a project
 * GET /api/client/late-dev/accounts?projectId=xxx
 * Automatically creates a Late.dev profile if one doesn't exist
 */
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
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

    // Ensure we have a Late.dev profile for this project (auto-create if needed)
    let profileId = project.socialMediaConfig?.lateDevProfileId;
    
    if (!profileId) {
      console.log('[Late.dev Accounts] No profile found, creating one...');
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

    // Get stored accounts from our database
    const storedAccounts = await prisma.lateDevAccount.findMany({
      where: {
        projectId: projectId,
        clientId: client.id,
        isActive: true,
      },
      orderBy: {
        connectedAt: 'desc',
      },
    });

    // Fetch latest data from Late.dev API for this specific profile
    let lateDevAccounts: any[] = [];
    try {
      lateDevAccounts = await getLateDevAccountsByProfile(profileId);
    } catch (error) {
      console.error('[Late.dev] Failed to fetch accounts from API:', error);
    }

    // Merge stored accounts with latest data from Late.dev
    const accounts = storedAccounts.map(account => {
      const lateDevAccount = lateDevAccounts.find(
        (a: any) => a._id === account.lateDevProfileId
      );

      return {
        id: account.id,
        lateDevProfileId: account.lateDevProfileId,
        platform: account.platform,
        username: lateDevAccount?.username || account.username,
        displayName: lateDevAccount?.displayName || account.displayName,
        avatar: lateDevAccount?.avatar || account.avatar,
        connectedAt: account.connectedAt,
        lastUsedAt: account.lastUsedAt,
        isActive: account.isActive,
      };
    });

    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error('[Late.dev Accounts] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Save/update connected account after user completes OAuth flow
 * POST /api/client/late-dev/accounts
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

    const { projectId, lateDevProfileId, platform, username, displayName, avatar } = await req.json();

    if (!projectId || !lateDevProfileId || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify project belongs to client
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Upsert account
    const account = await prisma.lateDevAccount.upsert({
      where: {
        lateDevProfileId: lateDevProfileId,
      },
      update: {
        username,
        displayName,
        avatar,
        isActive: true,
        lastUsedAt: new Date(),
      },
      create: {
        projectId,
        clientId: client.id,
        lateDevProfileId,
        platform,
        username,
        displayName,
        avatar,
        isActive: true,
      },
    });

    return NextResponse.json({ account });
  } catch (error: any) {
    console.error('[Late.dev Save Account] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Disconnect an account
 * DELETE /api/client/late-dev/accounts?accountId=xxx
 */
export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    // Verify account belongs to client
    const account = await prisma.lateDevAccount.findFirst({
      where: {
        id: accountId,
        clientId: client.id,
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Soft delete (mark as inactive)
    await prisma.lateDevAccount.update({
      where: { id: accountId },
      data: { isActive: false },
    });

    // Note: We don't disconnect from Late.dev API directly
    // The account remains connected in Late.dev but is marked inactive in our database

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Late.dev Disconnect] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
