

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client || !client.subscriptionId) {
      return NextResponse.json({ invoices: [] });
    }

    // Get subscription to find customer
    const subscription = await stripe.subscriptions.retrieve(client.subscriptionId);
    
    if (!subscription.customer) {
      return NextResponse.json({ invoices: [] });
    }

    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer.id;

    // Get all invoices for this customer
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 100,
    });

    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      amount: invoice.amount_paid,
      status: invoice.status,
      created: invoice.created,
      invoice_pdf: invoice.invoice_pdf,
      period_start: invoice.period_start,
      period_end: invoice.period_end,
      description: invoice.description,
    }));

    return NextResponse.json({ invoices: formattedInvoices });
  } catch (error: any) {
    console.error('Get invoices error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het ophalen van facturen', invoices: [] },
      { status: 500 }
    );
  }
}
