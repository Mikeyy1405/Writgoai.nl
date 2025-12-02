import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('[Stripe Webhook] No signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`[Stripe Webhook] Event received: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'invoice.paid': {
        const stripeInvoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(stripeInvoice);
        break;
      }

      case 'invoice.payment_failed': {
        const stripeInvoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(stripeInvoice);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const invoiceId = session.metadata?.invoiceId;
  
  if (!invoiceId) {
    console.log('[Stripe Webhook] No invoiceId in metadata');
    return;
  }

  console.log(`[Stripe Webhook] Checkout completed for invoice: ${invoiceId}`);

  // Update invoice status
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'paid',
      paidAt: new Date(),
      stripeInvoiceId: session.invoice as string || null,
    }
  });

  console.log(`[Stripe Webhook] Invoice ${invoiceId} marked as paid`);
}

async function handleInvoicePaid(stripeInvoice: Stripe.Invoice) {
  const invoiceId = stripeInvoice.metadata?.invoiceId;
  
  if (!invoiceId) {
    console.log('[Stripe Webhook] No invoiceId in metadata');
    return;
  }

  console.log(`[Stripe Webhook] Invoice paid: ${invoiceId}`);

  // Update invoice status
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'paid',
      paidAt: new Date(),
      stripeInvoiceId: stripeInvoice.id,
    }
  });
}

async function handleInvoicePaymentFailed(stripeInvoice: Stripe.Invoice) {
  const invoiceId = stripeInvoice.metadata?.invoiceId;
  
  if (!invoiceId) {
    console.log('[Stripe Webhook] No invoiceId in metadata');
    return;
  }

  console.log(`[Stripe Webhook] Invoice payment failed: ${invoiceId}`);

  // Mark as overdue
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'overdue',
    }
  });
}
