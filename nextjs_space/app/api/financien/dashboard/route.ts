import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getMoneybird } from '@/lib/moneybird';
import { withTimeout, API_TIMEOUTS } from '@/lib/api-timeout';

/**
 * GET /api/financien/dashboard
 * Haal dashboard data op inclusief KPIs - 100% via Moneybird API
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

    // Haal alle data parallel op uit Moneybird
    const [salesInvoices, subscriptions, purchaseInvoices, contacts] = await Promise.all([
      withTimeout(moneybird.listSalesInvoices(), API_TIMEOUTS.MONEYBIRD_API, 'Moneybird timeout').catch(() => []),
      withTimeout(moneybird.listSubscriptions(), API_TIMEOUTS.MONEYBIRD_API, 'Moneybird timeout').catch(() => []),
      withTimeout(moneybird.getPurchaseInvoices(), API_TIMEOUTS.MONEYBIRD_API, 'Moneybird timeout').catch(() => []),
      withTimeout(moneybird.listContacts(), API_TIMEOUTS.MONEYBIRD_API, 'Moneybird timeout').catch(() => []),
    ]);

    // Bereken KPIs uit Moneybird data
    const paidInvoices = salesInvoices.filter((inv: any) => inv.state === 'paid');
    const openInvoices = salesInvoices.filter((inv: any) => 
      inv.state === 'open' || inv.state === 'pending_payment'
    );
    const lateInvoices = salesInvoices.filter((inv: any) => inv.state === 'late');
    const draftInvoices = salesInvoices.filter((inv: any) => inv.state === 'draft');

    // Bereken totalen
    const totalRevenue = paidInvoices.reduce((sum: number, inv: any) => 
      sum + parseFloat(inv.total_price_incl_tax || '0'), 0
    );
    
    const outstandingAmount = openInvoices.reduce((sum: number, inv: any) => 
      sum + parseFloat(inv.total_unpaid || '0'), 0
    );

    const lateAmount = lateInvoices.reduce((sum: number, inv: any) => 
      sum + parseFloat(inv.total_unpaid || '0'), 0
    );

    // Actieve abonnementen
    const activeSubscriptions = subscriptions.filter((sub: any) => sub.active);

    // Bereken MRR
    const mrr = activeSubscriptions.reduce((sum: number, sub: any) => {
      const amount = parseFloat(sub.total_price_incl_tax || '0');
      if (sub.frequency === 'month') return sum + amount;
      if (sub.frequency === 'quarter') return sum + (amount / 3);
      if (sub.frequency === 'year') return sum + (amount / 12);
      if (sub.frequency === 'half-year') return sum + (amount / 6);
      return sum + amount;
    }, 0);

    const arr = mrr * 12;

    // Bereken uitgaven uit Moneybird purchase invoices
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyExpenseInvoices = purchaseInvoices.filter((inv: any) => {
      if (!inv.invoice_date) return false;
      const invoiceDate = new Date(inv.invoice_date);
      return invoiceDate >= startOfMonth && inv.state === 'paid';
    });

    const expenses = monthlyExpenseInvoices.reduce((sum: number, inv: any) => 
      sum + parseFloat(inv.total_price_incl_tax || '0'), 0
    );

    // Bereken inkomsten deze maand
    const monthlyInvoices = salesInvoices.filter((inv: any) => {
      if (!inv.invoice_date) return false;
      const invoiceDate = new Date(inv.invoice_date);
      return invoiceDate >= startOfMonth && inv.state === 'paid';
    });

    const monthlyRevenue = monthlyInvoices.reduce((sum: number, inv: any) => 
      sum + parseFloat(inv.total_price_incl_tax || '0'), 0
    );

    const netProfit = monthlyRevenue - expenses;

    // Recente facturen uit Moneybird (laatste 5)
    const recentInvoices = salesInvoices
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((inv: any) => {
        const contact = contacts.find((c: any) => c.id === inv.contact_id);
        return {
          id: inv.id,
          invoiceNumber: inv.invoice_id,
          clientName: contact?.company_name || `${contact?.firstname || ''} ${contact?.lastname || ''}`.trim() || 'Onbekend',
          clientEmail: contact?.email || '',
          total: parseFloat(inv.total_price_incl_tax || '0'),
          status: inv.state,
          invoiceDate: inv.invoice_date,
          dueDate: inv.due_date,
        };
      });

    // Recente uitgaven uit Moneybird (laatste 5)
    const recentExpenses = purchaseInvoices
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((inv: any) => {
        const contact = contacts.find((c: any) => c.id === inv.contact_id);
        return {
          id: inv.id,
          invoiceNumber: inv.invoice_id || inv.reference || 'N/A',
          supplierName: contact?.company_name || `${contact?.firstname || ''} ${contact?.lastname || ''}`.trim() || 'Onbekend',
          total: parseFloat(inv.total_price_incl_tax || '0'),
          category: 'Uitgave',
          invoiceDate: inv.invoice_date,
          status: inv.state,
        };
      });

    // Alerts genereren op basis van Moneybird data
    const alerts: any[] = [];

    if (lateInvoices.length > 0) {
      alerts.push({
        id: 'late-invoices',
        type: 'overdue_invoice',
        severity: 'warning',
        title: 'Te late betalingen',
        message: `${lateInvoices.length} facturen zijn te laat met een totaal van €${lateAmount.toFixed(2)}`,
        actionRequired: true,
        actionUrl: '/admin/financien/facturen?status=late',
      });
    }

    if (draftInvoices.length > 0) {
      alerts.push({
        id: 'draft-invoices',
        type: 'draft_invoice',
        severity: 'info',
        title: 'Concept facturen',
        message: `${draftInvoices.length} facturen wachten op verzending`,
        actionRequired: false,
        actionUrl: '/admin/financien/facturen?status=draft',
      });
    }

    return NextResponse.json({
      overview: {
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(arr * 100) / 100,
        activeSubscriptions: activeSubscriptions.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        outstandingInvoices: openInvoices.length,
        outstandingAmount: Math.round(outstandingAmount * 100) / 100,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        monthlyExpenses: Math.round(expenses * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        lateInvoices: lateInvoices.length,
        lateAmount: Math.round(lateAmount * 100) / 100,
        totalContacts: contacts.length,
      },
      recentInvoices,
      recentExpenses,
      alerts,
    });
  } catch (error: any) {
    console.error('[Financien Dashboard API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden bij het laden van financiële data' },
      { status: 500 }
    );
  }
}
