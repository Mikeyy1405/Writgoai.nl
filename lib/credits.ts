
/**
 * Credit System - Tracking en Management
 * NIEUWE PRIJZEN: Winstgevend en Duurzaam
 */

import { PrismaClient } from '@prisma/client';
import { checkAndNotifyLowCredits } from './notification-helper';

const prisma = new PrismaClient();

// 💰 NIEUWE CREDIT COSTS - Hogere Winstmarges
// Gebaseerd op: Starter €29 = 1000 credits, Pro €79 = 3000 credits, Enterprise €199 = 10k credits
// Dit geeft gezonde winstmarges van 300-500% boven kostprijs
export const CREDIT_COSTS = {
  // ✍️ Content Generation (Premium Features)
  BLOG_POST: 70,                // Was 50 → Blog artikel met research, afbeeldingen, SEO
  KEYWORD_RESEARCH: 40,         // Was 30 → Keyword research & concurrentie analyse
  LINKBUILDING: 50,             // Was 35 → Linkbuilding artikel
  NEWS_ARTICLE: 60,             // Was 40 → News artikel generatie
  
  // 📱 Social Media (Mid-tier)
  SOCIAL_MEDIA_IDEAS: 10,       // Social media ideeën genereren (10 ideeën)
  SOCIAL_POST: 20,              // Was 15 → Social media post
  
  // 🎬 Video (Premium)
  VIDEO_SHORT: 120,             // Was 80 → Video met voiceover & muziek
  VIDEO_MEDIUM: 150,            // Was 100 → Langere video's
  
  // 🔍 Research & Analysis (Mid-tier)
  WEB_SEARCH: 15,               // Was 10 → Web search & scraping
  
  // 💬 Chat Messages (Basis - laagdrempelig blijven)
  CHAT_MESSAGE_BASIC: 1,        // Gemini Flash, GPT-3.5
  CHAT_MESSAGE_ADVANCED: 5,     // GPT-4o, Claude Sonnet
  CHAT_MESSAGE_PREMIUM: 20,     // Claude Opus, GPT-4o Vision
  
  // 🎨 Images (Optimized pricing)
  IMAGE_FREE: 0,                // Gratis stock foto's (Pixabay/Pexels/Unsplash)
  IMAGE_ULTRA_BUDGET: 2,        // Nano Banana - Ultra snel en goedkoop!
  IMAGE_BUDGET_PRO: 3,          // Nano Banana Pro - Snelle pro versie
  IMAGE_BUDGET: 4,              // Stable Diffusion 3 ($0.037 per image) - Beste prijs/kwaliteit!
  IMAGE_STANDARD: 5,            // Flux Pro ($0.05 per image)
  IMAGE_PREMIUM: 18,            // GPT Image 1 ($0.18 per image) - Alleen voor speciale gevallen
  
  // 💻 Code (Mid-tier)
  CODE_GENERATION: 30,          // Was 25 → Code generatie
};

/**
 * ✅ NIEUWE WINSTMARGES (Starter pakket €0.029/credit):
 * 
 * Blog artikel (70 credits = €2.03):
 * - Kostprijs: €0.33
 * - Winst: €1.70 (515% marge)
 * 
 * Keyword research (40 credits = €1.16):
 * - Kostprijs: €0.075
 * - Winst: €1.09 (1353% marge)
 * 
 * Video (120 credits = €3.48):
 * - Kostprijs: €0.66
 * - Winst: €2.82 (427% marge)
 * 
 * Dit geeft ruimte voor:
 * - Server & API kosten
 * - Klantenservice
 * - Ontwikkeling
 * - Marketing
 * - Gezonde winstmarge
 */

/**
 * Check of client genoeg credits heeft (totaal van beide types)
 */
export async function hasEnoughCredits(
  clientId: string, 
  requiredCredits: number
): Promise<boolean> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { 
      subscriptionCredits: true, 
      topUpCredits: true, 
      isUnlimited: true 
    }
  });

  if (!client) return false;
  if (client.isUnlimited) return true;
  
  const totalCredits = client.subscriptionCredits + client.topUpCredits;
  return totalCredits >= requiredCredits;
}

/**
 * Deduct credits van een client
 * EERST abonnement credits gebruiken, dan pas top-up credits
 */
export async function deductCredits(
  clientId: string,
  amount: number,
  description: string,
  metadata?: {
    model?: string;
    tokensUsed?: number;
    messageId?: string;
  }
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    // Check of client unlimited is
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { 
        subscriptionCredits: true, 
        topUpCredits: true, 
        isUnlimited: true, 
        totalCreditsUsed: true 
      }
    });

    if (!client) {
      return { success: false, newBalance: 0, error: 'Client not found' };
    }

    // Unlimited clients hoeven niet te betalen
    if (client.isUnlimited) {
      // Log het wel voor analytics
      await prisma.creditTransaction.create({
        data: {
          clientId,
          amount: -amount,
          type: 'usage',
          description: `${description} (Unlimited account)`,
          model: metadata?.model,
          tokensUsed: metadata?.tokensUsed,
          messageId: metadata?.messageId,
          balanceAfter: 999999
        }
      });

      return { success: true, newBalance: 999999 };
    }

    // Check of er genoeg credits zijn (totaal)
    const totalCredits = client.subscriptionCredits + client.topUpCredits;
    if (totalCredits < amount) {
      return { 
        success: false, 
        newBalance: totalCredits, 
        error: 'Insufficient credits' 
      };
    }

    // Bereken hoeveel van elke bucket we moeten gebruiken
    // EERST subscription credits, dan pas top-up
    let remainingAmount = amount;
    let subscriptionDeduction = 0;
    let topUpDeduction = 0;

    if (client.subscriptionCredits >= remainingAmount) {
      // Alles kan uit subscription credits
      subscriptionDeduction = remainingAmount;
      remainingAmount = 0;
    } else {
      // Subscription credits op, gebruik top-up credits
      subscriptionDeduction = client.subscriptionCredits;
      remainingAmount -= client.subscriptionCredits;
      topUpDeduction = remainingAmount;
    }

    // Deduct credits en log transactie
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        subscriptionCredits: { decrement: subscriptionDeduction },
        topUpCredits: { decrement: topUpDeduction },
        totalCreditsUsed: { increment: amount }
      },
      select: { subscriptionCredits: true, topUpCredits: true }
    });

    const newBalance = updatedClient.subscriptionCredits + updatedClient.topUpCredits;

    await prisma.creditTransaction.create({
      data: {
        clientId,
        amount: -amount,
        type: 'usage',
        description: subscriptionDeduction > 0 && topUpDeduction > 0 
          ? `${description} (${subscriptionDeduction.toFixed(1)} abo + ${topUpDeduction.toFixed(1)} top-up)`
          : subscriptionDeduction > 0
          ? `${description} (abonnement credits)`
          : `${description} (top-up credits)`,
        model: metadata?.model,
        tokensUsed: metadata?.tokensUsed,
        messageId: metadata?.messageId,
        balanceAfter: newBalance
      }
    });

    // 📧 Check of credits laag zijn en stuur notificatie indien nodig
    checkAndNotifyLowCredits(clientId).catch((err) => {
      console.error('Failed to check low credits notification:', err);
    });

    return { success: true, newBalance };
  } catch (error: any) {
    console.error('Error deducting credits:', error);
    return { 
      success: false, 
      newBalance: 0, 
      error: error.message 
    };
  }
}

/**
 * Add credits to client
 * - 'purchase' en 'refund' gaan naar topUpCredits
 * - 'subscription' gaat naar subscriptionCredits
 * - 'bonus' gaat naar topUpCredits
 */
export async function addCredits(
  clientId: string,
  amount: number,
  type: 'purchase' | 'refund' | 'bonus' | 'subscription',
  description: string
): Promise<{ success: boolean; newBalance: number }> {
  try {
    // Bepaal naar welke bucket de credits gaan
    const isSubscriptionCredit = type === 'subscription';
    
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        ...(isSubscriptionCredit 
          ? { subscriptionCredits: { increment: amount } }
          : { topUpCredits: { increment: amount } }
        ),
        ...(type === 'purchase' && {
          totalCreditsPurchased: { increment: amount }
        })
      },
      select: { subscriptionCredits: true, topUpCredits: true }
    });

    const newBalance = updatedClient.subscriptionCredits + updatedClient.topUpCredits;

    await prisma.creditTransaction.create({
      data: {
        clientId,
        amount,
        type,
        description: `${description} ${isSubscriptionCredit ? '(abonnement)' : '(top-up)'}`,
        balanceAfter: newBalance
      }
    });

    return { success: true, newBalance };
  } catch (error) {
    console.error('Error adding credits:', error);
    return { success: false, newBalance: 0 };
  }
}

/**
 * Get client credit info (beide types apart)
 */
export async function getClientCredits(clientId: string) {
  return await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      subscriptionCredits: true,
      topUpCredits: true,
      isUnlimited: true,
      totalCreditsUsed: true,
      totalCreditsPurchased: true
    }
  });
}

/**
 * Get credit transaction history
 */
export async function getCreditHistory(
  clientId: string, 
  limit: number = 50
) {
  return await prisma.creditTransaction.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

/**
 * Calculate cost based on model used
 */
export function calculateCreditCost(
  action: string,
  model?: string,
  tokensUsed?: number
): number {
  // Als we exact tokens weten, bereken op basis van model
  if (tokensUsed && model) {
    // Simplified cost calculation
    // Gemini is goedkoper, GPT-4 is duurder
    let costPerToken = 0.000001; // Default (gemini, llama, etc)
    if (model.includes('gpt-4')) costPerToken = 0.00001; // GPT-4 10x duurder
    if (model.includes('claude-opus')) costPerToken = 0.000015; // Opus nog duurder
    return Math.max(0.01, tokensUsed * costPerToken);
  }

  // Fallback naar actie-based pricing met model check
  switch (action) {
    case 'chat':
      // 🧠 Slimme Computing Pricing:
      // - Gemini Flash: BASIC (1 credit) - goedkoop en snel
      // - GPT-4o, Claude: ADVANCED (5 credits) - krachtig maar duurder
      if (model?.includes('gemini-1.5-flash')) {
        return CREDIT_COSTS.CHAT_MESSAGE_BASIC;
      }
      if (model?.includes('claude-opus') || model?.includes('gpt-4o') || model?.includes('gpt-4-turbo')) {
        return CREDIT_COSTS.CHAT_MESSAGE_ADVANCED;
      }
      return CREDIT_COSTS.CHAT_MESSAGE_BASIC; // Default goedkoop
    
    case 'image':
      // 💰 Optimized image pricing
      if (model?.includes('gpt-image') || model?.includes('dall-e-3')) {
        return CREDIT_COSTS.IMAGE_PREMIUM; // 18 credits ($0.18)
      }
      if (model?.includes('flux-pro')) {
        return CREDIT_COSTS.IMAGE_STANDARD; // 5 credits ($0.05)
      }
      if (model?.includes('stable-diffusion') || model?.includes('sd-')) {
        return CREDIT_COSTS.IMAGE_BUDGET; // 4 credits ($0.037) - Default en goedkoopste!
      }
      // Default naar budget option (Stable Diffusion)
      return CREDIT_COSTS.IMAGE_BUDGET;
    
    case 'video':
      return CREDIT_COSTS.VIDEO_SHORT;
    
    case 'search':
      return CREDIT_COSTS.WEB_SEARCH;
    
    case 'blog':
      return CREDIT_COSTS.BLOG_POST;
    
    case 'social':
      return CREDIT_COSTS.SOCIAL_POST;
    
    default:
      return CREDIT_COSTS.CHAT_MESSAGE_BASIC;
  }
}
