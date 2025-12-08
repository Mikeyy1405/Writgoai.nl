

export const dynamic = "force-dynamic";
/**
 * Create a subscription via Stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Initialize Stripe
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia'
  });
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('client-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const clientId = decoded.clientId;

    const body = await request.json();
    const { planName } = body;

    if (!planName) {
      return NextResponse.json(
        { error: 'planName is required' },
        { status: 400 }
      );
    }

    // Get plan details
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { name: planName }
    });

    if (!plan || !plan.active) {
      return NextResponse.json(
        { error: 'Plan not found or inactive' },
        { status: 404 }
      );
    }

    // Get client info
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { 
        email: true, 
        name: true,
        subscriptionId: true,
        subscriptionStatus: true
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check if client already has an active subscription
    if (client.subscriptionId && client.subscriptionStatus === 'active') {
      return NextResponse.json(
        { error: 'Je hebt al een actief abonnement. Upgrade of annuleer eerst je huidige abonnement.' },
        { status: 400 }
      );
    }

    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 503 }
      );
    }

    // For now, we'll create one-time products. 
    // In production, you should create Stripe products/prices in dashboard and store stripePriceId
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: client.email,
      payment_method_types: ['card', 'ideal'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${plan.displayName} - Maandelijks`,
              description: `${plan.monthlyCredits} credits per maand`
            },
            unit_amount: Math.round(plan.priceEur * 100), // Stripe expects cents
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1
        }
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://WritgoAI.nl'}/client-portal?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://WritgoAI.nl'}/client-portal?subscription=cancelled`,
      metadata: {
        clientId,
        planName: plan.name,
        monthlyCredits: plan.monthlyCredits.toString()
      }
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    });

  } catch (error: any) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
