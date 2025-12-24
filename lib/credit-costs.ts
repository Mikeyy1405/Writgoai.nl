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

  // IMAGE STUDIO - AIML Image Models
  // Pricing tiers based on model quality and API costs

  // Budget Tier (1 credit) - ~€0.02-0.04 API cost
  'image_dalle2': 1,
  'image_flux_schnell': 1,
  'image_sd3_medium': 1,
  'image_reve_create': 1,

  // Standard Tier (2 credits) - ~€0.04-0.06 API cost
  'image_dalle3': 2,
  'image_flux_dev': 2,
  'image_imagen3': 2,
  'image_recraft_v3': 2,
  'image_qwen': 2,
  'image_z_turbo': 2,
  'image_seedream3': 2,
  'image_seedream4': 2,
  'image_hunyuan3': 2,
  'image_gemini_flash': 2,

  // Premium Tier (3 credits) - ~€0.06-0.08 API cost
  'image_flux_pro': 3,
  'image_flux_pro_v11': 3,
  'image_flux_realism': 3,
  'image_flux_kontext_pro': 3,
  'image_flux_srpo': 3,
  'image_flux2': 3,
  'image_flux2_pro': 3,
  'image_imagen4': 3,
  'image_imagen4_fast': 3,
  'image_seedream45': 3,
  'image_sd35_large': 3,
  'image_gpt_image1': 3,
  'image_gemini3_pro': 3,

  // Ultra Tier (4 credits) - ~€0.08-0.12 API cost
  'image_flux_pro_ultra': 4,
  'image_flux_kontext_max': 4,
  'image_flux2_lora': 4,
  'image_imagen4_ultra': 4,
  'image_kling_o1': 4,
  'image_gpt_image15': 4,
  'image_grok2': 4,

  // Edit Models (2-3 credits) - Image-to-image and editing
  'image_qwen_edit': 2,
  'image_flux_dev_i2i': 2,
  'image_flux_srpo_i2i': 2,
  'image_reve_edit': 2,
  'image_seededit3_i2i': 2,
  'image_gemini_flash_edit': 2,
  'image_flux_kontext_pro_i2i': 3,
  'image_flux_kontext_max_i2i': 3,
  'image_flux2_edit': 3,
  'image_flux2_lora_edit': 3,
  'image_flux2_pro_edit': 3,
  'image_seedream4_edit': 3,
  'image_reve_remix': 3,
  'image_gemini3_edit': 3,

  // LoRA Models (2-3 credits) - Specialized fine-tuned models
  'image_z_turbo_lora': 2,
  'image_uso': 2,

  // Enhancement Models (2 credits) - Upscaling and sharpening
  'image_topaz_sharpen': 2,
  'image_topaz_sharpen_gen': 2,

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

  // IMAGE STUDIO - Estimated API costs
  // Budget Tier
  image_dalle2: 0.020,
  image_flux_schnell: 0.025,
  image_sd3_medium: 0.030,
  image_reve_create: 0.025,

  // Standard Tier
  image_dalle3: 0.040,
  image_flux_dev: 0.045,
  image_imagen3: 0.050,
  image_recraft_v3: 0.045,
  image_qwen: 0.040,
  image_z_turbo: 0.040,
  image_seedream3: 0.045,
  image_seedream4: 0.050,
  image_hunyuan3: 0.045,
  image_gemini_flash: 0.040,

  // Premium Tier
  image_flux_pro: 0.060,
  image_flux_pro_v11: 0.065,
  image_flux_realism: 0.065,
  image_flux_kontext_pro: 0.070,
  image_flux_srpo: 0.065,
  image_flux2: 0.070,
  image_flux2_pro: 0.075,
  image_imagen4: 0.070,
  image_imagen4_fast: 0.065,
  image_seedream45: 0.070,
  image_sd35_large: 0.065,
  image_gpt_image1: 0.070,
  image_gemini3_pro: 0.075,

  // Ultra Tier
  image_flux_pro_ultra: 0.090,
  image_flux_kontext_max: 0.095,
  image_flux2_lora: 0.090,
  image_imagen4_ultra: 0.100,
  image_kling_o1: 0.095,
  image_gpt_image15: 0.090,
  image_grok2: 0.095,

  // Edit Models
  image_qwen_edit: 0.045,
  image_flux_dev_i2i: 0.050,
  image_flux_srpo_i2i: 0.050,
  image_reve_edit: 0.045,
  image_seededit3_i2i: 0.050,
  image_gemini_flash_edit: 0.045,
  image_flux_kontext_pro_i2i: 0.070,
  image_flux_kontext_max_i2i: 0.075,
  image_flux2_edit: 0.075,
  image_flux2_lora_edit: 0.080,
  image_flux2_pro_edit: 0.080,
  image_seedream4_edit: 0.070,
  image_reve_remix: 0.070,
  image_gemini3_edit: 0.075,

  // LoRA Models
  image_z_turbo_lora: 0.045,
  image_uso: 0.045,

  // Enhancement Models
  image_topaz_sharpen: 0.050,
  image_topaz_sharpen_gen: 0.050,

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
