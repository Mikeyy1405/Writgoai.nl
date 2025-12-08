import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { WebhookPayload } from '@/lib/moneybird-types';

export const dynamic = 'force-dynamic';

const webhookToken = process.env.MONEYBIRD_WEBHOOK_TOKEN || '';

export async function POST(request: NextRequest) {
  try {
    const payload: WebhookPayload = await request.json();
    
    // Verify webhook token
    if (webhookToken && payload.webhook_token !== webhookToken) {
      console.error('[Moneybird Webhook] Invalid webhook token');
      return NextResponse.json({ error: 'Invalid webhook token' }, { status: 401 });
    }

    console.log(`[Moneybird Webhook] Event received: ${payload.action}`);

    // Handle different webhook events
    switch (payload.action) {
      case 'sales_invoice_state_changed_to_paid':
        await handleInvoicePaid(payload);
        break;
      
      case 'sales_invoice_state_changed_to_late':
        await handleInvoiceLate(payload);
        break;

      case 'subscription_created':
        await handleSubscriptionCreated(payload);
        break;

      case 'subscription_updated':
        await handleSubscriptionUpdated(payload);
        break;

      case 'subscription_cancelled':
        await handleSubscriptionCancelled(payload);
        break;

      case 'payment_registered':
        await handlePaymentRegistered(payload);
        break;

      default:
        console.log(`[Moneybird Webhook] Unhandled event: ${payload.action}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Moneybird Webhook] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle invoice paid event - activate credits or subscription
 */
async function handleInvoicePaid(payload: WebhookPayload) {
  const invoiceId = payload.entity_id;
  console.log(`[Moneybird Webhook] Invoice paid: ${invoiceId}`);

  // Find our invoice by Moneybird invoice ID
  const invoice = await prisma.invoice.findFirst({
    where: { moneybirdInvoiceId: invoiceId },
    include: { client: true },
  });

  if (invoice) {
    // Update invoice status
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'paid',
        paidAt: new Date(),
        moneybirdState: payload.state,
      },
    });

    console.log(`[Moneybird Webhook] Invoice ${invoice.id} marked as paid`);
    return;
  }

  // Check if this is a credit purchase
  const creditPurchase = await prisma.creditPurchase.findFirst({
    where: { moneybirdInvoiceId: invoiceId },
    include: { client: true },
  });

  if (creditPurchase && creditPurchase.paymentStatus !== 'completed') {
    // Mark purchase as completed
    await prisma.creditPurchase.update({
      where: { id: creditPurchase.id },
      data: {
        paymentStatus: 'completed',
        completedAt: new Date(),
      },
    });

    // Add credits to client
    await prisma.client.update({
      where: { id: creditPurchase.clientId },
      data: {
        topUpCredits: {
          increment: creditPurchase.credits,
        },
        totalCreditsPurchased: {
          increment: creditPurchase.credits,
        },
      },
    });

    console.log(
      `[Moneybird Webhook] Added ${creditPurchase.credits} credits to client ${creditPurchase.clientId}`
    );
  }
}

/**
 * Handle invoice late event
 */
async function handleInvoiceLate(payload: WebhookPayload) {
  const invoiceId = payload.entity_id;
  console.log(`[Moneybird Webhook] Invoice late: ${invoiceId}`);

  // Update invoice status
  await prisma.invoice.updateMany({
    where: { moneybirdInvoiceId: invoiceId },
    data: {
      status: 'overdue',
      moneybirdState: payload.state,
    },
  });
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(payload: WebhookPayload) {
  const subscriptionId = payload.entity_id;
  console.log(`[Moneybird Webhook] Subscription created: ${subscriptionId}`);

  // The subscription should already be created by our create-subscription endpoint
  // This webhook confirms it was created successfully in Moneybird
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(payload: WebhookPayload) {
  const subscriptionId = payload.entity_id;
  console.log(`[Moneybird Webhook] Subscription updated: ${subscriptionId}`);

  // Optionally sync subscription details from Moneybird
}

/**
 * Handle subscription cancelled event
 */
async function handleSubscriptionCancelled(payload: WebhookPayload) {
  const subscriptionId = payload.entity_id;
  console.log(`[Moneybird Webhook] Subscription cancelled: ${subscriptionId}`);

  // Find and update client subscription
  const client = await prisma.client.findFirst({
    where: { moneybirdSubscriptionId: subscriptionId },
  });

  if (client) {
    await prisma.client.update({
      where: { id: client.id },
      data: {
        subscriptionStatus: 'cancelled',
        subscriptionEndDate: new Date(),
      },
    });

    console.log(`[Moneybird Webhook] Client ${client.id} subscription cancelled`);
  }
}

/**
 * Handle payment registered event
 */
async function handlePaymentRegistered(payload: WebhookPayload) {
  console.log(`[Moneybird Webhook] Payment registered for entity: ${payload.entity_type}`);
  
  // Payment registered can trigger invoice paid, so we handle it there
  if (payload.entity_type === 'SalesInvoice') {
    await handleInvoicePaid(payload);
  }
}
