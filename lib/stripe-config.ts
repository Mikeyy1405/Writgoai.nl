/**
 * Stripe Configuration for Credit-Based Pricing System
 * 
 * This file defines the three subscription packages available:
 * - Starter: €49/month - 100 credits
 * - Pro: €79/month - 250 credits  
 * - Enterprise: €199/month - 1000 credits
 */

export const STRIPE_PACKAGES = {
  starter: {
    product_id: 'prod_TWavMxIzCetTGr',
    price_id: 'price_1ShHhdFIOSLx4Sb72B9SvWgF',
    price_eur: 49,
    credits: 100,
    name: 'Starter',
    description: 'Perfect voor kleine projecten',
  },
  pro: {
    product_id: 'prod_TWavIkuyNlIsXj',
    price_id: 'price_1SZXjlFIOSLx4Sb7TzzqKcyH',
    price_eur: 79,
    credits: 250,
    name: 'Pro',
    description: 'Ideaal voor groeiende bedrijven',
    popular: true,
  },
  enterprise: {
    product_id: 'prod_TWaw3ohDFnxM8b',
    price_id: 'price_1SZXkCFIOSLx4Sb7UYgvmuRq',
    price_eur: 199,
    credits: 1000,
    name: 'Enterprise',
    description: 'Voor grote content volumes',
  },
} as const;

export type PackageTier = keyof typeof STRIPE_PACKAGES;

/**
 * Get package details by tier
 */
export function getPackage(tier: PackageTier) {
  return STRIPE_PACKAGES[tier];
}

/**
 * Get package tier by price ID
 */
export function getPackageTierByPriceId(priceId: string): PackageTier | null {
  for (const [tier, config] of Object.entries(STRIPE_PACKAGES)) {
    if (config.price_id === priceId) {
      return tier as PackageTier;
    }
  }
  return null;
}

/**
 * Calculate price per credit for a package
 */
export function getPricePerCredit(tier: PackageTier): number {
  const pkg = STRIPE_PACKAGES[tier];
  return pkg.price_eur / pkg.credits;
}
