export const dynamic = "force-dynamic";

/**
 * API Route for Fetching Single Email Message
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { fetchEmailById, markAsRead } from '@/lib/email/imap-client';

/**
 * GET - Fetch single email by UID
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const uid = searchParams.get('uid');
    const folder = searchParams.get('folder') || 'INBOX';
    const markRead = searchParams.get('markRead') === 'true';

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    // Get mailbox account
    let account;
    
    if (accountId) {
      account = await prisma.mailboxConnection.findUnique({
        where: { id: accountId },
      });
    } else {
      // Get the first active account
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

    const config = {
      host: (account as any).imapHost,
      port: (account as any).imapPort,
      username: (account as any).email,
      password,
      tls: (account as any).imapTls,
    };

    // Fetch email
    const result = await fetchEmailById(config, parseInt(uid), folder);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch email' },
        { status: 500 }
      );
    }

    // Mark as read if requested
    if (markRead && result.email && !result.email.isRead) {
      await markAsRead(config, parseInt(uid), folder);
    }

    return NextResponse.json({
      success: true,
      email: result.email,
    });
  } catch (error: any) {
    console.error('Error fetching email:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Mark email as read/unread
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accountId, uid, folder = 'INBOX', action } = body;

    if (!uid || !action) {
      return NextResponse.json(
        { error: 'UID and action are required' },
        { status: 400 }
      );
    }

    // Get mailbox account
    const account = accountId
      ? await prisma.mailboxConnection.findUnique({ where: { id: accountId } })
      : await prisma.mailboxConnection.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        });

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
        { error: 'Failed to decrypt password' },
        { status: 500 }
      );
    }

    const config = {
      host: (account as any).imapHost,
      port: (account as any).imapPort,
      username: (account as any).email,
      password,
      tls: (account as any).imapTls,
    };

    let result;
    if (action === 'markRead') {
      result = await markAsRead(config, parseInt(uid), folder);
    } else if (action === 'markUnread') {
      const { markAsUnread } = await import('@/lib/email/imap-client');
      result = await markAsUnread(config, parseInt(uid), folder);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "markRead" or "markUnread"' },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating email:', error);
    return NextResponse.json(
      { error: 'Failed to update email', details: error.message },
      { status: 500 }
    );
  }
}
