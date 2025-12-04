/**
 * Email Inbox API
 * View and manage inbox emails with AI analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

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
    const category = searchParams.get('category');
    const isRead = searchParams.get('isRead');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get all mailboxes for this client
    const mailboxes = await prisma.mailboxConnection.findMany({
      where: { clientId: client.id },
      select: { id: true },
    });

    const mailboxIds = mailboxes.map((m) => m.id);

    // Build filters
    const where: any = {
      mailboxId: { in: mailboxIds },
    };

    if (category) {
      where.aiCategory = category;
    }

    if (isRead !== null) {
      where.isRead = isRead === 'true';
    }

    // Get inbox emails
    const emails = await prisma.inboxEmail.findMany({
      where,
      include: {
        mailbox: {
          select: {
            email: true,
            displayName: true,
          },
        },
      },
      orderBy: { receivedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.inboxEmail.count({ where });

    return NextResponse.json({
      emails,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('[Inbox] Error fetching emails:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inbox emails' },
      { status: 500 }
    );
  }
}
