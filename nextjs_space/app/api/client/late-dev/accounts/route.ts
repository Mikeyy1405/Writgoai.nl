
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

const LATE_DEV_API_KEY = process.env.LATE_DEV_API_KEY;
const LATE_DEV_API_URL = 'https://getlate.dev/api/v1';

/**
 * Get connected accounts for a project
 * GET /api/client/late-dev/accounts?projectId=xxx
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
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
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

    // Also fetch latest data from Late.dev API to sync
    let lateDevAccounts: any[] = [];
    try {
      const response = await fetch(`${LATE_DEV_API_URL}/accounts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${LATE_DEV_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        lateDevAccounts = data.accounts || data || [];
      }
    } catch (error) {
      console.error('[Late.dev] Failed to fetch accounts:', error);
    }

    // Merge stored accounts with latest data from Late.dev
    const accounts = storedAccounts.map(account => {
      const lateDevAccount = lateDevAccounts.find(
        (a: any) => a.id === account.lateDevProfileId
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

    // Optionally disconnect from Late.dev API (if needed)
    if (account.lateDevProfileId) {
      try {
        await fetch(`${LATE_DEV_API_URL}/accounts/${account.lateDevProfileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${LATE_DEV_API_KEY}`,
          },
        });
      } catch (error) {
        console.error('[Late.dev] Failed to disconnect account:', error);
        // Continue even if API call fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Late.dev Disconnect] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
