import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getMoneybird } from '@/lib/moneybird';

/**
 * GET /api/financien/facturen/[id]
 * Haal een specifieke factuur op
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const moneybird = getMoneybird();
    const invoice = await moneybird.getSalesInvoice(params.id);

    return NextResponse.json({ invoice });
  } catch (error: any) {
    console.error('[Financien Facturen API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/financien/facturen/[id]
 * Verstuur factuur of registreer betaling
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const moneybird = getMoneybird();

    if (action === 'send') {
      await moneybird.sendSalesInvoice(params.id, {
        delivery_method: body.delivery_method || 'Email',
        email_address: body.email_address,
        email_message: body.email_message,
      });
      return NextResponse.json({ success: true, message: 'Factuur verstuurd' });
    }

    if (action === 'register_payment') {
      await moneybird.registerPayment(
        params.id,
        body.amount,
        body.payment_date
      );
      return NextResponse.json({ success: true, message: 'Betaling geregistreerd' });
    }

    return NextResponse.json({ error: 'Ongeldige actie' }, { status: 400 });
  } catch (error: any) {
    console.error('[Financien Facturen API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
