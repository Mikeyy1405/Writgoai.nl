import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getMoneybird } from '@/lib/moneybird';

export const dynamic = 'force-dynamic';

/**
 * GET /api/financien/abonnementen/[id]
 * Haal een specifiek abonnement op
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
    const subscription = await moneybird.getSubscription(params.id);

    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error('[Financien Abonnementen API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/financien/abonnementen/[id]
 * Update een abonnement
 */
export async function PATCH(
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
    const moneybird = getMoneybird();
    const subscription = await moneybird.updateSubscription(params.id, body);

    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error('[Financien Abonnementen API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/financien/abonnementen/[id]
 * Annuleer een abonnement
 */
export async function DELETE(
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
    await moneybird.cancelSubscription(params.id);

    return NextResponse.json({ success: true, message: 'Abonnement geannuleerd' });
  } catch (error: any) {
    console.error('[Financien Abonnementen API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
