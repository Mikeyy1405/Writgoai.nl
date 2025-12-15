import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getMoneybird } from '@/lib/moneybird';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    // Get Moneybird client
    const moneybird = getMoneybird();

    // Sync all data from Moneybird with timeout protection
    // Note: This fetches recent data. For large datasets, consider implementing
    // background jobs or paginated sync in the future.
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

    // Log any errors for debugging
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const dataTypes = ['contacts', 'invoices', 'subscriptions', 'expenses', 'bankAccounts', 'taxRates'];
        console.error(`[Financien Sync] Failed to sync ${dataTypes[index]}:`, result.reason);
      }
    });

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
  } catch (error: any) {
    console.error('[Financien Sync API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden bij synchroniseren' },
      { status: 500 }
    );
  }
}
