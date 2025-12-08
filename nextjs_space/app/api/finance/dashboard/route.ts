import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import {
  calculateMRR,
  calculateARR,
  getGrowthMetrics,
  getQuickFinancialSummary,
} from '@/lib/ai-finance';

const prisma = new PrismaClient();

/**
 * GET /api/finance/dashboard
 * Get real-time financial overview data
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get quick summary
    const summary = await getQuickFinancialSummary();

    // Get MRR data
    const mrrData = await calculateMRR();
    const arr = await calculateARR();

    // Get growth metrics
    const growthMetrics = await getGrowthMetrics();

    // Get recent transactions
    const recentInvoices = await prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const recentExpenses = await prisma.purchaseInvoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        invoiceNumber: true,
        supplierName: true,
        total: true,
        category: true,
        invoiceDate: true,
        status: true,
      },
    });

    // Get financial alerts
    const alerts = await prisma.financialAlert.findMany({
      where: {
        dismissed: false,
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 10,
    });

    // Calculate net profit (revenue - expenses) for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = await prisma.invoice.aggregate({
      where: {
        issueDate: {
          gte: startOfMonth,
        },
        status: 'paid',
      },
      _sum: {
        total: true,
      },
    });

    const monthlyExpenses = await prisma.purchaseInvoice.aggregate({
      where: {
        invoiceDate: {
          gte: startOfMonth,
        },
        status: 'paid',
      },
      _sum: {
        total: true,
      },
    });

    const netProfit = (monthlyRevenue._sum.total || 0) - (monthlyExpenses._sum.total || 0);

    return NextResponse.json({
      overview: {
        mrr: mrrData.mrr,
        arr,
        activeSubscriptions: mrrData.activeSubscriptions,
        averageRevenuePerClient: mrrData.averageRevenuePerClient,
        outstandingInvoices: summary.outstandingInvoices,
        outstandingAmount: summary.outstandingAmount,
        monthlyRevenue: monthlyRevenue._sum.total || 0,
        monthlyExpenses: monthlyExpenses._sum.total || 0,
        netProfit,
      },
      growth: growthMetrics,
      mrrBreakdown: mrrData.breakdown,
      recentInvoices,
      recentExpenses,
      alerts,
    });
  } catch (error: any) {
    console.error('[Finance Dashboard API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
