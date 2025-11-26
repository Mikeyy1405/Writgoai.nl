

export const dynamic = "force-dynamic";
/**
 * Cancel subscription
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
    apiVersion: '2025-10-29.clover'
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

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { subscriptionId: true, subscriptionStatus: true }
    });

    if (!client?.subscriptionId) {
      return NextResponse.json(
        { error: 'Geen actief abonnement gevonden' },
        { status: 400 }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 503 }
      );
    }

    // Cancel subscription at period end (client keeps access until end of billing period)
    const subscription = await stripe.subscriptions.update(
      client.subscriptionId,
      {
        cancel_at_period_end: true
      }
    ) as any;

    // Update client
    await prisma.client.update({
      where: { id: clientId },
      data: {
        subscriptionStatus: 'cancelled'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Abonnement wordt geannuleerd aan het einde van de huidige periode',
      endsAt: subscription.current_period_end
    });

  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
