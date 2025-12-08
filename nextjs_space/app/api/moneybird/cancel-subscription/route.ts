import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getMoneybird } from '@/lib/moneybird';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    // Get client from database
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    if (!client.moneybirdSubscriptionId) {
      return NextResponse.json({ error: 'Geen actief abonnement gevonden' }, { status: 400 });
    }

    // Initialize Moneybird client
    const moneybird = getMoneybird();

    // Cancel subscription in Moneybird
    await moneybird.cancelSubscription(client.moneybirdSubscriptionId);

    console.log(
      `[Moneybird] Cancelled subscription ${client.moneybirdSubscriptionId} for client ${client.id}`
    );

    // Update client in database
    await prisma.client.update({
      where: { id: client.id },
      data: {
        subscriptionStatus: 'cancelled',
        subscriptionEndDate: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message:
        'Abonnement geannuleerd. Je abonnement blijft actief tot het einde van de huidige betaalperiode.',
    });
  } catch (error: any) {
    console.error('[Moneybird] Cancel subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het annuleren van het abonnement' },
      { status: 500 }
    );
  }
}
