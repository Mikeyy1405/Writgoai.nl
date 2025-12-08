

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        monthlyCredits: true,
        subscriptionId: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Check if subscription is active
    const hasActiveSubscription = 
      client.subscriptionStatus === 'active' ||
      client.subscriptionStatus === 'trialing';

    // Stripe removed - cancelAtPeriodEnd check no longer available
    const cancelAtPeriodEnd = false;

    return NextResponse.json({
      hasActiveSubscription,
      plan: client.subscriptionPlan,
      status: client.subscriptionStatus,
      monthlyCredits: client.monthlyCredits || 0,
      currentPeriodEnd: client.subscriptionEndDate,
      cancelAtPeriodEnd,
    });
  } catch (error: any) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
