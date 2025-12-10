/**
 * Admin Emails API
 * GET /api/admin/emails - List emails with pagination and filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin only
    if (!session?.user?.email || session.user.email !== 'admin@WritgoAI.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get('folder') || 'inbox';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const isRead = searchParams.get('isRead');
    const isStarred = searchParams.get('isStarred');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {
      folder,
    };

    if (isRead !== null) {
      where.isRead = isRead === 'true';
    }

    if (isStarred !== null) {
      where.isStarred = isStarred === 'true';
    }

    if (category) {
      where.aiCategory = category;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { from: { contains: search, mode: 'insensitive' } },
        { textBody: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.inboxEmail.count({ where });

    // Get unread count
    const unread = await prisma.inboxEmail.count({
      where: { ...where, isRead: false },
    });

    // Get emails
    const emails = await prisma.inboxEmail.findMany({
      where,
      orderBy: {
        receivedAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        from: true,
        fromName: true,
        subject: true,
        snippet: true,
        isRead: true,
        isStarred: true,
        hasAttachments: true,
        receivedAt: true,
        aiCategory: true,
        aiPriority: true,
        aiSentiment: true,
        isInvoice: true,
        invoiceAmount: true,
      },
    });

    return NextResponse.json({
      emails,
      total,
      unread,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('[Admin] Error fetching emails:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}
