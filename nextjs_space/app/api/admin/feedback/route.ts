
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma as db } from '@/lib/db';

/**
 * GET /api/admin/feedback - Alle feedback items ophalen
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const feedback = await db.feedback.findMany({
      where: {
        ...(status && { status }),
        ...(category && { category })
      },
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
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/feedback - Update feedback status/response
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feedbackId, status, adminResponse, adminNotes } = await request.json();

    const feedback = await db.feedback.update({
      where: { id: feedbackId },
      data: {
        ...(status && { status }),
        ...(adminResponse && {
          adminResponse,
          respondedAt: new Date(),
          respondedBy: session.user.email
        }),
        ...(adminNotes && { adminNotes })
      },
      include: {
        client: true
      }
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}
