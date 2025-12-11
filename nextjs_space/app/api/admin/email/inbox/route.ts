export const dynamic = "force-dynamic";

/**
 * API Route for Fetching Emails from Inbox
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { fetchEmails } from '@/lib/email/imap-client';

/**
 * GET - Fetch emails from inbox via IMAP
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const folder = searchParams.get('folder') || 'INBOX';
    const limit = parseInt(searchParams.get('limit') || '50');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Get mailbox account
    let account;
    
    if (accountId) {
      account = await prisma.mailboxConnection.findUnique({
        where: { id: accountId },
      });
    } else {
      // Get the first active account for the user
      account = await prisma.mailboxConnection.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!account) {
      return NextResponse.json(
        { error: 'No email account configured' },
        { status: 404 }
      );
    }

    // Decrypt password
    let password: string;
    try {
      password = decrypt((account as any).password);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to decrypt password. Please reconfigure your email account.' },
        { status: 500 }
      );
    }

    // Fetch emails from IMAP
    const result = await fetchEmails(
      {
        host: (account as any).imapHost,
        port: (account as any).imapPort,
        username: (account as any).email,
        password,
        tls: (account as any).imapTls,
      },
      {
        folder,
        limit,
        unreadOnly,
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch emails' },
        { status: 500 }
      );
    }

    // Update last sync time
    await prisma.mailboxConnection.update({
      where: { id: (account as any).id },
      data: {
        lastSyncAt: new Date(),
        lastError: null,
      },
    });

    return NextResponse.json({
      success: true,
      emails: result.emails,
      total: result.total,
      account: {
        id: (account as any).id,
        email: (account as any).email,
        displayName: (account as any).displayName,
      },
    });
  } catch (error: any) {
    console.error('Error fetching inbox:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inbox', details: error.message },
      { status: 500 }
    );
  }
}
