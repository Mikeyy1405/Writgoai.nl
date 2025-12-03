import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: {
        subscriptionCredits: true,
        topUpCredits: true,
        totalCreditsUsed: true,
        monthlyCredits: true,
        isUnlimited: true,
        hasCompletedOnboarding: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({
      subscriptionCredits: client.subscriptionCredits || 0,
      topUpCredits: client.topUpCredits || 0,
      totalCreditsUsed: client.totalCreditsUsed || 0,
      monthlyCredits: client.monthlyCredits || 0,
      isUnlimited: client.isUnlimited || false,
      hasCompletedOnboarding: client.hasCompletedOnboarding || false,
    });
  } catch (error: any) {
    console.error('Get credits error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
