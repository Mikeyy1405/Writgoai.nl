

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export async function GET() {
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
      return NextResponse.json({ invoices: [] });
    }

    // Get subscription to find customer ID
    const subscription = await stripe.subscriptions.retrieve(client.subscriptionId);
    const customerId = subscription.customer as string;

    // Get invoices for this customer
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 20,
    });

    const formattedInvoices = invoices.data.map((invoice) => ({
      id: invoice.id,
      date: invoice.created,
      amount: invoice.amount_paid,
      status: invoice.status,
      pdfUrl: invoice.invoice_pdf || '',
      planName: invoice.lines.data[0]?.description || 'WritgoAI Subscription',
    }));

    return NextResponse.json({ invoices: formattedInvoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het ophalen van facturen' },
      { status: 500 }
    );
  }
}
