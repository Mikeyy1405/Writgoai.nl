

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

interface CreditPackage {
  credits: number;
  price: number;
  name: string;
  bonus?: number;
}

const CREDIT_PACKAGES: Record<string, CreditPackage> = {
  credits_500: {
    credits: 500,
    price: 17.00,
    name: '500 Credits',
  },
  credits_1000: {
    credits: 1000,
    price: 32.00,
    name: '1000 Credits',
  },
  credits_2500: {
    credits: 2500,
    price: 75.00,
    name: '2500 Credits',
  },
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { packageId } = await req.json();

    if (!packageId || !CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES]) {
      return NextResponse.json({ error: 'Ongeldig pakket' }, { status: 400 });
    }

    const pkg = CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES];

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Check if client has an active subscription
    if (client.subscriptionStatus !== 'active' && client.subscriptionStatus !== 'trialing') {
      return NextResponse.json({ error: 'Je hebt een actief abonnement nodig om extra credits te kopen' }, { status: 400 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://WritgoAI.nl';
    const totalCredits = pkg.credits + (pkg.bonus || 0);

    // Create one-time payment checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'ideal'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: pkg.name,
              description: `${totalCredits} WritgoAI credits`,
            },
            unit_amount: Math.round(pkg.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/client-portal/buy-credits?success=true`,
      cancel_url: `${baseUrl}/client-portal/buy-credits?canceled=true`,
      customer_email: session.user.email,
      metadata: {
        type: 'credit_topup',
        clientId: client.id,
        credits: totalCredits.toString(),
        packageId,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Buy credits error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het kopen van credits' },
      { status: 500 }
    );
  }
}
