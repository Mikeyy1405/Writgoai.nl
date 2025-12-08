import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getMoneybird } from '@/lib/moneybird';

export const dynamic = 'force-dynamic';

// Credit packages configuration
const CREDIT_PACKAGES: Record<
  string,
  { credits: number; price: number; name: string; bonus?: number }
> = {
  credits_500: {
    credits: 500,
    price: 17.0,
    name: '500 Credits',
  },
  credits_1000: {
    credits: 1000,
    price: 32.0,
    name: '1000 Credits',
  },
  credits_2500: {
    credits: 2500,
    price: 75.0,
    name: '2500 Credits',
  },
};

export async function POST(req: NextRequest) {
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
    const totalCredits = pkg.credits + (pkg.bonus || 0);

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
      contact = await moneybird.createOrUpdateContact({
        company_name: client.companyName || client.name,
        firstname: client.companyName ? '' : client.name.split(' ')[0],
        lastname: client.companyName ? '' : client.name.split(' ').slice(1).join(' '),
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

    // Create sales invoice
    const invoice = await moneybird.createSalesInvoice({
      contact_id: contact.id,
      invoice_date: new Date().toISOString().split('T')[0],
      details_attributes: [
        {
          description: `WritgoAI Credits - ${totalCredits} credits`,
          price: pkg.price.toFixed(2),
          amount: '1',
          tax_rate_id: taxRateId,
          ledger_account_id: ledgerAccountId,
        },
      ],
    });

    console.log(`[Moneybird] Created invoice ${invoice.id} for client ${client.id}`);

    // Send invoice via email
    await moneybird.sendSalesInvoice(invoice.id, {
      delivery_method: 'Email',
      email_address: client.email,
      email_message: `Bedankt voor je bestelling van ${totalCredits} WritgoAI credits!`,
    });

    console.log(`[Moneybird] Sent invoice ${invoice.id} to ${client.email}`);

    // Create credit purchase record
    await prisma.creditPurchase.create({
      data: {
        clientId: client.id,
        packageId,
        packageName: pkg.name,
        credits: totalCredits,
        priceEur: pkg.price,
        moneybirdInvoiceId: invoice.id,
        paymentStatus: 'pending',
      },
    });

    // Update client's Moneybird contact ID if not set
    if (!client.moneybirdContactId) {
      await prisma.client.update({
        where: { id: client.id },
        data: { moneybirdContactId: contact.id },
      });
    }

    return NextResponse.json({
      success: true,
      invoiceId: invoice.id,
      message:
        'Factuur aangemaakt en verzonden! Je ontvangt de factuur per e-mail. Na betaling worden de credits automatisch toegevoegd.',
    });
  } catch (error: any) {
    console.error('[Moneybird] Create invoice error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het aanmaken van de factuur' },
      { status: 500 }
    );
  }
}
