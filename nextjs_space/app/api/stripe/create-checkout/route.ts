

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const PLAN_CONFIG = {
  starter: {
    name: 'Starter',
    credits: 1000,
    price: 29.00,
    priceId: process.env.STRIPE_STARTER_PRICE_ID || '',
  },
  pro: {
    name: 'Pro',
    credits: 3000,
    price: 79.00,
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
  },
  enterprise: {
    name: 'Enterprise',
    credits: 10000,
    price: 199.00,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
  },
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { planId } = await req.json();

    if (!planId || !PLAN_CONFIG[planId as keyof typeof PLAN_CONFIG]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const plan = PLAN_CONFIG[planId as keyof typeof PLAN_CONFIG];
    
    // Check if user is logged in
    let clientEmail = session?.user?.email;
    let clientId = session?.user?.id;
    
    const baseUrl = process.env.NEXTAUTH_URL || 'https://WritgoAI.nl';
    
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card', 'ideal'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/client-portal?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/prijzen?canceled=true`,
      customer_email: clientEmail,
      client_reference_id: clientId,
      metadata: {
        planId,
        planName: plan.name,
        monthlyCredits: plan.credits.toString(),
      },
      subscription_data: {
        metadata: {
          planId,
          planName: plan.name,
          monthlyCredits: plan.credits.toString(),
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het aanmaken van de checkout sessie' },
      { status: 500 }
    );
  }
}
