
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

const LATE_DEV_API_KEY = process.env.LATE_DEV_API_KEY;
const LATE_DEV_API_URL = 'https://getlate.dev/api/v1';

/**
 * Sync connected accounts from Late.dev to database
 * POST /api/client/late-dev/sync
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

    const { projectId } = await req.json();

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

    // Fetch all accounts from Late.dev (not profiles)
    const response = await fetch(`${LATE_DEV_API_URL}/accounts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LATE_DEV_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Late.dev] Sync failed:', error);
      return NextResponse.json(
        { error: 'Failed to sync accounts' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const accounts = data.accounts || data || [];

    let syncedCount = 0;
    let newCount = 0;

    // Sync each account to database
    for (const account of accounts) {
      // Check if account already exists for this project
      const existing = await prisma.lateDevAccount.findFirst({
        where: {
          lateDevProfileId: account.id,
          projectId: projectId,
        },
      });

      if (existing) {
        // Update existing
        await prisma.lateDevAccount.update({
          where: { id: existing.id },
          data: {
            platform: account.platform || existing.platform,
            username: account.username,
            displayName: account.displayName,
            avatar: account.avatar,
            isActive: account.isActive !== undefined ? account.isActive : true,
            lastUsedAt: new Date(),
          },
        });
        syncedCount++;
      } else {
        // Create new - only create if we have a valid platform
        if (account.platform) {
          await prisma.lateDevAccount.create({
            data: {
              projectId,
              clientId: client.id,
              lateDevProfileId: account.id,
              platform: account.platform,
              username: account.username,
              displayName: account.displayName,
              avatar: account.avatar,
              isActive: account.isActive !== undefined ? account.isActive : true,
              connectedAt: new Date(),
              lastUsedAt: new Date(),
            },
          });
          newCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      new: newCount,
      total: accounts.length,
    });
  } catch (error: any) {
    console.error('[Late.dev Sync] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
