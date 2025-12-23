import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase-server';
import { STRIPE_PACKAGES, type PackageTier } from '@/lib/stripe-config';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get package selection from request
    const { package: packageTier } = await request.json();
    
    if (!packageTier || !(packageTier in STRIPE_PACKAGES)) {
      return NextResponse.json(
        { error: 'Invalid package selection' },
        { status: 400 }
      );
    }

    const selectedPackage = STRIPE_PACKAGES[packageTier as PackageTier];

    // Check if user already has a Stripe customer ID
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = subscriber?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to database
      await supabase
        .from('subscribers')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
        });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card', 'ideal'],
      line_items: [
        {
          price: selectedPackage.price_id,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/#pricing`,
      metadata: {
        user_id: user.id,
        package: packageTier,
        credits: selectedPackage.credits.toString(),
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          package: packageTier,
          credits: selectedPackage.credits.toString(),
        },
      },
    });

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
