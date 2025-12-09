import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { supabaseAdmin } from '@/lib/supabase';
import { getMoneybird } from '@/lib/moneybird';
import { startOfMonth, endOfMonth, subMonths, format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for this expensive operation

interface DashboardStats {
  kpis: {
    totalClients: number;
    activeSubscriptions: number;
    mrr: number;
    arr: number;
    revenueThisMonth: number;
    revenuePreviousMonth: number;
    revenueGrowthPercent: number;
    outstandingInvoices: number;
    overdueInvoices: number;
    creditsUsedThisMonth: number;
  };
  charts: {
    revenueByMonth: Array<{
      month: string;
      revenue: number;
      expenses: number;
    }>;
    clientGrowth: Array<{
      month: string;
      total: number;
      new: number;
    }>;
    invoiceStatus: {
      paid: number;
      open: number;
      overdue: number;
      draft: number;
    };
  };
  recentActivity: Array<{
    type: string;
    description: string;
    amount?: number;
    date: string;
    client?: string;
  }>;
  topClients: Array<{
    name: string;
    email: string;
    totalRevenue: number;
    invoiceCount: number;
  }>;
  today: {
    invoicesToSend: number;
    overdueInvoices: number;
    subscriptionsRenewing: number;
    revenueToday: number;
    contentGenerated: number;
  };
}

/**
 * GET /api/admin/dashboard-stats - Get comprehensive dashboard stats from Moneybird
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize Moneybird client
    let moneybird;
    try {
      moneybird = getMoneybird();
    } catch (error) {
      console.error('[Dashboard Stats] Moneybird not configured:', error);
      return NextResponse.json(
        { error: 'Moneybird niet geconfigureerd. Controleer de omgevingsvariabelen.' },
        { status: 500 }
      );
    }

    // Fetch data in parallel for better performance
    const [
      clientsCount,
      salesInvoices,
      subscriptions,
      purchaseInvoices,
      contacts,
      creditsUsedThisMonth,
      contentGeneratedToday,
    ] = await Promise.all([
      // Get total clients from database
      supabaseAdmin
        .from('Client')
        .select('*', { count: 'exact', head: true })
        .then(({ count }) => count || 0)
        .catch(() => 0),

      // Get all sales invoices
      moneybird.listSalesInvoices().catch(() => []),

      // Get subscriptions
      moneybird.listSubscriptions().catch(() => []),

      // Get purchase invoices (expenses)
      moneybird.getPurchaseInvoices().catch(() => []),

      // Get contacts
      moneybird.listContacts().catch(() => []),

      // Get credits used this month from database
      (async () => {
        try {
          const firstDayOfMonth = startOfMonth(new Date());
          const { data: transactions } = await supabaseAdmin
            .from('CreditTransaction')
            .select('amount, type')
            .eq('type', 'usage')
            .gte('createdAt', firstDayOfMonth.toISOString());

          return Math.abs(
            (transactions || []).reduce((sum, t) => sum + (t.amount || 0), 0)
          );
        } catch {
          return 0;
        }
      })(),

      // Get content generated today
      (async () => {
        try {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const { count } = await supabaseAdmin
            .from('SavedContent')
            .select('*', { count: 'exact', head: true })
            .gte('createdAt', todayStart.toISOString());
          return count || 0;
        } catch {
          return 0;
        }
      })(),
    ]);

    // Calculate KPIs
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Calculate MRR from active subscriptions
    const activeSubscriptions = subscriptions.filter((sub: any) => sub.active);
    const mrr = activeSubscriptions.reduce((sum: number, sub: any) => {
      const price = parseFloat(sub.total_price_excl_tax || '0');
      // Convert to monthly based on frequency
      let monthlyPrice = price;
      if (sub.frequency === 'year') monthlyPrice = price / 12;
      if (sub.frequency === 'quarter') monthlyPrice = price / 3;
      if (sub.frequency === 'half-year') monthlyPrice = price / 6;
      return sum + monthlyPrice;
    }, 0);

    const arr = mrr * 12;

    // Calculate revenue this month (paid invoices)
    const paidInvoicesThisMonth = salesInvoices.filter((inv: any) => {
      if (inv.state !== 'paid') return false;
      const invoiceDate = parseISO(inv.invoice_date);
      return invoiceDate >= thisMonthStart && invoiceDate <= thisMonthEnd;
    });

    const revenueThisMonth = paidInvoicesThisMonth.reduce(
      (sum: number, inv: any) => sum + parseFloat(inv.total_price_excl_tax || '0'),
      0
    );

    // Calculate revenue previous month
    const paidInvoicesPrevMonth = salesInvoices.filter((inv: any) => {
      if (inv.state !== 'paid') return false;
      const invoiceDate = parseISO(inv.invoice_date);
      return invoiceDate >= lastMonthStart && invoiceDate <= lastMonthEnd;
    });

    const revenuePreviousMonth = paidInvoicesPrevMonth.reduce(
      (sum: number, inv: any) => sum + parseFloat(inv.total_price_excl_tax || '0'),
      0
    );

    // Calculate growth percentage
    const revenueGrowthPercent =
      revenuePreviousMonth > 0
        ? ((revenueThisMonth - revenuePreviousMonth) / revenuePreviousMonth) * 100
        : 0;

    // Calculate outstanding and overdue invoices
    const openInvoices = salesInvoices.filter(
      (inv: any) => inv.state === 'open' || inv.state === 'pending_payment'
    );
    const outstandingInvoices = openInvoices.reduce(
      (sum: number, inv: any) => sum + parseFloat(inv.total_unpaid || '0'),
      0
    );

    const overdueInvoices = salesInvoices
      .filter((inv: any) => inv.state === 'late')
      .reduce((sum: number, inv: any) => sum + parseFloat(inv.total_unpaid || '0'), 0);

    // Calculate invoice status for donut chart
    const invoiceStatus = {
      paid: salesInvoices.filter((inv: any) => inv.state === 'paid').length,
      open: salesInvoices.filter(
        (inv: any) => inv.state === 'open' || inv.state === 'pending_payment'
      ).length,
      overdue: salesInvoices.filter((inv: any) => inv.state === 'late').length,
      draft: salesInvoices.filter((inv: any) => inv.state === 'draft').length,
    };

    // Calculate revenue by month for last 12 months
    const revenueByMonth = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthRevenue = salesInvoices
        .filter((inv: any) => {
          if (inv.state !== 'paid') return false;
          const invDate = parseISO(inv.invoice_date);
          return invDate >= monthStart && invDate <= monthEnd;
        })
        .reduce((sum: number, inv: any) => sum + parseFloat(inv.total_price_excl_tax || '0'), 0);

      const monthExpenses = purchaseInvoices
        .filter((inv: any) => {
          if (inv.state !== 'paid') return false;
          const invDate = parseISO(inv.invoice_date);
          return invDate >= monthStart && invDate <= monthEnd;
        })
        .reduce((sum: number, inv: any) => sum + parseFloat(inv.total_price_excl_tax || '0'), 0);

      revenueByMonth.push({
        month: format(monthDate, 'MMM yyyy', { locale: nl }),
        revenue: Math.round(monthRevenue),
        expenses: Math.round(monthExpenses),
      });
    }

    // Calculate client growth (from database)
    const clientGrowth = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const { count: totalByMonth } = await supabaseAdmin
        .from('Client')
        .select('*', { count: 'exact', head: true })
        .lte('createdAt', monthEnd.toISOString());

      const { count: newInMonth } = await supabaseAdmin
        .from('Client')
        .select('*', { count: 'exact', head: true })
        .gte('createdAt', monthStart.toISOString())
        .lte('createdAt', monthEnd.toISOString());

      clientGrowth.push({
        month: format(monthDate, 'MMM yyyy', { locale: nl }),
        total: totalByMonth || 0,
        new: newInMonth || 0,
      });
    }

    // Build recent activity from invoices and subscriptions
    const recentActivity = [];

    // Add recent paid invoices
    const recentPaidInvoices = salesInvoices
      .filter((inv: any) => inv.state === 'paid')
      .sort(
        (a: any, b: any) =>
          parseISO(b.updated_at || b.created_at).getTime() -
          parseISO(a.updated_at || a.created_at).getTime()
      )
      .slice(0, 5);

    for (const inv of recentPaidInvoices) {
      const contact = contacts.find((c: any) => c.id === inv.contact_id);
      const clientName = contact?.company_name || 
        (contact?.firstname || contact?.lastname 
          ? `${contact.firstname || ''} ${contact.lastname || ''}`.trim() 
          : 'Onbekend');
      recentActivity.push({
        type: 'invoice_paid',
        description: `Factuur #${inv.invoice_id} betaald`,
        amount: parseFloat(inv.total_price_excl_tax || '0'),
        date: inv.updated_at || inv.created_at,
        client: clientName,
      });
    }

    // Add recent subscriptions
    const recentSubscriptions = subscriptions
      .sort(
        (a: any, b: any) =>
          parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime()
      )
      .slice(0, 3);

    for (const sub of recentSubscriptions) {
      const contact = contacts.find((c: any) => c.id === sub.contact_id);
      const clientName = contact?.company_name || 
        (contact?.firstname || contact?.lastname 
          ? `${contact.firstname || ''} ${contact.lastname || ''}`.trim() 
          : 'Onbekend');
      recentActivity.push({
        type: 'subscription_created',
        description: `Nieuw abonnement gestart`,
        amount: parseFloat(sub.total_price_excl_tax || '0'),
        date: sub.created_at,
        client: clientName,
      });
    }

    // Sort by date and limit
    recentActivity.sort(
      (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()
    );
    const limitedActivity = recentActivity.slice(0, 10);

    // Calculate top clients by revenue
    const clientRevenue = new Map<string, { name: string; email: string; revenue: number; count: number }>();

    for (const inv of salesInvoices) {
      if (inv.state === 'paid') {
        const contact = contacts.find((c: any) => c.id === inv.contact_id);
        if (contact) {
          const clientName = contact.company_name || 
            (contact.firstname || contact.lastname 
              ? `${contact.firstname || ''} ${contact.lastname || ''}`.trim() 
              : 'Onbekend');
          const existing = clientRevenue.get(inv.contact_id) || {
            name: clientName,
            email: contact.email || '',
            revenue: 0,
            count: 0,
          };
          existing.revenue += parseFloat(inv.total_price_excl_tax || '0');
          existing.count += 1;
          clientRevenue.set(inv.contact_id, existing);
        }
      }
    }

    const topClients = Array.from(clientRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((client) => ({
        name: client.name,
        email: client.email,
        totalRevenue: Math.round(client.revenue),
        invoiceCount: client.count,
      }));

    // Calculate today widget data
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const draftInvoices = salesInvoices.filter((inv: any) => inv.state === 'draft').length;
    const overdueCount = salesInvoices.filter((inv: any) => inv.state === 'late').length;

    // Count subscriptions that might renew today (this is a simplified check)
    // In a real scenario, Moneybird API would provide next_invoice_date
    const subscriptionsRenewingToday = 0; // Placeholder - would need Moneybird's next_invoice_date field

    const revenueToday = salesInvoices
      .filter((inv: any) => {
        if (inv.state !== 'paid') return false;
        const invDate = parseISO(inv.updated_at || inv.created_at);
        return invDate >= todayStart;
      })
      .reduce((sum: number, inv: any) => sum + parseFloat(inv.total_price_excl_tax || '0'), 0);

    // Build response
    const dashboardStats: DashboardStats = {
      kpis: {
        totalClients: clientsCount,
        activeSubscriptions: activeSubscriptions.length,
        mrr: Math.round(mrr),
        arr: Math.round(arr),
        revenueThisMonth: Math.round(revenueThisMonth),
        revenuePreviousMonth: Math.round(revenuePreviousMonth),
        revenueGrowthPercent: Math.round(revenueGrowthPercent * 10) / 10,
        outstandingInvoices: Math.round(outstandingInvoices),
        overdueInvoices: Math.round(overdueInvoices),
        creditsUsedThisMonth,
      },
      charts: {
        revenueByMonth,
        clientGrowth,
        invoiceStatus,
      },
      recentActivity: limitedActivity,
      topClients,
      today: {
        invoicesToSend: draftInvoices,
        overdueInvoices: overdueCount,
        subscriptionsRenewing: subscriptionsRenewingToday,
        revenueToday: Math.round(revenueToday),
        contentGenerated: contentGeneratedToday,
      },
    };

    return NextResponse.json(dashboardStats);
  } catch (error) {
    console.error('[Dashboard Stats API] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';

    return NextResponse.json(
      {
        error: 'Fout bij ophalen dashboard statistieken',
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
