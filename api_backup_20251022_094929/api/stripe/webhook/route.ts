
import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    // Verify webhook signature (only in production)
    if (STRIPE_WEBHOOK_SECRET) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } else {
      // In development, parse without verification
      event = JSON.parse(body);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  try {
    const { customer_email, metadata } = session;

    if (!customer_email || !metadata?.packageId) {
      console.error('Missing required data in checkout session');
      return;
    }

    // Check if client already exists
    let client = await prisma.client.findUnique({
      where: { email: customer_email },
    });

    // Generate random password
    const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    if (!client) {
      // Create new client
      client = await prisma.client.create({
        data: {
          email: customer_email,
          name: metadata.customerName || customer_email.split('@')[0],
          password: hashedPassword,
          companyName: metadata.customerName || '',
          isActive: true,
          onboardingCompleted: false,
        },
      });
    }

    // Create or update subscription
    const existingSub = await prisma.clientSubscription.findUnique({
      where: { clientId: client.id },
    });

    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    if (existingSub) {
      await prisma.clientSubscription.update({
        where: { id: existingSub.id },
        data: {
          packageId: metadata.packageId,
          status: 'ACTIVE',
          startDate: new Date(),
          nextBillingDate,
        },
      });
    } else {
      await prisma.clientSubscription.create({
        data: {
          clientId: client.id,
          packageId: metadata.packageId,
          status: 'ACTIVE',
          startDate: new Date(),
          nextBillingDate,
        },
      });
    }

    // Store credentials for retrieval (in production, send email instead)
    await prisma.client.update({
      where: { id: client.id },
      data: {
        // Store temp password info in a way that can be retrieved once
        // In production, you'd send this via email and not store it
        phone: `TEMP_PASSWORD:${randomPassword}`, // Temporary storage
      },
    });

    console.log('✅ Client account created/updated:', customer_email);
  } catch (error) {
    console.error('Error handling checkout complete:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    
    // Find customer by Stripe customer ID
    const customer = await stripe.customers.retrieve(customerId);
    
    if ('deleted' in customer || !customer.email) {
      return;
    }

    const client = await prisma.client.findUnique({
      where: { email: customer.email },
    });

    if (client) {
      await prisma.clientSubscription.updateMany({
        where: { clientId: client.id },
        data: { status: 'CANCELLED' },
      });
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}
