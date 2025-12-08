

export const dynamic = "force-dynamic";
/**
 * Purchase credits via Stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Initialize Stripe (alleen als key bestaat)
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
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json(
        { error: 'packageId is required' },
        { status: 400 }
      );
    }

    // Get package details
    const pkg = await prisma.creditPackage.findUnique({
      where: { id: packageId }
    });

    if (!pkg || !pkg.active) {
      return NextResponse.json(
        { error: 'Package not found or inactive' },
        { status: 404 }
      );
    }

    // Get client info
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { email: true, name: true }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 503 }
      );
    }

    // Create purchase record
    const purchase = await prisma.creditPurchase.create({
      data: {
        clientId,
        packageId: pkg.id,
        packageName: pkg.name,
        credits: pkg.credits,
        priceEur: pkg.priceEur,
        paymentStatus: 'pending'
      }
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: client.email,
      payment_method_types: ['card', 'ideal'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${pkg.name} - ${pkg.credits} Credits`,
              description: pkg.description || undefined
            },
            unit_amount: Math.round(pkg.priceEur * 100) // Stripe expects cents
          },
          quantity: 1
        }
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://WritgoAI.nl'}/client-portal?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://WritgoAI.nl'}/client-portal?payment=cancelled`,
      metadata: {
        purchaseId: purchase.id,
        clientId,
        packageId: pkg.id,
        credits: pkg.credits.toString()
      }
    });

    // Update purchase with session ID
    await prisma.creditPurchase.update({
      where: { id: purchase.id },
      data: { stripeSessionId: session.id }
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    });

  } catch (error: any) {
    console.error('Purchase error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
