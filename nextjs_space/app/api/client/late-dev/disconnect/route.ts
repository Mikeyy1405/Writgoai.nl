

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { disconnectAccount } from '@/lib/latedev';

/**
 * DELETE /api/client/latedev/disconnect
 * Disconnect a Late.dev account
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID required' },
        { status: 400 }
      );
    }

    // Find the account
    const account = await prisma.lateDevAccount.findFirst({
      where: {
        id: accountId,
        clientId: session.user.id,
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Disconnect from Late.dev
    try {
      await disconnectAccount(account.lateDevProfileId);
    } catch (error) {
      console.error('Error disconnecting from Late.dev:', error);
      // Continue even if API call fails
    }

    // Mark as disconnected in database
    await prisma.lateDevAccount.update({
      where: { id: account.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Late.dev disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect account' },
      { status: 500 }
    );
  }
}
