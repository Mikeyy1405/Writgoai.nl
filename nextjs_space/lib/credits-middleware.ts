
/**
 * 💳 Credits Middleware - Enforce credit checks voor alle features
 * 
 * Dit zorgt ervoor dat ALLE content generatie en premium features
 * altijd credits checken voordat ze iets doen.
 */

import { NextResponse } from 'next/server';
import { hasEnoughCredits, deductCredits } from './credits';
import { prisma } from './db';

export interface CreditCheckResult {
  success: boolean;
  error?: string;
  statusCode?: number;
  availableCredits?: number;
}

/**
 * Check of een client genoeg credits heeft
 * Retourneert een error response als niet genoeg credits
 */
export async function checkCredits(
  clientId: string,
  requiredCredits: number,
  featureName: string
): Promise<CreditCheckResult> {
  try {
    // Check of client unlimited is
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        isUnlimited: true,
        subscriptionCredits: true,
        topUpCredits: true,
      },
    });

    if (!client) {
      return {
        success: false,
        error: 'Client niet gevonden',
        statusCode: 404,
      };
    }

    // Unlimited clients hebben altijd genoeg credits
    if (client.isUnlimited) {
      return { success: true, availableCredits: 999999 };
    }

    const availableCredits = client.subscriptionCredits + client.topUpCredits;

    // Check of genoeg credits
    if (availableCredits < requiredCredits) {
      return {
        success: false,
        error: `Onvoldoende credits. Je hebt ${requiredCredits} credits nodig, maar hebt slechts ${availableCredits.toFixed(1)} credits beschikbaar.`,
        statusCode: 402, // Payment Required
        availableCredits,
      };
    }

    return {
      success: true,
      availableCredits,
    };
  } catch (error) {
    console.error('Error checking credits:', error);
    return {
      success: false,
      error: 'Kon credits niet controleren',
      statusCode: 500,
    };
  }
}

/**
 * Middleware voor API routes - check credits vooraf
 */
export async function requireCredits(
  clientId: string,
  requiredCredits: number,
  featureName: string
): Promise<NextResponse | null> {
  const result = await checkCredits(clientId, requiredCredits, featureName);

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.error,
        requiredCredits,
        availableCredits: result.availableCredits || 0,
      },
      { status: result.statusCode || 400 }
    );
  }

  return null; // Success - continue
}

/**
 * Reserve credits voordat je een feature gebruikt
 * Dit voorkomt dat credits op zijn tijdens generatie
 */
export async function reserveCredits(
  clientId: string,
  amount: number,
  description: string
): Promise<{ success: boolean; error?: string }> {
  // Check eerst of genoeg credits
  const checkResult = await checkCredits(clientId, amount, description);
  if (!checkResult.success) {
    return {
      success: false,
      error: checkResult.error,
    };
  }

  // Deduct credits meteen (reserveren)
  const deductResult = await deductCredits(clientId, amount, description);

  return deductResult;
}

/**
 * Refund credits als een actie mislukt
 */
export async function refundCredits(
  clientId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean }> {
  try {
    // Tel credits terug op (naar topUpCredits voor nu)
    const client = await prisma.client.update({
      where: { id: clientId },
      data: {
        topUpCredits: { increment: amount },
        totalCreditsUsed: { decrement: amount },
      },
    });

    // Log de refund als transactie
    await prisma.creditTransaction.create({
      data: {
        clientId,
        amount: amount,
        type: 'refund',
        description: reason,
        balanceAfter: client.subscriptionCredits + client.topUpCredits,
      },
    });

    console.log(`✅ Refunded ${amount} credits to ${clientId}: ${reason}`);

    return { success: true };
  } catch (error) {
    console.error('Error refunding credits:', error);
    return { success: false };
  }
}

/**
 * Get credit info voor een client
 */
export async function getCreditInfo(clientId: string) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        subscriptionCredits: true,
        topUpCredits: true,
        isUnlimited: true,
        totalCreditsUsed: true,
        totalCreditsPurchased: true,
      },
    });

    if (!client) {
      return null;
    }

    const totalAvailable = client.subscriptionCredits + client.topUpCredits;

    return {
      subscriptionCredits: client.subscriptionCredits,
      topUpCredits: client.topUpCredits,
      totalAvailable,
      isUnlimited: client.isUnlimited,
      totalUsed: client.totalCreditsUsed,
      totalPurchased: client.totalCreditsPurchased,
    };
  } catch (error) {
    console.error('Error getting credit info:', error);
    return null;
  }
}
