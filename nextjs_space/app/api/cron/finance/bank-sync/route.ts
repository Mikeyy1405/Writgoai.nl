import { NextRequest, NextResponse } from 'next/server';
import { getMoneybird } from '@/lib/moneybird';
import { prisma } from '@/lib/db';


/**
 * POST /api/cron/finance/bank-sync
 * Cron job to sync bank transactions from Moneybird
 * Should be triggered every 4 hours
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Bank Sync Cron] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Bank Sync Cron] Starting bank transaction sync...');

    const moneybird = getMoneybird();

    // Get financial accounts
    const accounts = await moneybird.getFinancialAccounts();

    let totalSynced = 0;
    let totalErrors = 0;

    for (const account of accounts) {
      if (!account.active) continue;

      try {
        console.log(`[Bank Sync Cron] Syncing account: ${account.name}`);

        // Get mutations for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const mutations = await moneybird.getFinancialMutations(account.id, {
          startDate: thirtyDaysAgo.toISOString().split('T')[0],
        });

        for (const mutation of mutations) {
          try {
            // Check if already exists
            const existing = await prisma.bankTransaction.findUnique({
              where: {
                moneybirdMutationId: mutation.id,
              },
            });

            if (!existing) {
              // Create new transaction
              const transaction = await prisma.bankTransaction.create({
                data: {
                  moneybirdMutationId: mutation.id,
                  bankAccountId: account.id,
                  transactionDate: new Date(mutation.date),
                  amount: parseFloat(mutation.amount),
                  type: parseFloat(mutation.amount) >= 0 ? 'credit' : 'debit',
                  counterpartyName: mutation.contra_account_name,
                  counterpartyAccount: mutation.contra_account_number,
                  description: mutation.message,
                  reference: mutation.code,
                  status: 'unmatched',
                },
              });

              // Try to auto-match to invoices
              await tryAutoMatch(transaction);

              totalSynced++;
            }
          } catch (mutationError: any) {
            console.error(`[Bank Sync Cron] Error syncing mutation ${mutation.id}:`, mutationError);
            totalErrors++;
          }
        }
      } catch (accountError: any) {
        console.error(`[Bank Sync Cron] Error syncing account ${account.id}:`, accountError);
        totalErrors++;
      }
    }

    console.log(`[Bank Sync Cron] Completed: ${totalSynced} synced, ${totalErrors} errors`);

    // Create summary alert
    await prisma.financialAlert.create({
      data: {
        type: 'bank_sync',
        severity: 'info',
        title: 'Bank transacties gesynchroniseerd',
        message: `${totalSynced} nieuwe transacties gesynchroniseerd. ${totalErrors} fouten.`,
        actionRequired: totalErrors > 0,
      },
    });

    return NextResponse.json({
      success: true,
      synced: totalSynced,
      errors: totalErrors,
    });
  } catch (error: any) {
    console.error('[Bank Sync Cron] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Try to automatically match a bank transaction to an invoice
 */
async function tryAutoMatch(transaction: any): Promise<void> {
  try {
    const amount = Math.abs(transaction.amount);
    const isIncoming = transaction.amount > 0;

    if (isIncoming) {
      // Try to match to sales invoice
      const matchingInvoice = await prisma.invoice.findFirst({
        where: {
          status: {
            in: ['sent', 'overdue'],
          },
          total: {
            gte: amount - 0.5,
            lte: amount + 0.5, // Allow small difference
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
      });

      if (matchingInvoice) {
        await prisma.bankTransaction.update({
          where: { id: transaction.id },
          data: {
            matchedInvoiceId: matchingInvoice.id,
            matchedInvoiceType: 'sales',
            status: 'matched',
            autoMatched: true,
            matchConfidence: 0.9,
          },
        });

        // Mark invoice as paid
        await prisma.invoice.update({
          where: { id: matchingInvoice.id },
          data: {
            status: 'paid',
            paidAt: transaction.transactionDate,
          },
        });

        console.log(`[Bank Sync Cron] Auto-matched transaction to invoice ${matchingInvoice.invoiceNumber}`);
      }
    } else {
      // Try to match to purchase invoice
      const matchingExpense = await prisma.purchaseInvoice.findFirst({
        where: {
          status: 'pending',
          total: {
            gte: amount - 0.5,
            lte: amount + 0.5,
          },
        },
        orderBy: {
          invoiceDate: 'desc',
        },
      });

      if (matchingExpense) {
        await prisma.bankTransaction.update({
          where: { id: transaction.id },
          data: {
            matchedInvoiceId: matchingExpense.id,
            matchedInvoiceType: 'purchase',
            status: 'matched',
            autoMatched: true,
            matchConfidence: 0.9,
          },
        });

        // Mark expense as paid
        await prisma.purchaseInvoice.update({
          where: { id: matchingExpense.id },
          data: {
            status: 'paid',
            paidDate: transaction.transactionDate,
          },
        });

        console.log(`[Bank Sync Cron] Auto-matched transaction to expense ${matchingExpense.invoiceNumber}`);
      }
    }
  } catch (error) {
    console.error('[Bank Sync Cron] Error in auto-match:', error);
  }
}

/**
 * GET /api/cron/finance/bank-sync
 * Test endpoint - should only work in development
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  console.log('[Bank Sync Cron] TEST RUN');
  
  // Call POST handler for test
  return POST(req);
}
