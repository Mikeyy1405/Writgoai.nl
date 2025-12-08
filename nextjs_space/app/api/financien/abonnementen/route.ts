import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getMoneybird } from '@/lib/moneybird';

/**
 * GET /api/financien/abonnementen
 * Haal alle abonnementen op uit Moneybird
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

    const moneybird = getMoneybird();
    const subscriptions = await moneybird.listSubscriptions();

    // Bereken MRR per abonnement
    const enrichedSubscriptions = subscriptions.map((sub: any) => {
      const amount = parseFloat(sub.total_price_incl_tax || '0');
      let mrr = 0;
      
      if (sub.frequency === 'month') mrr = amount;
      else if (sub.frequency === 'quarter') mrr = amount / 3;
      else if (sub.frequency === 'year') mrr = amount / 12;
      
      return {
        ...sub,
        mrr,
      };
    });

    return NextResponse.json({ subscriptions: enrichedSubscriptions });
  } catch (error: any) {
    console.error('[Financien Abonnementen API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/financien/abonnementen
 * Maak een nieuw abonnement aan
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

    const subscription = await moneybird.createSubscription(body);

    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error('[Financien Abonnementen API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
