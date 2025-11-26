

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const PLAN_CONFIG = {
  starter: {
    name: 'Starter',
    credits: 100,
    price: 24.99,
    priceId: 'price_1SMslsFIOSLx4Sb7eso0oBNt',
  },
  pro: {
    name: 'Pro',
    credits: 500,
    price: 99.99,
    priceId: 'price_1SMsmWFIOSLx4Sb7nGdwNXzS',
  },
  business: {
    name: 'Business',
    credits: 2000,
    price: 299.99,
    priceId: 'price_1SMsnEFIOSLx4Sb7LZyl1q33',
  },
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('[Change Plan] Session:', session?.user?.email);
    
    if (!session?.user?.email) {
      console.error('[Change Plan] User not logged in');
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { newPlanId } = await req.json();

    console.log('[Change Plan] Requested plan:', newPlanId);

    if (!newPlanId || !PLAN_CONFIG[newPlanId as keyof typeof PLAN_CONFIG]) {
      console.error('[Change Plan] Invalid plan ID:', newPlanId);
      return NextResponse.json({ error: 'Ongeldig plan' }, { status: 400 });
    }

    const newPlan = PLAN_CONFIG[newPlanId as keyof typeof PLAN_CONFIG];

    console.log('[Change Plan] New plan config:', {
      name: newPlan.name,
      priceId: newPlan.priceId,
      credits: newPlan.credits,
    });

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    console.log('[Change Plan] Client found:', {
      email: client?.email,
      subscriptionId: client?.subscriptionId,
      currentPlan: client?.subscriptionPlan,
    });

    if (!client) {
      console.error('[Change Plan] Client not found');
      return NextResponse.json({ error: 'Klant niet gevonden' }, { status: 404 });
    }

    if (!client.subscriptionId) {
      console.error('[Change Plan] No subscription ID found');
      return NextResponse.json({ error: 'Geen actief abonnement gevonden' }, { status: 404 });
    }

    // Get current subscription
    console.log('[Change Plan] Retrieving subscription:', client.subscriptionId);
    const subscription = await stripe.subscriptions.retrieve(client.subscriptionId);

    console.log('[Change Plan] Current subscription:', {
      id: subscription.id,
      status: subscription.status,
      itemsCount: subscription.items.data.length,
    });

    if (!subscription || !subscription.items.data[0]) {
      console.error('[Change Plan] Cannot find subscription items');
      return NextResponse.json({ error: 'Kan abonnement niet vinden' }, { status: 404 });
    }

    // Update subscription with new price
    console.log('[Change Plan] Updating subscription to:', newPlan.priceId);
    const updatedSubscription = await stripe.subscriptions.update(client.subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPlan.priceId,
        },
      ],
      proration_behavior: 'always_invoice', // Create prorated invoice immediately
      metadata: {
        planId: newPlanId,
        planName: newPlan.name,
        monthlyCredits: newPlan.credits.toString(),
      },
    });

    console.log('[Change Plan] Subscription updated successfully');

    // Update client in database
    console.log('[Change Plan] Updating client in database');
    await prisma.client.update({
      where: { id: client.id },
      data: {
        subscriptionPlan: newPlanId,
        monthlyCredits: newPlan.credits,
        subscriptionCredits: newPlan.credits, // Reset credits to new plan amount
      },
    });

    console.log('[Change Plan] Success! Plan changed from', client.subscriptionPlan, 'to', newPlanId);

    return NextResponse.json({
      success: true,
      message: 'Abonnement succesvol gewijzigd',
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
      },
    });
  } catch (error: any) {
    console.error('[Change Plan] Error:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het wijzigen van je abonnement' },
      { status: 500 }
    );
  }
}
