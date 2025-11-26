
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.email !== 'info@writgo.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total clients
    const totalClients = await prisma.client.count();
    
    // Get active clients (logged in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeClients = await prisma.client.count({
      where: {
        updatedAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Get total credits purchased
    const creditStats = await prisma.client.aggregate({
      _sum: {
        totalCreditsPurchased: true,
        totalCreditsUsed: true,
        subscriptionCredits: true,
        topUpCredits: true
      }
    });

    // Get subscription counts
    const subscriptionCounts = await prisma.client.groupBy({
      by: ['subscriptionPlan'],
      _count: true,
      where: {
        subscriptionStatus: 'active'
      }
    });

    // Get recent activity (last 10)
    const recentActivity = await prisma.clientActivityLog.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        client: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Get total revenue (sum of credit purchases)
    const revenueData = await prisma.creditPurchase.aggregate({
      _sum: {
        priceEur: true,
        credits: true
      },
      where: {
        paymentStatus: 'completed'
      }
    });

    // Get monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyRevenue = await prisma.creditPurchase.groupBy({
      by: ['createdAt'],
      _sum: {
        priceEur: true
      },
      where: {
        paymentStatus: 'completed',
        createdAt: {
          gte: sixMonthsAgo
        }
      }
    });

    return NextResponse.json({
      totalClients,
      activeClients,
      credits: {
        totalPurchased: creditStats._sum.totalCreditsPurchased || 0,
        totalUsed: creditStats._sum.totalCreditsUsed || 0,
        currentSubscription: creditStats._sum.subscriptionCredits || 0,
        currentTopUp: creditStats._sum.topUpCredits || 0
      },
      subscriptions: subscriptionCounts,
      recentActivity,
      revenue: {
        total: revenueData._sum.priceEur || 0,
        totalCredits: revenueData._sum.credits || 0,
        monthly: monthlyRevenue
      }
    });

  } catch (error) {
    console.error('Error fetching super admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
