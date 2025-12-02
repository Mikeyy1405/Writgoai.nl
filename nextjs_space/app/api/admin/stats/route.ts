
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma as db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stats - Get admin dashboard stats
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all counts in parallel
    const [
      totalClients,
      activeSubscriptions,
      pendingFeedback,
      unreadMessages,
      unreadSupport,
      totalContentGenerated,
      creditsUsedThisMonth,
      revenueThisMonth,
      pendingPayouts,
      pendingPayoutAmount
    ] = await Promise.all([
      db.client.count(),
      db.client.count({
        where: { subscriptionStatus: 'active' }
      }),
      db.feedback.count({
        where: { status: 'pending' }
      }),
      db.directMessage.count({
        where: {
          fromRole: 'client',
          isRead: false
        }
      }),
      db.supportEmail.count({
        where: {
          isRead: false,
          status: { not: 'resolved' }
        }
      }),
      db.contentPiece.count(),
      db.creditTransaction.aggregate({
        where: {
          type: 'usage',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { amount: true }
      }),
      db.creditPurchase.aggregate({
        where: {
          paymentStatus: 'completed',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { priceEur: true }
      }),
      db.affiliatePayout.count({
        where: { status: 'requested' }
      }),
      db.affiliatePayout.aggregate({
        where: { status: 'requested' },
        _sum: { amount: true }
      })
    ]);

    // Get recent activities
    const recentClients = await db.client.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        subscriptionPlan: true
      }
    });

    const recentFeedback = await db.feedback.findMany({
      take: 5,
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      stats: {
        totalClients,
        activeSubscriptions,
        pendingFeedback,
        unreadMessages,
        unreadSupport,
        totalContentGenerated,
        creditsUsedThisMonth: Math.abs(creditsUsedThisMonth._sum.amount || 0),
        revenueThisMonth: revenueThisMonth._sum.priceEur || 0,
        pendingPayouts,
        pendingPayoutAmount: pendingPayoutAmount._sum.amount || 0
      },
      recentActivities: {
        recentClients,
        recentFeedback
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
