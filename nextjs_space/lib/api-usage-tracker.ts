
/**
 * API Usage Tracker
 * 
 * Tracks AI API usage, calculates costs, and logs to database
 */

import { prisma } from '@/lib/db';

// AIML API Pricing (per 1M tokens, in USD)
// Prices updated as of November 2025
export const MODEL_PRICING = {
  // Claude models
  'claude-sonnet-4-5': {
    input: 3.00,    // $3 per 1M input tokens
    output: 15.00,  // $15 per 1M output tokens
  },
  'claude-sonnet-3-7': {
    input: 3.00,
    output: 15.00,
  },
  'claude-3-5-sonnet-20240620': {
    input: 3.00,
    output: 15.00,
  },
  
  // GPT models
  'gpt-4o': {
    input: 2.50,
    output: 10.00,
  },
  'gpt-4o-mini': {
    input: 0.15,
    output: 0.60,
  },
  'gpt-4o-search-preview': {
    input: 2.50,
    output: 10.00,
  },
  'gpt-4-turbo': {
    input: 10.00,
    output: 30.00,
  },
  'gpt-3.5-turbo': {
    input: 0.50,
    output: 1.50,
  },
  
  // Gemini models
  'gemini-2.5-flash': {
    input: 0.075,  // $0.075 per 1M input tokens
    output: 0.30,  // $0.30 per 1M output tokens
  },
  'gemini-2.0-flash-exp': {
    input: 0.00,   // Free
    output: 0.00,
  },
  'gemini-1.5-pro': {
    input: 1.25,
    output: 5.00,
  },
  'gemini-1.5-flash': {
    input: 0.075,
    output: 0.30,
  },
  
  // Meta/Llama models
  'llama-3.3-70b': {
    input: 0.35,
    output: 0.40,
  },
  'llama-3.1-405b': {
    input: 2.70,
    output: 2.70,
  },
  
  // Mistral models
  'mistral-large': {
    input: 2.00,
    output: 6.00,
  },
  'mistral-medium': {
    input: 0.60,
    output: 1.80,
  },
  
  // Default fallback
  'default': {
    input: 1.00,
    output: 3.00,
  },
};

export interface UsageData {
  clientId?: string;
  projectId?: string;
  feature: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  success: boolean;
  errorMessage?: string;
  responseTime?: number;
  contentId?: string;
}

/**
 * Calculate cost based on token usage and model
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): {
  inputCost: number;
  outputCost: number;
  totalCost: number;
} {
  // Get pricing for model (fallback to default if not found)
  const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING] || MODEL_PRICING.default;
  
  // Calculate cost in USD cents (for precision)
  // Formula: (tokens / 1,000,000) * price_per_million * 100 (to convert to cents)
  const inputCost = (inputTokens / 1_000_000) * pricing.input * 100;
  const outputCost = (outputTokens / 1_000_000) * pricing.output * 100;
  const totalCost = inputCost + outputCost;
  
  return {
    inputCost: Math.round(inputCost * 100) / 100,  // Round to 2 decimals
    outputCost: Math.round(outputCost * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
  };
}

/**
 * Track API usage and log to database
 */
export async function trackApiUsage(data: UsageData): Promise<void> {
  try {
    const totalTokens = data.inputTokens + data.outputTokens;
    const costs = calculateCost(data.model, data.inputTokens, data.outputTokens);
    
    await prisma.apiUsage.create({
      data: {
        clientId: data.clientId,
        projectId: data.projectId,
        feature: data.feature,
        model: data.model,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        totalTokens,
        inputCost: costs.inputCost,
        outputCost: costs.outputCost,
        totalCost: costs.totalCost,
        success: data.success,
        errorMessage: data.errorMessage,
        responseTime: data.responseTime,
        contentId: data.contentId,
      },
    });
    
    console.log(`✅ [Usage Tracked] ${data.feature} - ${data.model} - ${totalTokens} tokens - $${(costs.totalCost / 100).toFixed(4)}`);
  } catch (error) {
    console.error('❌ Error tracking API usage:', error);
    // Don't throw - we don't want tracking errors to break the main flow
  }
}

/**
 * Get usage statistics for a client
 */
export async function getClientUsageStats(
  clientId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = {
    clientId,
  };
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }
  
  const [totalUsage, usageByFeature, usageByModel, recentUsage] = await Promise.all([
    // Total stats
    prisma.apiUsage.aggregate({
      where,
      _sum: {
        totalTokens: true,
        totalCost: true,
      },
      _count: true,
    }),
    
    // Usage by feature
    prisma.apiUsage.groupBy({
      by: ['feature'],
      where,
      _sum: {
        totalTokens: true,
        totalCost: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          totalCost: 'desc',
        },
      },
    }),
    
    // Usage by model
    prisma.apiUsage.groupBy({
      by: ['model'],
      where,
      _sum: {
        totalTokens: true,
        totalCost: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          totalCost: 'desc',
        },
      },
    }),
    
    // Recent usage (last 30 days) - fetch records and group in JS
    prisma.apiUsage.findMany({
      where: {
        clientId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
      },
      select: {
        createdAt: true,
        totalTokens: true,
        totalCost: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);
  
  // Group daily usage by date
  const dailyUsageMap = new Map<string, { requests: number; tokens: number; cost: number }>();
  
  recentUsage.forEach(record => {
    const dateKey = record.createdAt.toISOString().split('T')[0]; // Get YYYY-MM-DD
    const existing = dailyUsageMap.get(dateKey) || { requests: 0, tokens: 0, cost: 0 };
    
    dailyUsageMap.set(dateKey, {
      requests: existing.requests + 1,
      tokens: existing.tokens + (record.totalTokens || 0),
      cost: existing.cost + (record.totalCost || 0),
    });
  });

  // Convert map to array and sort by date
  const dailyUsageArray = Array.from(dailyUsageMap.entries())
    .map(([date, data]) => ({
      date,
      requests: data.requests,
      tokens: data.tokens,
      cost: data.cost,
    }))
    .sort((a, b) => b.date.localeCompare(a.date)); // Sort descending
  
  return {
    total: {
      requests: totalUsage._count,
      tokens: totalUsage._sum.totalTokens || 0,
      cost: totalUsage._sum.totalCost || 0,
      costUSD: ((totalUsage._sum.totalCost || 0) / 100).toFixed(2),
    },
    byFeature: usageByFeature.map(f => ({
      feature: f.feature,
      requests: f._count,
      tokens: f._sum.totalTokens || 0,
      cost: f._sum.totalCost || 0,
      costUSD: ((f._sum.totalCost || 0) / 100).toFixed(2),
    })),
    byModel: usageByModel.map(m => ({
      model: m.model,
      requests: m._count,
      tokens: m._sum.totalTokens || 0,
      cost: m._sum.totalCost || 0,
      costUSD: ((m._sum.totalCost || 0) / 100).toFixed(2),
    })),
    recent: dailyUsageArray,
  };
}

/**
 * Get average cost per article type
 */
export async function getAverageCostPerArticle(clientId?: string) {
  const where: any = {
    feature: {
      in: ['blog_generator', 'autopilot', 'deep_research_writer'],
    },
    success: true,
  };
  
  if (clientId) {
    where.clientId = clientId;
  }
  
  const stats = await prisma.apiUsage.groupBy({
    by: ['feature'],
    where,
    _avg: {
      totalCost: true,
      totalTokens: true,
    },
    _count: true,
  });
  
  return stats.map(s => ({
    feature: s.feature,
    avgCost: s._avg.totalCost || 0,
    avgCostUSD: ((s._avg.totalCost || 0) / 100).toFixed(4),
    avgTokens: Math.round(s._avg.totalTokens || 0),
    totalArticles: s._count,
  }));
}
