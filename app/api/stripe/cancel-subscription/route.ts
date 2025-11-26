

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('[Cancel Subscription] Session:', session?.user?.email);
    
    if (!session?.user?.email) {
      console.error('[Cancel Subscription] User not logged in');
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    console.log('[Cancel Subscription] Client found:', {
      email: client?.email,
      subscriptionId: client?.subscriptionId,
    });

    if (!client) {
      console.error('[Cancel Subscription] Client not found');
      return NextResponse.json({ error: 'Klant niet gevonden' }, { status: 404 });
    }

    if (!client.subscriptionId) {
      console.error('[Cancel Subscription] No subscription ID found');
      return NextResponse.json({ error: 'Geen actief abonnement gevonden' }, { status: 404 });
    }

    // Cancel subscription at period end (user keeps access until end of billing period)
    console.log('[Cancel Subscription] Canceling subscription:', client.subscriptionId);
    
    const canceledSubscription = await stripe.subscriptions.update(client.subscriptionId, {
      cancel_at_period_end: true,
    });

    console.log('[Cancel Subscription] Success:', {
      id: canceledSubscription.id,
      cancel_at_period_end: canceledSubscription.cancel_at_period_end,
    });

    return NextResponse.json({
      success: true,
      message: 'Abonnement opgezegd. Je blijft toegang houden tot het einde van de periode.',
      subscription: {
        id: canceledSubscription.id,
        cancel_at_period_end: canceledSubscription.cancel_at_period_end,
      },
    });
  } catch (error: any) {
    console.error('[Cancel Subscription] Error:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het opzeggen van je abonnement' },
      { status: 500 }
    );
  }
}
