import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { getMoneybird } from '@/lib/moneybird';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const isAdmin = session.user.role === 'admin' || session.user.email === 'info@writgo.nl';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get Moneybird client
    const moneybird = getMoneybird();

    // Sync all data from Moneybird
    const results = await Promise.allSettled([
      moneybird.listContacts(),
      moneybird.listSalesInvoices(),
      moneybird.listSubscriptions(),
      moneybird.getPurchaseInvoices(),
      moneybird.getFinancialAccounts(),
      moneybird.getTaxRates(),
    ]);

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failedCount = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      message: `Synchronisatie voltooid: ${successCount} succesvol, ${failedCount} mislukt`,
      synced: {
        contacts: results[0].status === 'fulfilled',
        invoices: results[1].status === 'fulfilled',
        subscriptions: results[2].status === 'fulfilled',
        expenses: results[3].status === 'fulfilled',
        bankAccounts: results[4].status === 'fulfilled',
        taxRates: results[5].status === 'fulfilled',
      },
    });
  } catch (error) {
    console.error('Error syncing with Moneybird:', error);
    return NextResponse.json(
      { error: 'Failed to sync with Moneybird', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
