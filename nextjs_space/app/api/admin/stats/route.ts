
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
    // Check session with timeout
    const session = await Promise.race([
      getServerSession(authOptions),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session check timeout')), 5000)
      )
    ]).catch((error) => {
      console.error('Session check failed:', error);
      return null;
    });

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
        totalClients: totalClients || 0,
        activeSubscriptions: activeSubscriptions || 0,
        pendingFeedback: pendingFeedback || 0,
        unreadMessages: unreadMessages || 0,
        unreadSupport: unreadSupport || 0,
        totalContentGenerated: totalContentGenerated || 0,
        creditsUsedThisMonth: Math.abs(creditsUsedThisMonth._sum.amount || 0),
        revenueThisMonth: revenueThisMonth._sum.priceEur || 0,
        pendingPayouts: pendingPayouts || 0,
        pendingPayoutAmount: pendingPayoutAmount._sum.amount || 0
      },
      recentActivities: {
        recentClients: recentClients || [],
        recentFeedback: recentFeedback || []
      }
    });
  } catch (error) {
    console.error('[Admin Stats API] Error:', error);
    
    // Return a more descriptive error
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Er is een onbekende fout opgetreden';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch stats',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
