import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getMoneybird } from '@/lib/moneybird';

export const dynamic = 'force-dynamic';

/**
 * GET /api/financien/facturen
 * Haal alle facturen op uit Moneybird
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
    const state = searchParams.get('state');
    const period = searchParams.get('period');
    const contactId = searchParams.get('contactId');

    const moneybird = getMoneybird();
    const invoices = await moneybird.listSalesInvoices({
      state: state || undefined,
      period: period || undefined,
      contactId: contactId || undefined,
    });

    return NextResponse.json({ invoices });
  } catch (error: any) {
    console.error('[Financien Facturen API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/financien/facturen
 * Maak een nieuwe factuur aan
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
    const moneybird = getMoneybird();

    const invoice = await moneybird.createSalesInvoice(body);

    return NextResponse.json({ invoice });
  } catch (error: any) {
    console.error('[Financien Facturen API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
