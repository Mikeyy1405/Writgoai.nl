import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';

// Create Stripe Checkout Session for client to pay invoice
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Get invoice with items
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: params.id,
        clientId: client.id, // Security: ensure invoice belongs to client
      },
      include: {
        items: true,
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Factuur niet gevonden' }, { status: 404 });
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Factuur is al betaald' }, { status: 400 });
    }

    // Get origin for URLs
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'ideal'],
      line_items: invoice.items.map(item => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.description,
          },
          unit_amount: Math.round(item.unitPrice * 100), // Convert to cents
        },
        quantity: item.quantity,
      })),
      metadata: {
        invoiceId: invoice.id,
        clientId: invoice.clientId,
      },
      customer_email: client.email,
      success_url: `${origin}/client-portal/facturen?payment=success&invoice=${invoice.invoiceNumber}`,
      cancel_url: `${origin}/client-portal/facturen?payment=cancelled`,
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `Betaling voor factuur ${invoice.invoiceNumber}`,
          metadata: {
            invoiceId: invoice.id,
          },
        },
      },
    });

    // Update invoice with Stripe info if not set yet
    if (!invoice.stripePaymentUrl) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          stripePaymentUrl: checkoutSession.url,
        }
      });
    }

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error: any) {
    console.error('Error creating Stripe checkout:', error);
    return NextResponse.json(
      { error: error.message || 'Kon checkout niet aanmaken' },
      { status: 500 }
    );
  }
}
