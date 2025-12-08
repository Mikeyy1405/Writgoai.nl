import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { getMoneybird } from '@/lib/moneybird';

const prisma = new PrismaClient();

/**
 * GET /api/finance/bank-transactions
 * Get bank transactions
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // matched, unmatched, ignored
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};

    if (status) {
      where.status = status;
    }

    const [transactions, total] = await Promise.all([
      prisma.bankTransaction.findMany({
        where,
        include: {
          expenseCategory: true,
        },
        orderBy: { transactionDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bankTransaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[Finance Bank Transactions API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/finance/bank-transactions/sync
 * Sync bank transactions from Moneybird
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, accountId } = body;

    if (action === 'sync') {
      const moneybird = getMoneybird();

      // Get financial accounts
      const accounts = await moneybird.getFinancialAccounts();

      let totalSynced = 0;

      for (const account of accounts) {
        if (accountId && account.id !== accountId) {
          continue; // Skip if specific account requested
        }

        try {
          // Get mutations for this account
          const mutations = await moneybird.getFinancialMutations(account.id, {
            startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });

          for (const mutation of mutations) {
            // Check if already exists
            const existing = await prisma.bankTransaction.findUnique({
              where: {
                moneybirdMutationId: mutation.id,
              },
            });

            if (!existing) {
              await prisma.bankTransaction.create({
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

              totalSynced++;
            }
          }
        } catch (err: any) {
          console.error(`[Sync] Error syncing account ${account.id}:`, err);
        }
      }

      return NextResponse.json({
        success: true,
        synced: totalSynced,
      });
    }

    if (action === 'match') {
      // Auto-match transactions to invoices
      const { transactionId, invoiceId, invoiceType } = body;

      if (!transactionId || !invoiceId || !invoiceType) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      await prisma.bankTransaction.update({
        where: { id: transactionId },
        data: {
          matchedInvoiceId: invoiceId,
          matchedInvoiceType: invoiceType,
          status: 'matched',
          autoMatched: false,
          matchConfidence: 1.0,
        },
      });

      // Update invoice status if it's a sales invoice
      if (invoiceType === 'sales') {
        const transaction = await prisma.bankTransaction.findUnique({
          where: { id: transactionId },
        });

        if (transaction) {
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              status: 'paid',
              paidAt: transaction.transactionDate,
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Finance Bank Transactions Sync API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
