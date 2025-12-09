

export const dynamic = "force-dynamic";
/**
 * Get client credit balance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClientCredits } from '@/lib/credits';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Use NextAuth session instead of JWT
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const clientId = session.user.id;
    
    // Fetch credits and subscription info
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        subscriptionCredits: true,
        topUpCredits: true,
        isUnlimited: true,
        totalCreditsUsed: true,
        totalCreditsPurchased: true,
        subscriptionPlan: true, // Ook subscription plan ophalen
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      subscriptionCredits: client.subscriptionCredits,
      topUpCredits: client.topUpCredits,
      totalCredits: client.subscriptionCredits + client.topUpCredits,
      isUnlimited: client.isUnlimited,
      totalUsed: client.totalCreditsUsed,
      totalPurchased: client.totalCreditsPurchased,
      subscriptionPlan: client.subscriptionPlan // Subscription plan toevoegen
    });
  } catch (error: any) {
    console.error('Get balance error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
