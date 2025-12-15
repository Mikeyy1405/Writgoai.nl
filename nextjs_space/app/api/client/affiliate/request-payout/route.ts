
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Request Affiliate Payout
 * POST /api/client/affiliate/request-payout
 * 
 * Vraagt een uitbetaling aan van affiliate commissies
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        affiliateTotalEarnings: true,
        affiliateWithdrawn: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const body = await req.json();
    const { amount, paymentMethod, paymentDetails } = body;

    // Validatie
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Ongeldig bedrag' }, { status: 400 });
    }

    const availableBalance = client.affiliateTotalEarnings - client.affiliateWithdrawn;

    if (amount > availableBalance) {
      return NextResponse.json({ 
        error: `Onvoldoende saldo. Beschikbaar: €${availableBalance.toFixed(2)}`,
        available: availableBalance,
      }, { status: 400 });
    }

    // Minimum uitbetaling van €50
    const MINIMUM_PAYOUT = 50;
    if (amount < MINIMUM_PAYOUT) {
      return NextResponse.json({ 
        error: `Minimum uitbetaling is €${MINIMUM_PAYOUT}`,
        minimum: MINIMUM_PAYOUT,
      }, { status: 400 });
    }

    if (!paymentMethod || !['bank_transfer', 'paypal', 'credits'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Ongeldige betaalmethode' }, { status: 400 });
    }

    // Check of er al een pending payout is
    const existingPayout = await prisma.affiliatePayout.findFirst({
      where: {
        affiliateClientId: client.id,
        status: { in: ['requested', 'processing'] },
      },
    });

    if (existingPayout) {
      return NextResponse.json({ 
        error: 'Je hebt al een uitbetaling in behandeling',
      }, { status: 400 });
    }

    // Maak payout request
    const payout = await prisma.affiliatePayout.create({
      data: {
        affiliateClientId: client.id,
        amount,
        paymentMethod,
        paymentDetails: paymentDetails || {},
        status: 'requested',
      },
    });

    // Update withdrawn amount (optimistic)
    await prisma.client.update({
      where: { id: client.id },
      data: {
        affiliateWithdrawn: { increment: amount },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Uitbetaling van €${amount.toFixed(2)} aangevraagd! We verwerken dit binnen 5-7 werkdagen.`,
      payout: {
        id: payout.id,
        amount: payout.amount,
        paymentMethod: payout.paymentMethod,
        status: payout.status,
        requestedAt: payout.requestedAt,
      },
    });

  } catch (error: any) {
    console.error('Request payout error:', error);
    return NextResponse.json({
      error: 'Er is een fout opgetreden',
      details: error.message,
    }, { status: 500 });
  }
}
