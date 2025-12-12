import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';
import { getlateClient } from '@/lib/getlate/client';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/social/accounts/[id]
 * Disconnect a social media account
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = params.id;

    // Get the account from our database
    const account = await prisma.connectedSocialAccount.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Verify user owns this project
    const project = await prisma.project.findUnique({
      where: { id: account.projectId },
      include: {
        client: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user has access to this project
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client || client.id !== project.clientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Step 1: Disconnect from Getlate
    try {
      await getlateClient.disconnectAccount(account.getlateAccountId);
      console.log('✓ Disconnected from Getlate:', account.getlateAccountId);
    } catch (error) {
      console.error('Failed to disconnect from Getlate:', error);
      // Continue with database deletion even if Getlate fails
    }

    // Step 2: Delete from our database
    await prisma.connectedSocialAccount.delete({
      where: { id: accountId }
    });

    console.log('✓ Deleted from database:', accountId);

    return NextResponse.json({
      success: true,
      message: 'Account disconnected successfully'
    });
  } catch (error) {
    console.error('Failed to disconnect account:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect account' },
      { status: 500 }
    );
  }
}
