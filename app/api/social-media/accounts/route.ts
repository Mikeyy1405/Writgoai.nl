

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getAccounts } from '@/lib/getlate';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = (session.user as any).id;

    // Get accounts from database
    const savedAccounts = await prisma.socialMediaAccount.findMany({
      where: { clientId },
      orderBy: { connectedAt: 'desc' },
    });

    // Also fetch from GetLate.dev to get latest status
    try {
      const lateDevAccounts = await getAccounts();
      
      // Merge data
      const mergedAccounts = savedAccounts.map((account: any) => {
        const lateDevAccount = lateDevAccounts?.accounts?.find(
          (a: any) => a.platform === account.platform && a.profileId === account.profileId
        );
        
        return {
          ...account,
          isConnected: lateDevAccount ? true : false,
          lateDevData: lateDevAccount || account.lateDevData,
        };
      });

      return NextResponse.json({ accounts: mergedAccounts });
    } catch (error) {
      // If GetLate.dev call fails, just return saved accounts
      console.error('Error fetching from GetLate.dev:', error);
      return NextResponse.json({ accounts: savedAccounts });
    }
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform, accountName, accountHandle, profileId, accountId, lateDevData } = await req.json();
    const clientId = (session.user as any).id;

    // Check if account already exists
    const existing = await prisma.socialMediaAccount.findFirst({
      where: {
        clientId,
        platform,
        profileId,
      },
    });

    if (existing) {
      // Update existing account
      const updated = await prisma.socialMediaAccount.update({
        where: { id: existing.id },
        data: {
          accountName,
          accountHandle,
          accountId,
          lateDevData,
          isActive: true,
          lastUsedAt: new Date(),
        },
      });

      return NextResponse.json({ account: updated });
    }

    // Create new account
    const account = await prisma.socialMediaAccount.create({
      data: {
        clientId,
        platform,
        accountName,
        accountHandle,
        profileId,
        accountId,
        lateDevData,
        isActive: true,
      },
    });

    return NextResponse.json({ account });
  } catch (error) {
    console.error('Error saving account:', error);
    return NextResponse.json({ error: 'Failed to save account' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('id');

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    const clientId = (session.user as any).id;

    // Delete account
    await prisma.socialMediaAccount.deleteMany({
      where: {
        id: accountId,
        clientId, // Ensure user owns this account
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
