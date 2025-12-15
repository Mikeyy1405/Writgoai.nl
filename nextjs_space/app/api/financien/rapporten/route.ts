import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/financien/rapporten
 * Genereer financiële rapporten
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // profit_loss, balance, cashflow
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!type || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Type, startDate en endDate zijn verplicht' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (type === 'profit_loss') {
      // Winst & Verlies rekening
      const sales = await prisma.invoice.aggregate({
        where: {
          issueDate: { gte: start, lte: end },
          status: 'paid',
        },
        _sum: { total: true },
      });

      const purchases = await prisma.purchaseInvoice.aggregate({
        where: {
          invoiceDate: { gte: start, lte: end },
          status: 'paid',
        },
        _sum: { total: true },
      });

      const revenue = sales._sum.total || 0;
      const expenses = purchases._sum.total || 0;
      const netProfit = revenue - expenses;

      // Groepeer uitgaven per categorie
      const expensesByCategory = await prisma.purchaseInvoice.groupBy({
        by: ['category'],
        where: {
          invoiceDate: { gte: start, lte: end },
          status: 'paid',
        },
        _sum: { total: true },
      });

      return NextResponse.json({
        type: 'profit_loss',
        period: { start: startDate, end: endDate },
        data: {
          revenue,
          expenses,
          netProfit,
          expensesByCategory: expensesByCategory.map((cat) => ({
            category: cat.category || 'Onbekend',
            amount: cat._sum.total || 0,
          })),
        },
      });
    }

    if (type === 'balance') {
      // Balans overzicht
      const totalRevenue = await prisma.invoice.aggregate({
        where: { status: 'paid' },
        _sum: { total: true },
      });

      const totalExpenses = await prisma.purchaseInvoice.aggregate({
        where: { status: 'paid' },
        _sum: { total: true },
      });

      const outstanding = await prisma.invoice.aggregate({
        where: {
          status: { in: ['sent', 'overdue'] },
        },
        _sum: { total: true },
      });

      const equity = (totalRevenue._sum.total || 0) - (totalExpenses._sum.total || 0);

      return NextResponse.json({
        type: 'balance',
        period: { start: startDate, end: endDate },
        data: {
          assets: {
            receivables: outstanding._sum.total || 0,
            totalAssets: outstanding._sum.total || 0,
          },
          liabilities: {
            equity,
            totalLiabilities: equity,
          },
        },
      });
    }

    if (type === 'cashflow') {
      // Cashflow overzicht
      const months: any[] = [];
      const current = new Date(start);

      while (current <= end) {
        const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
        const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

        const income = await prisma.invoice.aggregate({
          where: {
            paidAt: { gte: monthStart, lte: monthEnd },
            status: 'paid',
          },
          _sum: { total: true },
        });

        const outgoing = await prisma.purchaseInvoice.aggregate({
          where: {
            paidDate: { gte: monthStart, lte: monthEnd },
            status: 'paid',
          },
          _sum: { total: true },
        });

        months.push({
          month: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`,
          income: income._sum.total || 0,
          outgoing: outgoing._sum.total || 0,
          net: (income._sum.total || 0) - (outgoing._sum.total || 0),
        });

        current.setMonth(current.getMonth() + 1);
      }

      return NextResponse.json({
        type: 'cashflow',
        period: { start: startDate, end: endDate },
        data: { months },
      });
    }

    return NextResponse.json({ error: 'Ongeldig rapport type' }, { status: 400 });
  } catch (error: any) {
    console.error('[Financien Rapporten API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
