
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-11-17.clover',
  });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        managedServiceSubscription: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ subscription: client.managedServiceSubscription });
  } catch (error) {
    console.error('[MANAGED_SERVICE_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        managedServiceSubscription: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (client.managedServiceSubscription) {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      projectId,
      contentPiecesPerMonth,
      socialPostsPerWeek,
      platforms,
      language,
    } = body;

    // Maak Stripe Subscription
    const subscription = await getStripe().subscriptions.create({
      customer: await getOrCreateStripeCustomer(client.email, client.name),
      items: [
        {
          price_data: {
            currency: 'eur',
            product: (await getStripe().products.create({
              name: 'Writgo Managed Service AI',
              description: 'Complete content & social media service - automatisch gegenereerd',
            })).id,
            unit_amount: 19900, // €199,00
            recurring: {
              interval: 'month',
            },
          },
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    const managedService = await prisma.managedServiceSubscription.create({
      data: {
        clientId: client.id,
        projectId: projectId || null,
        stripeSubscriptionId: subscription.id,
        status: 'active',
        contentPiecesPerMonth: contentPiecesPerMonth || 8,
        socialPostsPerWeek: socialPostsPerWeek || 5,
        platforms: platforms || [],
        language: language || 'NL',
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      subscription: managedService,
      paymentIntent: (subscription.latest_invoice as any)?.payment_intent,
    });
  } catch (error) {
    console.error('[MANAGED_SERVICE_POST]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        managedServiceSubscription: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (!client.managedServiceSubscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      status,
      contentPiecesPerMonth,
      socialPostsPerWeek,
      platforms,
      language,
      projectId,
    } = body;

    const updatedSubscription = await prisma.managedServiceSubscription.update({
      where: { id: client.managedServiceSubscription.id },
      data: {
        ...(status && { status }),
        ...(contentPiecesPerMonth && { contentPiecesPerMonth }),
        ...(socialPostsPerWeek && { socialPostsPerWeek }),
        ...(platforms && { platforms }),
        ...(language && { language }),
        ...(projectId !== undefined && { projectId: projectId || null }),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ subscription: updatedSubscription });
  } catch (error) {
    console.error('[MANAGED_SERVICE_PATCH]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        managedServiceSubscription: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (!client.managedServiceSubscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Cancel Stripe subscription
    if (client.managedServiceSubscription.stripeSubscriptionId) {
      await getStripe().subscriptions.cancel(
        client.managedServiceSubscription.stripeSubscriptionId
      );
    }

    await prisma.managedServiceSubscription.update({
      where: { id: client.managedServiceSubscription.id },
      data: {
        status: 'cancelled',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MANAGED_SERVICE_DELETE]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getOrCreateStripeCustomer(email: string, name: string) {
  const customers = await getStripe().customers.list({
    email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0].id;
  }

  const customer = await getStripe().customers.create({
    email,
    name,
  });

  return customer.id;
}
