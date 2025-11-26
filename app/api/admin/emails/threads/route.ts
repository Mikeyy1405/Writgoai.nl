
/**
 * Email Threads API
 * Get all email threads
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

    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status') || 'open';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get threads with email count
    const threads = await prisma.emailThread.findMany({
      where: status !== 'all' ? { status } : undefined,
      include: {
        emails: {
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
            isIncoming: true,
          },
          orderBy: { receivedAt: 'desc' },
          take: 1, // Get the latest email for preview
        },
        _count: {
          select: { emails: true },
        },
      },
      orderBy: { lastActivity: 'desc' },
      skip,
      take: limit,
    });

    const total = await prisma.emailThread.count({
      where: status !== 'all' ? { status } : undefined,
    });

    return NextResponse.json({
      threads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Admin] Error fetching threads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    );
  }
}
