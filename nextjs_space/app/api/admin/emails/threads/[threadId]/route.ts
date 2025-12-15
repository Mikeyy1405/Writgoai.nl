
/**
 * Single Thread API
 * Get all emails in a thread
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { markEmailAsRead, updateThreadStatus, updateThreadPriority } from '@/lib/email-service';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin only
    if (!session?.user?.email || session.user.email !== 'admin@WritgoAI.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const thread = await prisma.emailThread.findUnique({
      where: { id: params.threadId },
      include: {
        emails: {
          include: {
            attachments: true,
          },
          orderBy: { receivedAt: 'asc' },
        },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Mark all emails in thread as read
    const unreadEmails = thread.emails.filter(e => !e.isRead);
    for (const email of unreadEmails) {
      await markEmailAsRead(email.id);
    }

    return NextResponse.json(thread);
  } catch (error) {
    console.error('[Admin] Error fetching thread:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin only
    if (!session?.user?.email || session.user.email !== 'admin@WritgoAI.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { status, priority, assignedTo, tags } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (tags !== undefined) updateData.tags = tags;

    const thread = await prisma.emailThread.update({
      where: { id: params.threadId },
      data: updateData,
    });

    return NextResponse.json({ success: true, thread });
  } catch (error) {
    console.error('[Admin] Error updating thread:', error);
    return NextResponse.json(
      { error: 'Failed to update thread' },
      { status: 500 }
    );
  }
}
