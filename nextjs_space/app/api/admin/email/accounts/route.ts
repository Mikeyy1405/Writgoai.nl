export const dynamic = "force-dynamic";

/**
 * API Routes for Email Mailbox Accounts Management
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { encrypt, decrypt } from '@/lib/encryption';

/**
 * GET - Fetch all mailbox accounts
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For admin, fetch all accounts or filter by clientId if provided
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    const where = clientId ? { clientId } : {};

    const accounts = await prisma.mailboxConnection.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Decrypt passwords for display (in real app, never send passwords to frontend)
    // For settings page, we'll return masked passwords
    const safeAccounts = accounts.map((account: any) => ({
      ...account,
      password: account.password ? '••••••••' : null,
      accessToken: account.accessToken ? '••••••••' : null,
      refreshToken: account.refreshToken ? '••••••••' : null,
    }));

    return NextResponse.json({ accounts: safeAccounts });
  } catch (error: any) {
    console.error('Error fetching mailbox accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mailbox accounts', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Create or update mailbox account
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      clientId,
      provider,
      email,
      displayName,
      imapHost,
      imapPort,
      imapTls,
      smtpHost,
      smtpPort,
      smtpTls,
      password,
      isActive,
    } = body;

    // Validate required fields
    if (!email || !provider) {
      return NextResponse.json(
        { error: 'Email and provider are required' },
        { status: 400 }
      );
    }

    // For IMAP provider, validate IMAP settings
    if (provider === 'imap') {
      if (!imapHost || !imapPort || !password) {
        return NextResponse.json(
          { error: 'IMAP host, port, and password are required for IMAP provider' },
          { status: 400 }
        );
      }
    }

    // Encrypt password
    const encryptedPassword = password ? encrypt(password) : null;

    // If id is provided, update existing account
    if (id) {
      const updated = await prisma.mailboxConnection.update({
        where: { id },
        data: {
          provider,
          email,
          displayName,
          imapHost,
          imapPort: imapPort ? parseInt(imapPort) : 993,
          imapTls: imapTls ?? true,
          smtpHost,
          smtpPort: smtpPort ? parseInt(smtpPort) : 587,
          smtpTls: smtpTls ?? true,
          password: encryptedPassword,
          isActive: isActive ?? true,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        account: {
          ...updated,
          password: '••••••••',
        },
      });
    }

    // Create new account
    const account = await prisma.mailboxConnection.create({
      data: {
        clientId: clientId || session.user.id, // Use session user id if no clientId provided
        provider,
        email,
        displayName,
        imapHost,
        imapPort: imapPort ? parseInt(imapPort) : 993,
        imapTls: imapTls ?? true,
        smtpHost,
        smtpPort: smtpPort ? parseInt(smtpPort) : 587,
        smtpTls: smtpTls ?? true,
        password: encryptedPassword,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      account: {
        ...account,
        password: '••••••••',
      },
    });
  } catch (error: any) {
    console.error('Error creating/updating mailbox account:', error);
    return NextResponse.json(
      { error: 'Failed to save mailbox account', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete mailbox account
 */
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    await prisma.mailboxConnection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting mailbox account:', error);
    return NextResponse.json(
      { error: 'Failed to delete mailbox account', details: error.message },
      { status: 500 }
    );
  }
}
