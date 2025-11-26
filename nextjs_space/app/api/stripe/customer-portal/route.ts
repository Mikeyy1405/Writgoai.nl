

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { subscriptionId: true },
    });

    if (!client?.subscriptionId) {
      return NextResponse.json(
        { error: 'Geen actief abonnement gevonden' },
        { status: 400 }
      );
    }

    // Get subscription to find customer ID
    const subscription = await stripe.subscriptions.retrieve(client.subscriptionId);
    const customerId = subscription.customer as string;

    const baseUrl = process.env.NEXTAUTH_URL || 'https://WritgoAI.nl';

    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/client-portal/account`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Customer portal error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
