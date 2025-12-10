/**
 * Single Email API
 * GET    /api/admin/emails/[id] - Get full email
 * PATCH  /api/admin/emails/[id] - Update email (read/star/archive)
 * DELETE /api/admin/emails/[id] - Delete email
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin only
    if (!session?.user?.email || session.user.email !== 'admin@WritgoAI.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = await prisma.inboxEmail.findUnique({
      where: { id: params.id },
      include: {
        mailbox: {
          select: {
            email: true,
            displayName: true,
          },
        },
      },
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Mark as read when viewed
    if (!email.isRead) {
      await prisma.inboxEmail.update({
        where: { id: params.id },
        data: { isRead: true },
      });
    }

    return NextResponse.json(email);
  } catch (error: any) {
    console.error('[Admin] Error fetching email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch email' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin only
    if (!session?.user?.email || session.user.email !== 'admin@WritgoAI.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { isRead, isStarred, isArchived, folder } = body;

    // Build update data
    const updateData: any = {};
    
    if (typeof isRead === 'boolean') {
      updateData.isRead = isRead;
    }
    
    if (typeof isStarred === 'boolean') {
      updateData.isStarred = isStarred;
    }
    
    if (typeof isArchived === 'boolean') {
      updateData.isArchived = isArchived;
      if (isArchived) {
        updateData.folder = 'archived';
      }
    }
    
    if (folder) {
      updateData.folder = folder;
    }

    updateData.updatedAt = new Date();

    const email = await prisma.inboxEmail.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(email);
  } catch (error: any) {
    console.error('[Admin] Error updating email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update email' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin only
    if (!session?.user?.email || session.user.email !== 'admin@WritgoAI.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.inboxEmail.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Admin] Error deleting email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete email' },
      { status: 500 }
    );
  }
}
