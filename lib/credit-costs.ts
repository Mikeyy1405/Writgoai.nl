/**
 * Credit Costs Mapping
 * 
 * This file defines how many credits each action costs.
 * Based on AIML API costs for Claude 4.5 Sonnet, Perplexity Pro Sonar, and Flux Pro 1.1
 */

export const CREDIT_COSTS = {
  // Content Generation (Claude 4.5 Sonnet)
  // API costs: $3.00/1M input + $15.00/1M output tokens
  article_short: 1,        // 500-1000 words (~€0.031 API cost)
  article_medium: 2,       // 1500-2000 words (~€0.050 API cost)
  article_long: 3,         // 2500-3000 words (~€0.069 API cost)
  article_premium: 5,      // 3000+ words with research (~€0.129 API cost)
  
  // Image Generation (Flux Pro 1.1)
  // API cost: $0.055 per image (~€0.050)
  featured_image: 1,       // Standard image (~€0.055 API cost)
  article_with_image: 4,   // Medium article + image (~€0.105 API cost)
  
  // Research (Perplexity Pro Sonar)
  // API costs: $3.00/1M input + $15.00/1M output tokens
  keyword_research: 1,     // Single query (~€0.029 API cost)
  competitor_analysis: 2,  // Deep dive research (~€0.058 API cost)
  content_plan: 5,         // Full content plan with research (~€0.145 API cost)
  
  // SEO Tools (lightweight, minimal API cost)
  seo_analysis: 1,         // SEO analysis (~€0.005 API cost)
  internal_linking: 0,     // Free - no external API cost
  wp_publish: 0,           // Free - no external API cost
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

/**
 * Get the credit cost for an action
 */
export function getCreditCost(action: CreditAction): number {
  return CREDIT_COSTS[action];
}

/**
 * Check if an action is free (0 credits)
 */
export function isFreeAction(action: CreditAction): boolean {
  return CREDIT_COSTS[action] === 0;
}

/**
 * Get approximate API cost in EUR for an action
 * (for transparency and documentation purposes)
 */
export const API_COSTS_EUR: Record<CreditAction, number> = {
  article_short: 0.031,
  article_medium: 0.050,
  article_long: 0.069,
  article_premium: 0.129,
  featured_image: 0.055,
  article_with_image: 0.105,
  keyword_research: 0.029,
  competitor_analysis: 0.058,
  content_plan: 0.145,
  seo_analysis: 0.005,
  internal_linking: 0.0,
  wp_publish: 0.0,
};

/**
 * Calculate profit margin for a given number of credits used
 */
export function calculateProfitMargin(
  creditsUsed: number,
  subscriptionPrice: number,
  monthlyCredits: number
): {
  totalApiCost: number;
  revenue: number;
  profit: number;
  marginPercent: number;
} {
  // Estimate average API cost per credit (weighted average)
  const avgApiCostPerCredit = 0.062; // €0.062 based on typical usage patterns
  const totalApiCost = creditsUsed * avgApiCostPerCredit;
  const revenue = subscriptionPrice;
  const profit = revenue - totalApiCost;
  const marginPercent = (profit / revenue) * 100;
  
  return {
    totalApiCost,
    revenue,
    profit,
    marginPercent,
  };
}
