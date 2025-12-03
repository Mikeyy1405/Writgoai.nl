
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';
import { sendAdminNotification } from '@/lib/notification-helper';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Check if this is a credit top-up or subscription
        if (session.metadata?.type === 'credit_topup') {
          await handleCreditTopup(session);
        } else {
          await handleCheckoutCompleted(session);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_email;
  const subscriptionId = session.subscription as string;
  const clientReferenceId = session.client_reference_id; // Client ID from checkout
  
  if (!subscriptionId) {
    console.error('Missing subscription ID in checkout session');
    return;
  }

  // Get subscription details
  const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
  const planId = subscription.metadata?.planId || '';
  const monthlyCredits = parseInt(subscription.metadata?.monthlyCredits || '0');

  // Find client - try multiple methods
  let client = null;
  
  // Method 1: Try client_reference_id (most reliable if user was logged in)
  if (clientReferenceId) {
    console.log('🔍 Searching for client by ID:', clientReferenceId);
    client = await prisma.client.findUnique({
      where: { id: clientReferenceId },
    });
  }
  
  // Method 2: Try customer email
  if (!client && customerEmail) {
    console.log('🔍 Searching for client by email:', customerEmail);
    client = await prisma.client.findUnique({
      where: { email: customerEmail.toLowerCase() },
    });
  }

  if (!client) {
    // Create new client if doesn't exist
    console.log('⚠️  No existing client found, creating new account for:', customerEmail);
    
    if (!customerEmail) {
      console.error('❌ Cannot create client: no email available');
      
      // Send urgent admin notification
      sendAdminNotification({
        type: 'subscription_error',
        clientId: 'unknown',
        clientName: session.customer_details?.name || 'Unknown',
        clientEmail: 'unknown',
        details: {
          error: 'Cannot match subscription to client - no email or ID',
          subscriptionId,
          sessionId: session.id,
          planId,
          monthlyCredits,
        },
      }).catch((err) => console.error('Failed to send error notification:', err));
      
      return;
    }
    
    // Generate a temporary password reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    client = await prisma.client.create({
      data: {
        email: customerEmail.toLowerCase(),
        name: session.customer_details?.name || 'Nieuwe Klant',
        password: '', // Empty password - user must set it via email link
        subscriptionId,
        subscriptionPlan: planId,
        subscriptionStatus: subscription.status || 'active',
        subscriptionStartDate: new Date((subscription.current_period_start || 0) * 1000),
        subscriptionEndDate: new Date((subscription.current_period_end || 0) * 1000),
        monthlyCredits,
        subscriptionCredits: monthlyCredits,
      },
    });
    
    // Send welcome email with account activation link
    const { sendSubscriptionWelcomeEmail } = require('@/lib/email');
    sendSubscriptionWelcomeEmail({
      to: customerEmail,
      name: client.name,
      planName: planId.charAt(0).toUpperCase() + planId.slice(1),
      monthlyCredits,
      resetToken,
    }).catch((err) => console.error('Failed to send welcome email:', err));
    
    console.log(`✅ New client created with subscription: ${customerEmail}`);
  } else {
    // Update existing client
    await prisma.client.update({
      where: { id: client.id },
      data: {
        subscriptionId,
        subscriptionPlan: planId,
        subscriptionStatus: subscription.status || 'active',
        subscriptionStartDate: new Date((subscription.current_period_start || 0) * 1000),
        subscriptionEndDate: new Date((subscription.current_period_end || 0) * 1000),
        monthlyCredits,
        subscriptionCredits: monthlyCredits,
      },
    });
    
    console.log(`✅ Subscription activated for existing client: ${client.email} (${planId}, ${monthlyCredits} credits)`);
  }

  // Log credit transaction
  await prisma.creditTransaction.create({
    data: {
      clientId: client.id,
      amount: monthlyCredits,
      type: 'subscription',
      description: `✅ ${planId.charAt(0).toUpperCase() + planId.slice(1)} abonnement geactiveerd - ${monthlyCredits} maandelijkse credits`,
      balanceAfter: (client.subscriptionCredits || 0) + (client.topUpCredits || 0),
    },
  });

  // Create CreditPurchase record for initial subscription payment
  const initialPrice = (session.amount_total || 0) / 100; // Convert from cents
  if (initialPrice > 0) {
    await prisma.creditPurchase.create({
      data: {
        clientId: client.id,
        packageId: planId || 'subscription',
        packageName: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Abonnement`,
        credits: monthlyCredits,
        priceEur: initialPrice,
        stripePaymentId: session.payment_intent as string,
        stripeSessionId: session.id,
        paymentStatus: 'completed',
        completedAt: new Date(),
      },
    });
  }

  // 📧 Stuur admin notificatie voor nieuwe subscription
  sendAdminNotification({
    type: 'subscription_started',
    clientId: client.id,
    clientName: client.name,
    clientEmail: client.email,
    details: {
      plan: planId,
      monthlyCredits,
      status: subscription.status,
      paymentEmail: customerEmail,
      matchedBy: clientReferenceId ? 'client_id' : 'email',
    },
  }).catch((err) => console.error('Failed to send subscription started notification:', err));
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const client = await prisma.client.findUnique({
    where: { subscriptionId: subscription.id },
  });

  if (!client) {
    console.error('Client not found for subscription:', subscription.id);
    return;
  }

  const sub: any = subscription;
  const planId = sub.metadata?.planId || '';
  const monthlyCredits = parseInt(sub.metadata?.monthlyCredits || '0');

  await prisma.client.update({
    where: { id: client.id },
    data: {
      subscriptionPlan: planId,
      subscriptionStatus: sub.status || 'active',
      subscriptionStartDate: new Date((sub.current_period_start || 0) * 1000),
      subscriptionEndDate: new Date((sub.current_period_end || 0) * 1000),
      monthlyCredits,
      // Reset subscription credits on renewal
      subscriptionCredits: monthlyCredits,
    },
  });

  console.log(`Subscription updated for client ${client.email}: ${planId} (${monthlyCredits} credits)`);

  // 📧 Stuur admin notificatie voor subscription wijziging
  sendAdminNotification({
    type: 'subscription_changed',
    clientId: client.id,
    clientName: client.name,
    clientEmail: client.email,
    details: {
      oldPlan: client.subscriptionPlan,
      newPlan: planId,
      monthlyCredits,
      status: sub.status,
    },
  }).catch((err) => console.error('Failed to send subscription changed notification:', err));
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const client = await prisma.client.findUnique({
    where: { subscriptionId: subscription.id },
  });

  if (!client) {
    console.error('Client not found for subscription:', subscription.id);
    return;
  }

  await prisma.client.update({
    where: { id: client.id },
    data: {
      subscriptionStatus: 'canceled',
      subscriptionEndDate: new Date(),
    },
  });

  console.log(`Subscription cancelled for client ${client.email}`);

  // 📧 Stuur admin notificatie voor subscription cancellation
  sendAdminNotification({
    type: 'subscription_cancelled',
    clientId: client.id,
    clientName: client.name,
    clientEmail: client.email,
    details: {
      plan: client.subscriptionPlan || 'Unknown',
      cancelledAt: new Date().toISOString(),
    },
  }).catch((err) => console.error('Failed to send subscription cancelled notification:', err));
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const inv: any = invoice;
  const subscriptionId = inv.subscription as string;
  
  if (!subscriptionId) return;

  const client = await prisma.client.findUnique({
    where: { subscriptionId },
  });

  if (!client) return;

  // Renew credits on successful payment
  const monthlyCredits = client.monthlyCredits || 0;
  const priceEur = (invoice.amount_paid || 0) / 100; // Convert from cents
  
  await prisma.client.update({
    where: { id: client.id },
    data: {
      subscriptionCredits: monthlyCredits,
      subscriptionStatus: 'active',
    },
  });

  // Create CreditPurchase record for revenue tracking (subscription payment)
  if (priceEur > 0) {
    const planName = client.subscriptionPlan 
      ? `${client.subscriptionPlan.charAt(0).toUpperCase() + client.subscriptionPlan.slice(1)} Abonnement`
      : 'Abonnement';
    
    await prisma.creditPurchase.create({
      data: {
        clientId: client.id,
        packageId: client.subscriptionPlan || 'subscription',
        packageName: planName,
        credits: monthlyCredits,
        priceEur,
        stripePaymentId: (invoice as any).payment_intent as string,
        stripeSessionId: invoice.id,
        paymentStatus: 'completed',
        completedAt: new Date(),
      },
    });
  }

  console.log(`Credits renewed for client ${client.email}: ${monthlyCredits} credits`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const inv: any = invoice;
  const subscriptionId = inv.subscription as string;
  
  if (!subscriptionId) return;

  const client = await prisma.client.findUnique({
    where: { subscriptionId },
  });

  if (!client) return;

  await prisma.client.update({
    where: { id: client.id },
    data: {
      subscriptionStatus: 'past_due',
    },
  });

  console.log(`Payment failed for client ${client.email}`);
}

async function handleCreditTopup(session: Stripe.Checkout.Session) {
  const clientId = session.metadata?.clientId;
  const credits = parseInt(session.metadata?.credits || '0');
  const packageName = session.metadata?.packageName || 'Credit Top-up';
  const priceEur = (session.amount_total || 0) / 100; // Convert from cents

  if (!clientId || !credits) {
    console.error('Missing clientId or credits in session metadata');
    return;
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client) {
    console.error('Client not found:', clientId);
    return;
  }

  // Add credits to topUpCredits
  await prisma.client.update({
    where: { id: clientId },
    data: {
      topUpCredits: (client.topUpCredits || 0) + credits,
      totalCreditsPurchased: (client.totalCreditsPurchased || 0) + credits,
    },
  });

  // Create CreditPurchase record for revenue tracking
  await prisma.creditPurchase.create({
    data: {
      clientId: client.id,
      packageId: session.metadata?.packageId || 'custom',
      packageName,
      credits,
      priceEur,
      stripePaymentId: session.payment_intent as string,
      stripeSessionId: session.id,
      paymentStatus: 'completed',
      completedAt: new Date(),
    },
  });

  console.log(`Added ${credits} top-up credits for client ${client.email}`);

  // 📧 Stuur admin notificatie voor credit aankoop
  sendAdminNotification({
    type: 'credits_purchased',
    clientId: client.id,
    clientName: client.name,
    clientEmail: client.email,
    details: {
      credits,
      price: priceEur,
      type: 'Top-up',
    },
  }).catch((err) => console.error('Failed to send credits purchased notification:', err));
}
