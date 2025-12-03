/**
 * 💳 Credits Middleware - Nu alleen Usage Tracking (Pay-as-you-go)
 * 
 * BELANGRIJK: Dit systeem blokkeert NIETS meer.
 * Alle functies returnen success en loggen alleen voor facturering.
 */

import { NextResponse } from 'next/server';
import { prisma } from './db';
import { trackUsage } from './usage-tracking';

export interface CreditCheckResult {
  success: boolean;
  error?: string;
  statusCode?: number;
  availableCredits?: number;
}

/**
 * Check of een client genoeg credits heeft - ALTIJD SUCCESS (pay-as-you-go)
 */
export async function checkCredits(
  clientId: string,
  requiredCredits: number,
  featureName: string
): Promise<CreditCheckResult> {
  // Pay-as-you-go: altijd toegang
  return { success: true, availableCredits: 999999 };
}

/**
 * Middleware voor API routes - ALTIJD TOEGANG (pay-as-you-go)
 */
export async function requireCredits(
  clientId: string,
  requiredCredits: number,
  featureName: string
): Promise<NextResponse | null> {
  // Pay-as-you-go: nooit blokkeren
  return null;
}

/**
 * Reserve credits - Nu alleen usage tracking
 */
export async function reserveCredits(
  clientId: string,
  amount: number,
  description: string
): Promise<{ success: boolean; error?: string }> {
  // Track usage voor facturering (non-blocking)
  trackUsage({
    clientId,
    tool: 'reserved',
    action: description,
    details: { reservedAmount: amount },
  }).catch(err => {
    console.error('Usage tracking error (non-blocking):', err);
  });

  return { success: true };
}

/**
 * Refund credits - Nu alleen logging
 */
export async function refundCredits(
  clientId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean }> {
  console.log(`💰 [Refund logged] ${amount} for ${clientId}: ${reason}`);
  return { success: true };
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

    return {
      subscriptionCredits: client.subscriptionCredits,
      topUpCredits: client.topUpCredits,
      totalAvailable: 999999, // Pay-as-you-go: onbeperkt
      isUnlimited: true, // Iedereen is nu effectief unlimited
      totalUsed: client.totalCreditsUsed,
      totalPurchased: client.totalCreditsPurchased,
    };
  } catch (error) {
    console.error('Error getting credit info:', error);
    return null;
  }
}
