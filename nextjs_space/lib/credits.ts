/**
 * Credit System - Nu alleen Usage Tracking (Pay-as-you-go model)
 * 
 * BELANGRIJK: Credits worden NIET meer afgetrokken of geblokkeerd.
 * Dit systeem logt alleen gebruik voor facturering doeleinden.
 */

import { PrismaClient } from '@prisma/client';
import { trackUsage } from './usage-tracking';

const prisma = new PrismaClient();

// 💰 Credit costs - nu alleen voor referentie/pricing
export const CREDIT_COSTS = {
  // ✍️ Content Generation
  BLOG_POST: 70,
  KEYWORD_RESEARCH: 40,
  LINKBUILDING: 50,
  NEWS_ARTICLE: 60,
  
  // 📱 Social Media
  SOCIAL_MEDIA_IDEAS: 10,
  SOCIAL_POST: 20,
  
  // 🎬 Video
  VIDEO_SHORT: 120,
  VIDEO_MEDIUM: 150,
  
  // 🔍 Research & Analysis
  WEB_SEARCH: 15,
  
  // 💬 Chat Messages
  CHAT_MESSAGE_BASIC: 1,
  CHAT_MESSAGE_ADVANCED: 5,
  CHAT_MESSAGE_PREMIUM: 20,
  
  // 🎨 Images
  IMAGE_FREE: 0,
  IMAGE_ULTRA_BUDGET: 2,
  IMAGE_BUDGET_PRO: 3,
  IMAGE_BUDGET: 4,
  IMAGE_STANDARD: 5,
  IMAGE_PREMIUM: 18,
  
  // 💻 Code
  CODE_GENERATION: 30,
};

/**
 * Check of client genoeg credits heeft - ALTIJD TRUE (geen blokkades meer)
 */
export async function hasEnoughCredits(
  clientId: string, 
  requiredCredits: number
): Promise<boolean> {
  // Pay-as-you-go: altijd toegang, factureren achteraf
  return true;
}

/**
 * Deduct credits - Nu alleen logging (geen aftrek)
 * Wordt bewaard voor backwards compatibility maar doet niets meer
 */
export async function deductCredits(
  clientId: string,
  amount: number,
  description: string,
  metadata?: {
    model?: string;
    tokensUsed?: number;
    messageId?: string;
    tool?: string;
  }
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    // Track usage voor facturering (non-blocking)
    const toolName = metadata?.tool || extractToolFromDescription(description);
    
    trackUsage({
      clientId,
      tool: toolName,
      action: description,
      details: {
        model: metadata?.model,
        originalCredits: amount,
      },
      tokenCount: metadata?.tokensUsed,
    }).catch(err => {
      console.error('Usage tracking error (non-blocking):', err);
    });

    // Log voor analytics (maar trek niets af)
    console.log(`📊 [Usage] ${description} for client ${clientId} (was: ${amount} credits)`);

    return { success: true, newBalance: 999999 };
  } catch (error: any) {
    console.error('Error in deductCredits:', error);
    // NOOIT blokkeren - return success
    return { success: true, newBalance: 999999 };
  }
}

/**
 * Extract tool name from description
 */
function extractToolFromDescription(description: string): string {
  const lowerDesc = description.toLowerCase();
  if (lowerDesc.includes('blog')) return 'blog_generator';
  if (lowerDesc.includes('image') || lowerDesc.includes('afbeelding')) return 'image_generator';
  if (lowerDesc.includes('video')) return 'video_generator';
  if (lowerDesc.includes('chat')) return 'chat';
  if (lowerDesc.includes('keyword') || lowerDesc.includes('zoekwoord')) return 'keyword_research';
  if (lowerDesc.includes('content')) return 'content_generator';
  if (lowerDesc.includes('site') || lowerDesc.includes('plan')) return 'site_planner';
  return 'other';
}

/**
 * Add credits to client - Behouden voor admin functionaliteit
 */
export async function addCredits(
  clientId: string,
  amount: number,
  type: 'purchase' | 'refund' | 'bonus' | 'subscription',
  description: string
): Promise<{ success: boolean; newBalance: number }> {
  try {
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
 * Get client credit info
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
 * Calculate cost based on model used - voor referentie
 */
export function calculateCreditCost(
  action: string,
  model?: string,
  tokensUsed?: number
): number {
  if (tokensUsed && model) {
    let costPerToken = 0.000001;
    if (model.includes('gpt-4')) costPerToken = 0.00001;
    if (model.includes('claude-opus')) costPerToken = 0.000015;
    return Math.max(0.01, tokensUsed * costPerToken);
  }

  switch (action) {
    case 'chat':
      if (model?.includes('gemini-1.5-flash')) {
        return CREDIT_COSTS.CHAT_MESSAGE_BASIC;
      }
      if (model?.includes('claude-opus') || model?.includes('gpt-4o')) {
        return CREDIT_COSTS.CHAT_MESSAGE_ADVANCED;
      }
      return CREDIT_COSTS.CHAT_MESSAGE_BASIC;
    
    case 'image':
      if (model?.includes('gpt-image') || model?.includes('dall-e-3')) {
        return CREDIT_COSTS.IMAGE_PREMIUM;
      }
      if (model?.includes('flux-pro')) {
        return CREDIT_COSTS.IMAGE_STANDARD;
      }
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
