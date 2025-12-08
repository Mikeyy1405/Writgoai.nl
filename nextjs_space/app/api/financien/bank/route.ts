import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getMoneybird } from '@/lib/moneybird';
import { prisma } from '@/lib/db';

/**
 * GET /api/financien/bank
 * Haal bankrekeningen en transacties op
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
    const accountId = searchParams.get('accountId');
    const status = searchParams.get('status');

    const moneybird = getMoneybird();

    // Haal bankrekeningen op
    const accounts = await moneybird.getFinancialAccounts();

    let transactions: any[] = [];

    // Als accountId gegeven, haal transacties op
    if (accountId) {
      const mbTransactions = await moneybird.getFinancialMutations(accountId);
      
      // Haal ook lokale transacties op
      const where: any = { bankAccountId: accountId };
      if (status) where.status = status;

      const localTransactions = await prisma.bankTransaction.findMany({
        where,
        orderBy: { transactionDate: 'desc' },
        include: {
          expenseCategory: true,
        },
      });

      transactions = localTransactions;
    } else {
      // Haal alle ongematchte transacties op
      const where: any = {};
      if (status) where.status = status;

      transactions = await prisma.bankTransaction.findMany({
        where,
        orderBy: { transactionDate: 'desc' },
        take: 100,
        include: {
          expenseCategory: true,
        },
      });
    }

    return NextResponse.json({ accounts, transactions });
  } catch (error: any) {
    console.error('[Financien Bank API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/financien/bank
 * Sync transacties of match transactie
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'sync') {
      // Sync transacties van Moneybird naar database
      const moneybird = getMoneybird();
      const accounts = await moneybird.getFinancialAccounts();

      let synced = 0;

      for (const account of accounts) {
        const mutations = await moneybird.getFinancialMutations(account.id);

        for (const mutation of mutations) {
          // Check of transactie al bestaat
          const existing = await prisma.bankTransaction.findUnique({
            where: { moneybirdMutationId: mutation.id },
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
            synced++;
          }
        }
      }

      return NextResponse.json({ success: true, synced });
    }

    if (action === 'match') {
      // Match transactie aan factuur
      const { transactionId, invoiceId, invoiceType } = body;

      await prisma.bankTransaction.update({
        where: { id: transactionId },
        data: {
          matchedInvoiceId: invoiceId,
          matchedInvoiceType: invoiceType,
          status: 'matched',
        },
      });

      return NextResponse.json({ success: true, message: 'Transactie gekoppeld' });
    }

    return NextResponse.json({ error: 'Ongeldige actie' }, { status: 400 });
  } catch (error: any) {
    console.error('[Financien Bank API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
