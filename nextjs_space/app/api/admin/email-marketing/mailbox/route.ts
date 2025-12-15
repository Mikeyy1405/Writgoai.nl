/**
 * Mailbox Connections API
 * Manage email account connections (IMAP/SMTP and OAuth)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { encryptPassword, testImapConnection, testSmtpConnection } from '@/lib/email-mailbox-sync';

export const dynamic = 'force-dynamic';

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

    const mailboxes = await prisma.mailboxConnection.findMany({
      where: { clientId: client.id },
      select: {
        id: true,
        provider: true,
        email: true,
        displayName: true,
        authType: true,
        isActive: true,
        lastSyncAt: true,
        emailsCount: true,
        createdAt: true,
        // Don't return passwords or tokens
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ mailboxes });
  } catch (error: any) {
    console.error('[Mailbox] Error fetching mailboxes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch mailboxes' },
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

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      provider,
      email,
      displayName,
      authType,
      imapHost,
      imapPort,
      imapUsername,
      imapPassword,
      smtpHost,
      smtpPort,
      smtpUsername,
      smtpPassword,
    } = body;

    if (!provider || !email || !authType) {
      return NextResponse.json(
        { error: 'Provider, email, and auth type are required' },
        { status: 400 }
      );
    }

    // For IMAP/SMTP, validate connection first
    if (authType === 'imap_smtp') {
      if (!imapHost || !imapPort || !imapUsername || !imapPassword) {
        return NextResponse.json(
          { error: 'IMAP configuration is incomplete' },
          { status: 400 }
        );
      }

      if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword) {
        return NextResponse.json(
          { error: 'SMTP configuration is incomplete' },
          { status: 400 }
        );
      }

      // Test connections
      const imapTest = await testImapConnection(
        imapHost,
        imapPort,
        imapUsername,
        imapPassword
      );

      if (!imapTest.success) {
        return NextResponse.json(
          { error: `IMAP connection failed: ${imapTest.error}` },
          { status: 400 }
        );
      }

      const smtpTest = await testSmtpConnection(
        smtpHost,
        smtpPort,
        smtpUsername,
        smtpPassword
      );

      if (!smtpTest.success) {
        return NextResponse.json(
          { error: `SMTP connection failed: ${smtpTest.error}` },
          { status: 400 }
        );
      }

      // Encrypt passwords
      const encryptedImapPassword = encryptPassword(imapPassword);
      const encryptedSmtpPassword = encryptPassword(smtpPassword);

      // Create mailbox connection
      const mailbox = await prisma.mailboxConnection.create({
        data: {
          clientId: client.id,
          provider,
          email,
          displayName,
          authType,
          imapHost,
          imapPort,
          imapUsername,
          imapPassword: encryptedImapPassword,
          smtpHost,
          smtpPort,
          smtpUsername,
          smtpPassword: encryptedSmtpPassword,
          isActive: true,
        },
      });

      return NextResponse.json({
        mailbox: {
          id: mailbox.id,
          provider: mailbox.provider,
          email: mailbox.email,
          displayName: mailbox.displayName,
          isActive: mailbox.isActive,
        },
      }, { status: 201 });
    }

    // For OAuth, we would handle the OAuth flow here
    // This is a simplified version
    return NextResponse.json(
      { error: 'OAuth flow not implemented yet' },
      { status: 501 }
    );
  } catch (error: any) {
    console.error('[Mailbox] Error creating mailbox:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create mailbox connection' },
      { status: 500 }
    );
  }
}
