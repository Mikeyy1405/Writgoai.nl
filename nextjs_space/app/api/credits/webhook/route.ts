
/**
 * Stripe Webhook - Process completed payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { addCredits } from '@/lib/credits';

const prisma = new PrismaClient();

// Initialize Stripe
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia'
  });
}

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    try {
      const purchaseId = session.metadata?.purchaseId;
      const clientId = session.metadata?.clientId;
      const credits = parseFloat(session.metadata?.credits || '0');

      if (!purchaseId || !clientId || !credits) {
        console.error('Missing metadata in session:', session.metadata);
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      // Update purchase record
      await prisma.creditPurchase.update({
        where: { id: purchaseId },
        data: {
          paymentStatus: 'completed',
          stripePaymentId: session.payment_intent as string,
          completedAt: new Date()
        }
      });

      // Add credits to client
      await addCredits(
        clientId,
        credits,
        'purchase',
        `Credit pakket aankoop: ${session.metadata?.packageId || 'unknown'}`
      );

      console.log(`✅ Added ${credits} credits to client ${clientId}`);
    } catch (error) {
      console.error('Error processing payment:', error);
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
