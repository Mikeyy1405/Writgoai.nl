
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma as db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/support-emails - Get support inbox
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const emails = await db.supportEmail.findMany({
      where: status ? { status } : undefined,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        receivedAt: 'desc'
      }
    });

    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Error fetching support emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support emails' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/support-emails - Update email status
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emailId, status, priority, category, assignedTo, isRead } = await request.json();

    const email = await db.supportEmail.update({
      where: { id: emailId },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(category && { category }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(isRead !== undefined && {
          isRead,
          ...(isRead && { readAt: new Date() })
        }),
        ...(status === 'resolved' && { resolvedAt: new Date() })
      }
    });

    return NextResponse.json({ email });
  } catch (error) {
    console.error('Error updating support email:', error);
    return NextResponse.json(
      { error: 'Failed to update support email' },
      { status: 500 }
    );
  }
}
