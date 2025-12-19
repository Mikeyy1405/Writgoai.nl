'use server';

/**
 * 🛠️ Utility Server Actions
 * 
 * Consolidates all utility functionality:
 * - Credits management
 * - Subscription management
 * - User settings
 * - Usage statistics
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { auth, getAuthenticatedClient } from '@/lib/auth';
import { addCredits as addCreditsLib, getClientCredits, getCreditHistory } from '@/lib/credits';
import { stripe } from '@/lib/stripe';

// ═════════════════════════════════════════════════════════════════════
// CREDITS MANAGEMENT
// ═════════════════════════════════════════════════════════════════════

/**
 * 💰 Get Credits
 * 
 * Get current credit balance for authenticated user
 */
export async function getCredits() {
  try {
    const client = await getAuthenticatedClient();

    const credits = await getClientCredits(client.id);

    if (!credits) {
      throw new Error('Kon credits niet ophalen');
    }

    return {
      success: true,
      credits: {
        subscription: credits.subscriptionCredits || 0,
        topUp: credits.topUpCredits || 0,
        total: (credits.subscriptionCredits || 0) + (credits.topUpCredits || 0),
        isUnlimited: credits.isUnlimited || false,
        totalUsed: credits.totalCreditsUsed || 0,
        totalPurchased: credits.totalCreditsPurchased || 0,
      },
    };
  } catch (error: any) {
    console.error('❌ Error fetching credits:', error);
    throw new Error('Fout bij ophalen van credits');
  }
}

/**
 * ➕ Add Credits (Admin only)
 * 
 * Add credits to a user account
 */
export async function addCredits(amount: number, reason: string) {
  try {
    const session = await auth();

    // Admin only
    if (session.user.role !== 'admin') {
      throw new Error('Alleen admins kunnen credits toevoegen');
    }

    const client = await getAuthenticatedClient();

    const result = await addCreditsLib(
      client.id,
      amount,
      'bonus',
      reason
    );

    if (!result.success) {
      throw new Error('Fout bij toevoegen van credits');
    }

    revalidatePath('/client-portal');

    return {
      success: true,
      newBalance: result.newBalance,
    };
  } catch (error: any) {
    console.error('❌ Error adding credits:', error);
    throw new Error(error.message || 'Fout bij toevoegen van credits');
  }
}

/**
 * 📊 Get Credit History
 * 
 * Get credit transaction history
 */
export async function getCreditTransactions(limit: number = 50) {
  try {
    const client = await getAuthenticatedClient();

    const transactions = await getCreditHistory(client.id, limit);

    return {
      success: true,
      transactions,
    };
  } catch (error: any) {
    console.error('❌ Error fetching credit history:', error);
    throw new Error('Fout bij ophalen van credit history');
  }
}

// ═════════════════════════════════════════════════════════════════════
// SUBSCRIPTION MANAGEMENT
// ═════════════════════════════════════════════════════════════════════

/**
 * 📋 Get Subscription
 * 
 * Get current subscription details
 */
export async function getSubscription() {
  try {
    const client = await getAuthenticatedClient();

    // Get subscription from database
    const subscription = await prisma.subscription.findFirst({
      where: {
        clientId: client.id,
        status: { in: ['active', 'trialing'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return {
        success: true,
        subscription: null,
      };
    }

    // Get plan details if available
    let plan = null;
    if (subscription.planId) {
      plan = await prisma.subscriptionPlan.findUnique({
        where: { id: subscription.planId },
      });
    }

    return {
      success: true,
      subscription: {
        ...subscription,
        plan,
      },
    };
  } catch (error: any) {
    console.error('❌ Error fetching subscription:', error);
    throw new Error('Fout bij ophalen van abonnement');
  }
}

/**
 * ❌ Cancel Subscription
 * 
 * Cancel current subscription
 */
export async function cancelSubscription() {
  try {
    const client = await getAuthenticatedClient();

    // Get active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        clientId: client.id,
        status: { in: ['active', 'trialing'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      throw new Error('Geen actief abonnement gevonden');
    }

    // Cancel in Stripe if available
    if (subscription.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
      try {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      } catch (stripeError) {
        console.error('Stripe cancellation error:', stripeError);
        // Continue with database update even if Stripe fails
      }
    }

    // Update database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });

    revalidatePath('/client-portal/subscription');

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('❌ Error cancelling subscription:', error);
    throw new Error(error.message || 'Fout bij opzeggen van abonnement');
  }
}

// ═════════════════════════════════════════════════════════════════════
// USAGE STATISTICS
// ═════════════════════════════════════════════════════════════════════

/**
 * 📊 Get Usage Stats
 * 
 * Get usage statistics for the authenticated user
 */
export async function getUsageStats(period: 'week' | 'month' | 'all' = 'month') {
  try {
    const client = await getAuthenticatedClient();

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate.setFullYear(2020, 0, 1); // All time
    }

    // Get API usage stats
    const apiUsage = await prisma.apiUsage.findMany({
      where: {
        clientId: client.id,
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Aggregate by feature
    const byFeature: Record<string, number> = {};
    let totalCalls = 0;
    let totalTokens = 0;

    apiUsage.forEach((usage) => {
      totalCalls++;
      totalTokens += usage.inputTokens + usage.outputTokens;

      const feature = usage.feature || 'other';
      byFeature[feature] = (byFeature[feature] || 0) + 1;
    });

    // Get content generation stats
    const contentStats = await prisma.savedContent.aggregate({
      where: {
        clientId: client.id,
        createdAt: { gte: startDate },
      },
      _count: true,
      _sum: { wordCount: true },
    });

    // Get AutoPilot stats
    const autopilotStats = await prisma.autoPilotJob.groupBy({
      by: ['status'],
      where: {
        clientId: client.id,
        startedAt: { gte: startDate },
      },
      _count: true,
    });

    return {
      success: true,
      stats: {
        period,
        apiUsage: {
          totalCalls,
          totalTokens,
          byFeature,
        },
        content: {
          totalGenerated: contentStats._count || 0,
          totalWords: contentStats._sum.wordCount || 0,
        },
        autopilot: autopilotStats.reduce(
          (acc, stat) => {
            acc[stat.status] = stat._count;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
    };
  } catch (error: any) {
    console.error('❌ Error fetching usage stats:', error);
    throw new Error('Fout bij ophalen van gebruiksstatistieken');
  }
}

// ═════════════════════════════════════════════════════════════════════
// USER SETTINGS
// ═════════════════════════════════════════════════════════════════════

/**
 * 👤 Get User Settings
 * 
 * Get user profile and settings
 */
export async function getUserSettings() {
  try {
    const client = await getAuthenticatedClient();

    return {
      success: true,
      settings: {
        name: client.name,
        email: client.email,
        companyName: client.companyName,
        targetAudience: client.targetAudience,
        brandVoice: client.brandVoice,
        keywords: client.keywords,
        websiteUrl: client.websiteUrl,
        language: client.language || 'nl',
        timezone: client.timezone || 'Europe/Amsterdam',
      },
    };
  } catch (error: any) {
    console.error('❌ Error fetching user settings:', error);
    throw new Error('Fout bij ophalen van gebruikersinstellingen');
  }
}

/**
 * ✏️ Update User Settings
 * 
 * Update user profile and settings
 */
export async function updateUserSettings(settings: {
  name?: string;
  companyName?: string;
  targetAudience?: string;
  brandVoice?: string;
  keywords?: string[];
  websiteUrl?: string;
  language?: string;
  timezone?: string;
}) {
  try {
    const client = await getAuthenticatedClient();

    const updated = await prisma.client.update({
      where: { id: client.id },
      data: settings,
    });

    revalidatePath('/client-portal/settings');

    return {
      success: true,
      settings: {
        name: updated.name,
        email: updated.email,
        companyName: updated.companyName,
        targetAudience: updated.targetAudience,
        brandVoice: updated.brandVoice,
        keywords: updated.keywords,
        websiteUrl: updated.websiteUrl,
        language: updated.language,
        timezone: updated.timezone,
      },
    };
  } catch (error: any) {
    console.error('❌ Error updating user settings:', error);
    throw new Error('Fout bij updaten van gebruikersinstellingen');
  }
}

/**
 * 🔐 Update WordPress Credentials
 * 
 * Update WordPress connection settings
 */
export async function updateWordPressCredentials(
  projectId: string | null,
  credentials: {
    wordpressUrl: string;
    wordpressUsername: string;
    wordpressPassword: string;
  }
) {
  try {
    const client = await getAuthenticatedClient();

    if (projectId) {
      // Update project-specific credentials
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          clientId: client.id,
        },
      });

      if (!project) {
        throw new Error('Project niet gevonden');
      }

      await prisma.project.update({
        where: { id: projectId },
        data: credentials,
      });

      revalidatePath(`/client-portal/projects/${projectId}`);
    } else {
      // Update client-level credentials
      await prisma.client.update({
        where: { id: client.id },
        data: credentials,
      });

      revalidatePath('/client-portal/settings');
    }

    return { success: true };
  } catch (error: any) {
    console.error('❌ Error updating WordPress credentials:', error);
    throw new Error('Fout bij updaten van WordPress credentials');
  }
}

/**
 * 🧪 Test WordPress Connection
 * 
 * Test WordPress API connection
 */
export async function testWordPressConnection(
  projectId: string | null
): Promise<{ success: boolean; message: string }> {
  try {
    const client = await getAuthenticatedClient();

    let wordpressUrl, wordpressUsername, wordpressPassword;

    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          clientId: client.id,
        },
      });

      if (!project) {
        throw new Error('Project niet gevonden');
      }

      wordpressUrl = project.wordpressUrl;
      wordpressUsername = project.wordpressUsername;
      wordpressPassword = project.wordpressPassword;
    } else {
      wordpressUrl = client.wordpressUrl;
      wordpressUsername = client.wordpressUsername;
      wordpressPassword = client.wordpressPassword;
    }

    if (!wordpressUrl || !wordpressUsername || !wordpressPassword) {
      throw new Error('WordPress credentials niet compleet');
    }

    // Test connection
    const response = await fetch(`${wordpressUrl}/wp-json/wp/v2/users/me`, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${wordpressUsername}:${wordpressPassword}`
        ).toString('base64')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.statusText}`);
    }

    const user = await response.json();

    return {
      success: true,
      message: `Verbinding succesvol! Ingelogd als: ${user.name}`,
    };
  } catch (error: any) {
    console.error('❌ WordPress connection test failed:', error);
    return {
      success: false,
      message: error.message || 'WordPress verbinding mislukt',
    };
  }
}
