import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getMoneybird } from '@/lib/moneybird';

export const dynamic = 'force-dynamic';

// Mapping of plan IDs to Moneybird product IDs and credits
const PLAN_CONFIG = {
  basis: {
    name: 'WritgoAI Basis',
    credits: 2000,
    price: 49.0,
    productId: process.env.MONEYBIRD_PRODUCT_BASIS_ID || '',
  },
  professional: {
    name: 'WritgoAI Professional',
    credits: 6000,
    price: 99.0,
    productId: process.env.MONEYBIRD_PRODUCT_PROFESSIONAL_ID || '',
  },
  business: {
    name: 'WritgoAI Business',
    credits: 15000,
    price: 199.0,
    productId: process.env.MONEYBIRD_PRODUCT_BUSINESS_ID || '',
  },
  enterprise: {
    name: 'WritgoAI Enterprise',
    credits: 40000,
    price: 399.0,
    productId: process.env.MONEYBIRD_PRODUCT_ENTERPRISE_ID || '',
  },
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { planId } = await req.json();

    if (!planId || !PLAN_CONFIG[planId as keyof typeof PLAN_CONFIG]) {
      return NextResponse.json({ error: 'Ongeldig abonnement' }, { status: 400 });
    }

    const plan = PLAN_CONFIG[planId as keyof typeof PLAN_CONFIG];

    if (!plan.productId) {
      return NextResponse.json(
        { error: `Moneybird product ID niet geconfigureerd voor ${planId}` },
        { status: 500 }
      );
    }

    // Get client from database
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Initialize Moneybird client
    const moneybird = getMoneybird();

    // Get or create Moneybird contact
    let contact = client.moneybirdContactId
      ? await moneybird.getContact(client.moneybirdContactId)
      : await moneybird.getContactByCustomerId(client.id);

    if (!contact) {
      // Create new contact
      const nameParts = client.name.split(' ');
      contact = await moneybird.createOrUpdateContact({
        company_name: client.companyName || client.name,
        firstname: client.companyName ? '' : nameParts[0] || '',
        lastname: client.companyName ? '' : nameParts.slice(1).join(' ') || '',
        email: client.email,
        customer_id: client.id,
        send_invoices_to_email: client.email,
      });

      console.log(`[Moneybird] Created contact ${contact.id} for client ${client.id}`);
    }

    // Get tax rate and ledger account IDs from environment
    const taxRateId = process.env.MONEYBIRD_TAX_RATE_21_ID;
    const ledgerAccountId = process.env.MONEYBIRD_REVENUE_LEDGER_ID;

    if (!taxRateId || !ledgerAccountId) {
      return NextResponse.json(
        { error: 'Moneybird BTW of grootboekrekening niet geconfigureerd' },
        { status: 500 }
      );
    }

    // Create subscription
    const subscription = await moneybird.createSubscription({
      contact_id: contact.id,
      start_date: new Date().toISOString().split('T')[0],
      frequency: 'month',
      frequency_amount: 1,
      auto_send: true,
      details_attributes: [
        {
          description: plan.name,
          price: plan.price.toFixed(2),
          amount: '1',
          tax_rate_id: taxRateId,
          ledger_account_id: ledgerAccountId,
        },
      ],
    });

    console.log(
      `[Moneybird] Created subscription ${subscription.id} for client ${client.id}`
    );

    // Update client in database
    await prisma.client.update({
      where: { id: client.id },
      data: {
        moneybirdContactId: contact.id,
        moneybirdSubscriptionId: subscription.id,
        subscriptionPlan: planId,
        subscriptionStatus: 'pending', // Will become 'active' after first payment
        subscriptionStartDate: new Date(),
        monthlyCredits: plan.credits,
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      message:
        'Abonnement aangemaakt! Je ontvangt binnenkort een factuur per e-mail. Na betaling wordt je abonnement geactiveerd.',
    });
  } catch (error: any) {
    console.error('[Moneybird] Create subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het aanmaken van het abonnement' },
      { status: 500 }
    );
  }
}
