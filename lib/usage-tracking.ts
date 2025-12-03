/**
 * Usage Tracking - Pay-as-you-go model
 * 
 * Dit systeem logt alle tool gebruik zonder te blokkeren.
 * Admins kunnen later facturen genereren op basis van gebruik.
 */

import { prisma } from './db';

// Tool prijzen (suggestie voor facturering)
export const TOOL_PRICES = {
  // Content Generation
  blog_generator: {
    base: 15.00,      // €15 per blog
    perWord: 0.005,   // €0.005 per woord extra boven 1000 woorden
    perImage: 2.50,   // €2.50 per gegenereerde afbeelding
  },
  content_generator: {
    base: 10.00,      // €10 per content item
    perWord: 0.004,   // €0.004 per woord extra
    perImage: 2.50,
  },
  site_planner: {
    base: 25.00,      // €25 per site plan
    perItem: 0.50,    // €0.50 per content item in plan
  },
  
  // Research Tools
  keyword_research: {
    base: 5.00,       // €5 per keyword research
    perKeyword: 0.10, // €0.10 per extra keyword
  },
  
  // Image Generation
  image_generator: {
    perImage: 2.50,   // €2.50 per gegenereerde afbeelding
  },
  
  // Video
  video_generator: {
    perMinute: 15.00, // €15 per minuut video
  },
};

export interface UsageData {
  clientId: string;
  projectId?: string;
  tool: string;
  action: string;
  details?: {
    title?: string;
    keyword?: string;
    model?: string;
    language?: string;
    [key: string]: unknown;
  };
  tokenCount?: number;
  imageCount?: number;
  wordCount?: number;
}

/**
 * Log tool gebruik (nooit blokkeren!)
 */
export async function trackUsage(data: UsageData): Promise<string | null> {
  try {
    // Bereken suggestie prijs
    const suggestedPrice = calculateSuggestedPrice(data);
    
    const usage = await prisma.toolUsage.create({
      data: {
        clientId: data.clientId,
        projectId: data.projectId,
        tool: data.tool,
        action: data.action,
        details: data.details as any,
        tokenCount: data.tokenCount,
        imageCount: data.imageCount,
        wordCount: data.wordCount,
        suggestedPrice,
        invoiced: false,
      },
    });
    
    console.log(`📊 Usage tracked: ${data.tool} - ${data.action} for client ${data.clientId}`);
    return usage.id;
  } catch (error) {
    // NOOIT blokkeren - log alleen de error
    console.error('Failed to track usage (non-blocking):', error);
    return null;
  }
}

/**
 * Bereken suggestie prijs op basis van gebruik
 */
function calculateSuggestedPrice(data: UsageData): number {
  let price = 0;
  
  switch (data.tool) {
    case 'blog_generator': {
      const p = TOOL_PRICES.blog_generator;
      price = p.base;
      if (data.wordCount && data.wordCount > 1000) {
        price += (data.wordCount - 1000) * p.perWord;
      }
      if (data.imageCount) {
        price += data.imageCount * p.perImage;
      }
      break;
    }
    
    case 'content_generator': {
      const p = TOOL_PRICES.content_generator;
      price = p.base;
      if (data.wordCount && data.wordCount > 1000) {
        price += (data.wordCount - 1000) * p.perWord;
      }
      if (data.imageCount) {
        price += data.imageCount * p.perImage;
      }
      break;
    }
      
    case 'site_planner': {
      const p = TOOL_PRICES.site_planner;
      price = p.base;
      const itemCount = (data.details as any)?.itemCount || 0;
      price += itemCount * p.perItem;
      break;
    }
      
    case 'keyword_research': {
      const p = TOOL_PRICES.keyword_research;
      price = p.base;
      const keywordCount = (data.details as any)?.keywordCount || 0;
      if (keywordCount > 10) {
        price += (keywordCount - 10) * p.perKeyword;
      }
      break;
    }
      
    case 'image_generator': {
      const p = TOOL_PRICES.image_generator;
      price = (data.imageCount || 1) * p.perImage;
      break;
    }
      
    case 'video_generator': {
      const p = TOOL_PRICES.video_generator;
      const minutes = (data.details as any)?.durationMinutes || 1;
      price = minutes * p.perMinute;
      break;
    }
      
    default:
      price = 5; // Default €5 voor onbekende tools
  }
  
  return Math.round(price * 100) / 100; // Round to 2 decimals
}

/**
 * Haal onbefactureerd gebruik op voor een client
 */
export async function getUnbilledUsage(clientId: string) {
  return prisma.toolUsage.findMany({
    where: {
      clientId,
      invoiced: false,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      project: {
        select: { name: true },
      },
    },
  });
}

/**
 * Haal alle gebruik op voor een client (met filters)
 */
export async function getClientUsage(
  clientId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
    tool?: string;
    invoiced?: boolean;
    limit?: number;
  }
) {
  return prisma.toolUsage.findMany({
    where: {
      clientId,
      ...(options?.startDate && {
        createdAt: { gte: options.startDate },
      }),
      ...(options?.endDate && {
        createdAt: { lte: options.endDate },
      }),
      ...(options?.tool && { tool: options.tool }),
      ...(typeof options?.invoiced === 'boolean' && { invoiced: options.invoiced }),
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 100,
    include: {
      project: {
        select: { name: true },
      },
    },
  });
}

/**
 * Markeer gebruik als gefactureerd
 */
export async function markUsageAsInvoiced(usageIds: string[], invoiceItemId?: string) {
  return prisma.toolUsage.updateMany({
    where: {
      id: { in: usageIds },
    },
    data: {
      invoiced: true,
      invoiceItemId,
    },
  });
}

/**
 * Krijg usage statistieken voor een client
 */
export async function getUsageStats(clientId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const usage = await prisma.toolUsage.findMany({
    where: {
      clientId,
      createdAt: { gte: startDate },
    },
  });
  
  // Group by tool
  const byTool: Record<string, { count: number; totalPrice: number }> = {};
  let totalPrice = 0;
  let totalItems = 0;
  
  for (const item of usage) {
    if (!byTool[item.tool]) {
      byTool[item.tool] = { count: 0, totalPrice: 0 };
    }
    byTool[item.tool].count++;
    byTool[item.tool].totalPrice += item.suggestedPrice;
    totalPrice += item.suggestedPrice;
    totalItems++;
  }
  
  return {
    totalItems,
    totalPrice: Math.round(totalPrice * 100) / 100,
    byTool,
    unbilledCount: usage.filter(u => !u.invoiced).length,
    unbilledPrice: Math.round(
      usage.filter(u => !u.invoiced).reduce((sum, u) => sum + u.suggestedPrice, 0) * 100
    ) / 100,
  };
}

/**
 * Krijg tool labels in Nederlands
 */
export function getToolLabel(tool: string): string {
  const labels: Record<string, string> = {
    blog_generator: 'Blog Generator',
    content_generator: 'Content Generator',
    site_planner: 'Site Planner',
    keyword_research: 'Zoekwoord Onderzoek',
    image_generator: 'Afbeelding Generator',
    video_generator: 'Video Generator',
  };
  return labels[tool] || tool;
}
