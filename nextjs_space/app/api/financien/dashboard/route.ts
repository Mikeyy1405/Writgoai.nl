import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getMoneybird } from '@/lib/moneybird';
import { prisma } from '@/lib/db';

/**
 * GET /api/financien/dashboard
 * Haal dashboard data op inclusief KPIs, recente facturen en alerts
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

    // Try to get Moneybird client with proper error handling
    let moneybird;
    try {
      moneybird = getMoneybird();
    } catch (error) {
      console.error('[Financien Dashboard] Moneybird configuration error:', error);
      return NextResponse.json(
        { 
          error: 'Moneybird API is niet correct geconfigureerd. Controleer je omgevingsvariabelen.',
          details: error instanceof Error ? error.message : 'Configuration error'
        },
        { status: 500 }
      );
    }

    // Haal alle facturen op uit Moneybird with timeout and error handling
    let salesInvoices;
    try {
      salesInvoices = await Promise.race([
        moneybird.listSalesInvoices(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Moneybird API timeout')), 10000)
        )
      ]);
    } catch (error) {
      console.error('[Financien Dashboard] Error fetching sales invoices:', error);
      return NextResponse.json(
        { 
          error: 'Kon facturen niet ophalen van Moneybird',
          details: error instanceof Error ? error.message : 'API error'
        },
        { status: 500 }
      );
    }

    // Bereken KPIs
    const paidInvoices = salesInvoices.filter((inv: any) => inv.state === 'paid');
    const openInvoices = salesInvoices.filter((inv: any) => 
      inv.state === 'open' || inv.state === 'pending_payment'
    );
    const lateInvoices = salesInvoices.filter((inv: any) => inv.state === 'late');

    // Bereken totalen
    const totalRevenue = paidInvoices.reduce((sum: number, inv: any) => 
      sum + parseFloat(inv.total_price_incl_tax || '0'), 0
    );
    
    const outstandingAmount = openInvoices.reduce((sum: number, inv: any) => 
      sum + parseFloat(inv.total_unpaid || '0'), 0
    );

    // Haal abonnementen op with error handling
    let subscriptions;
    let activeSubscriptions = [];
    try {
      subscriptions = await Promise.race([
        moneybird.listSubscriptions(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Moneybird API timeout')), 10000)
        )
      ]);
      activeSubscriptions = subscriptions.filter((sub: any) => sub.active);
    } catch (error) {
      console.error('[Financien Dashboard] Error fetching subscriptions:', error);
      // Continue with empty subscriptions instead of failing completely
      subscriptions = [];
    }

    // Bereken MRR
    const mrr = activeSubscriptions.reduce((sum: number, sub: any) => {
      const amount = parseFloat(sub.total_price_incl_tax || '0');
      // Converteer naar maandelijks bedrag
      if (sub.frequency === 'month') return sum + amount;
      if (sub.frequency === 'quarter') return sum + (amount / 3);
      if (sub.frequency === 'year') return sum + (amount / 12);
      return sum;
    }, 0);

    const arr = mrr * 12;

    // Haal uitgaven op uit database
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyExpenses = await prisma.purchaseInvoice.aggregate({
      where: {
        invoiceDate: { gte: startOfMonth },
        status: 'paid',
      },
      _sum: { total: true },
    });

    const expenses = monthlyExpenses._sum.total || 0;

    // Bereken inkomsten deze maand
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const monthlyInvoices = salesInvoices.filter((inv: any) => {
      if (!inv.invoice_date) return false;
      const invoiceDate = new Date(inv.invoice_date);
      return invoiceDate >= thisMonthStart && inv.state === 'paid';
    });

    const monthlyRevenue = monthlyInvoices.reduce((sum: number, inv: any) => 
      sum + parseFloat(inv.total_price_incl_tax || '0'), 0
    );

    const netProfit = monthlyRevenue - expenses;

    // Haal recente facturen uit database
    const recentInvoices = await prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { name: true, email: true },
        },
      },
    });

    // Haal recente uitgaven uit database
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

    // Haal alerts uit database
    const alerts = await prisma.financialAlert.findMany({
      where: { dismissed: false },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 10,
    });

    // Voeg alert toe voor te late betalingen
    if (lateInvoices.length > 0) {
      const lateAmount = lateInvoices.reduce((sum: number, inv: any) => 
        sum + parseFloat(inv.total_unpaid || '0'), 0
      );
      
      // Check of alert al bestaat
      const existingAlert = await prisma.financialAlert.findFirst({
        where: {
          type: 'overdue_invoice',
          dismissed: false,
        },
      });

      if (!existingAlert) {
        await prisma.financialAlert.create({
          data: {
            type: 'overdue_invoice',
            severity: 'warning',
            title: 'Te late betalingen',
            message: `${lateInvoices.length} facturen zijn te laat met een totaal van €${lateAmount.toFixed(2)}`,
            actionRequired: true,
            actionUrl: '/financien/facturen?status=late',
          },
        });
      }
    }

    return NextResponse.json({
      overview: {
        mrr,
        arr,
        activeSubscriptions: activeSubscriptions.length,
        totalRevenue,
        outstandingInvoices: openInvoices.length,
        outstandingAmount,
        monthlyRevenue,
        monthlyExpenses: expenses,
        netProfit,
        lateInvoices: lateInvoices.length,
      },
      recentInvoices,
      recentExpenses,
      alerts,
    });
  } catch (error: any) {
    console.error('[Financien Dashboard API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
