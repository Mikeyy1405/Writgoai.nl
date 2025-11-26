

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getProfileAccounts } from '@/lib/latedev';

/**
 * GET /api/client/latedev/accounts
 * Get all connected Late.dev accounts for the client
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client with Late.dev accounts
    const client = await prisma.client.findUnique({
      where: { id: session.user.id },
      include: {
        lateDevAccounts: {
          where: { isActive: true },
          orderBy: { connectedAt: 'desc' },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // If no profile ID yet, return empty
    if (!client.lateDevProfileId) {
      return NextResponse.json({ accounts: [] });
    }

    // Sync with Late.dev API
    try {
      const lateDevAccounts = await getProfileAccounts(client.lateDevProfileId);
      
      // Update database with latest accounts
      for (const account of lateDevAccounts) {
        // Check if account already exists
        const existing = await prisma.lateDevAccount.findUnique({
          where: { lateDevProfileId: account._id },
        });

        if (existing) {
          // Update existing account
          await prisma.lateDevAccount.update({
            where: { id: existing.id },
            data: {
              username: account.username,
              displayName: account.displayName,
              avatar: account.avatar,
              isActive: true,
              lastUsedAt: new Date(),
            },
          });
        } else {
          // Create new account
          await prisma.lateDevAccount.create({
            data: {
              clientId: client.id,
              lateDevProfileId: account._id,
              platform: account.platform,
              username: account.username,
              displayName: account.displayName,
              avatar: account.avatar,
              isActive: true,
            },
          });
        }
      }

      // Get updated accounts from database
      const accounts = await prisma.lateDevAccount.findMany({
        where: {
          clientId: client.id,
          isActive: true,
        },
        orderBy: { connectedAt: 'desc' },
      });

      return NextResponse.json({ accounts });
    } catch (syncError) {
      console.error('Error syncing Late.dev accounts:', syncError);
      
      // Return cached accounts from database
      return NextResponse.json({ accounts: client.lateDevAccounts });
    }
  } catch (error) {
    console.error('Late.dev accounts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}
