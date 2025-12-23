import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getPackageTierByPriceId } from '@/lib/stripe-config';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed
 * This is triggered when a user completes a checkout
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout completed:', session.id);

  const userId = session.metadata?.user_id;
  const packageTier = session.metadata?.package;
  const credits = parseInt(session.metadata?.credits || '0', 10);
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  if (!userId || !packageTier || !credits) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Update subscriber record
  await supabaseAdmin
    .from('subscribers')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_tier: packageTier,
      subscription_active: true,
      credits_remaining: credits,
      monthly_credits: credits,
      subscription_start_date: new Date().toISOString(),
    });

  console.log(`Added ${credits} credits to user ${userId}`);
}

/**
 * Handle invoice.payment_succeeded
 * This is triggered on subscription renewals
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded:', invoice.id);

  // Only handle subscription renewals (not the initial payment)
  const invoiceAny = invoice as any;
  const subscriptionId = typeof invoiceAny.subscription === 'string' 
    ? invoiceAny.subscription 
    : invoiceAny.subscription?.id;
  
  if (!subscriptionId || (invoiceAny.billing_reason as string) === 'subscription_create') {
    return;
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.user_id;
  const credits = parseInt(subscription.metadata?.credits || '0', 10);

  if (!userId || !credits) {
    console.error('Missing metadata in subscription');
    return;
  }

  // Reset monthly credits
  const subAny = subscription as any;
  await supabaseAdmin
    .from('subscribers')
    .update({
      credits_remaining: credits,
      next_billing_date: new Date((subAny.current_period_end || 0) * 1000).toISOString(),
    })
    .eq('user_id', userId);

  console.log(`Reset ${credits} credits for user ${userId}`);
}

/**
 * Handle customer.subscription.updated
 * This is triggered when a subscription is upgraded/downgraded
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);

  const userId = subscription.metadata?.user_id;
  if (!userId) {
    console.error('Missing user_id in subscription metadata');
    return;
  }

  // Get the new price ID
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    console.error('No price ID found in subscription');
    return;
  }

  // Get package tier from price ID
  const packageTier = getPackageTierByPriceId(priceId);
  if (!packageTier) {
    console.error(`Unknown price ID: ${priceId}`);
    return;
  }

  // Get credits for new tier
  const credits = parseInt(subscription.metadata?.credits || '0', 10);

  // Update subscriber record
  const subAny2 = subscription as any;
  await supabaseAdmin
    .from('subscribers')
    .update({
      subscription_tier: packageTier,
      monthly_credits: credits,
      subscription_active: subscription.status === 'active',
      next_billing_date: new Date((subAny2.current_period_end || 0) * 1000).toISOString(),
    })
    .eq('user_id', userId);

  console.log(`Updated subscription for user ${userId} to ${packageTier}`);
}

/**
 * Handle customer.subscription.deleted
 * This is triggered when a subscription is cancelled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);

  const userId = subscription.metadata?.user_id;
  if (!userId) {
    console.error('Missing user_id in subscription metadata');
    return;
  }

  // Mark subscription as inactive
  await supabaseAdmin
    .from('subscribers')
    .update({
      subscription_active: false,
      subscription_end_date: new Date().toISOString(),
    })
    .eq('user_id', userId);

  console.log(`Deactivated subscription for user ${userId}`);
}
