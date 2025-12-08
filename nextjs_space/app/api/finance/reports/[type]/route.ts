import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/finance/reports/[type]
 * Generate financial reports (P&L, Balance Sheet, Cash Flow)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = params;
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (type === 'profit-loss' || type === 'pl') {
      const report = await generateProfitLossReport(start, end);
      return NextResponse.json(report);
    }

    if (type === 'balance-sheet') {
      const report = await generateBalanceSheetReport(end);
      return NextResponse.json(report);
    }

    if (type === 'cash-flow') {
      const report = await generateCashFlowReport(start, end);
      return NextResponse.json(report);
    }

    return NextResponse.json(
      { error: 'Invalid report type' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Finance Reports API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate Profit & Loss Statement
 */
async function generateProfitLossReport(startDate: Date, endDate: Date) {
  // Revenue (Sales Invoices)
  const salesInvoices = await prisma.invoice.findMany({
    where: {
      issueDate: {
        gte: startDate,
        lte: endDate,
      },
      status: 'paid',
    },
  });

  const revenue = salesInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
  const salesVat = salesInvoices.reduce((sum, inv) => sum + inv.taxAmount, 0);

  // Expenses (Purchase Invoices)
  const purchaseInvoices = await prisma.purchaseInvoice.findMany({
    where: {
      invoiceDate: {
        gte: startDate,
        lte: endDate,
      },
      status: 'paid',
    },
    include: {
      expenseCategory: true,
    },
  });

  // Group expenses by category
  const expensesByCategory: Record<string, number> = {};
  purchaseInvoices.forEach((inv) => {
    const category = inv.category || 'other';
    expensesByCategory[category] = (expensesByCategory[category] || 0) + inv.subtotal;
  });

  const totalExpenses = purchaseInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
  const purchaseVat = purchaseInvoices.reduce((sum, inv) => sum + inv.taxAmount, 0);

  // Calculations
  const grossProfit = revenue - totalExpenses;
  const netProfit = grossProfit; // Simplified - would include other income/expenses

  return {
    type: 'Profit & Loss Statement',
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    revenue: {
      sales: revenue,
      vat: salesVat,
      total: revenue + salesVat,
    },
    expenses: {
      byCategory: expensesByCategory,
      vat: purchaseVat,
      total: totalExpenses,
      totalInclVat: totalExpenses + purchaseVat,
    },
    profit: {
      grossProfit,
      netProfit,
      profitMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
    },
  };
}

/**
 * Generate Balance Sheet
 */
async function generateBalanceSheetReport(asOfDate: Date) {
  // Current Assets
  const totalInvoicesReceivable = await prisma.invoice.aggregate({
    where: {
      status: {
        in: ['sent', 'overdue'],
      },
    },
    _sum: {
      total: true,
    },
  });

  // Current Liabilities
  const totalPayables = await prisma.purchaseInvoice.aggregate({
    where: {
      status: {
        in: ['pending', 'overdue'],
      },
    },
    _sum: {
      total: true,
    },
  });

  // Calculate equity (simplified)
  const totalRevenue = await prisma.invoice.aggregate({
    where: {
      status: 'paid',
      issueDate: {
        lte: asOfDate,
      },
    },
    _sum: {
      total: true,
    },
  });

  const totalExpenses = await prisma.purchaseInvoice.aggregate({
    where: {
      status: 'paid',
      invoiceDate: {
        lte: asOfDate,
      },
    },
    _sum: {
      total: true,
    },
  });

  const retainedEarnings = (totalRevenue._sum.total || 0) - (totalExpenses._sum.total || 0);

  return {
    type: 'Balance Sheet',
    asOfDate: asOfDate.toISOString(),
    assets: {
      currentAssets: {
        accountsReceivable: totalInvoicesReceivable._sum.total || 0,
        total: totalInvoicesReceivable._sum.total || 0,
      },
      fixedAssets: {
        total: 0, // Would need separate tracking
      },
      totalAssets: totalInvoicesReceivable._sum.total || 0,
    },
    liabilities: {
      currentLiabilities: {
        accountsPayable: totalPayables._sum.total || 0,
        total: totalPayables._sum.total || 0,
      },
      longTermLiabilities: {
        total: 0,
      },
      totalLiabilities: totalPayables._sum.total || 0,
    },
    equity: {
      retainedEarnings,
      totalEquity: retainedEarnings,
    },
    totalLiabilitiesAndEquity: (totalPayables._sum.total || 0) + retainedEarnings,
  };
}

/**
 * Generate Cash Flow Statement
 */
async function generateCashFlowReport(startDate: Date, endDate: Date) {
  // Cash from Operating Activities
  const paidInvoices = await prisma.invoice.findMany({
    where: {
      paidAt: {
        gte: startDate,
        lte: endDate,
      },
      status: 'paid',
    },
  });

  const paidExpenses = await prisma.purchaseInvoice.findMany({
    where: {
      paidDate: {
        gte: startDate,
        lte: endDate,
      },
      status: 'paid',
    },
  });

  const cashInflow = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const cashOutflow = paidExpenses.reduce((sum, inv) => sum + inv.total, 0);
  const netCashFlow = cashInflow - cashOutflow;

  // Get monthly breakdown
  const monthlyData: Record<string, { inflow: number; outflow: number }> = {};

  paidInvoices.forEach((inv) => {
    if (!inv.paidAt) return;
    const month = inv.paidAt.toISOString().substring(0, 7);
    if (!monthlyData[month]) monthlyData[month] = { inflow: 0, outflow: 0 };
    monthlyData[month].inflow += inv.total;
  });

  paidExpenses.forEach((inv) => {
    if (!inv.paidDate) return;
    const month = inv.paidDate.toISOString().substring(0, 7);
    if (!monthlyData[month]) monthlyData[month] = { inflow: 0, outflow: 0 };
    monthlyData[month].outflow += inv.total;
  });

  const monthlyBreakdown = Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      inflow: data.inflow,
      outflow: data.outflow,
      net: data.inflow - data.outflow,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    type: 'Cash Flow Statement',
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    operatingActivities: {
      cashInflow,
      cashOutflow,
      netCashFlow,
    },
    monthlyBreakdown,
  };
}
