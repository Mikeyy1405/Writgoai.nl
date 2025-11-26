
/**
 * Affiliate Display Components
 * 
 * Verschillende manieren om affiliate producten te tonen in blog content
 * Geïnspireerd door ContentEgg & Affiliate Held
 */

export { default as AffiliateTextLink } from './affiliate-text-link';
export { default as AffiliateProductCard } from './affiliate-product-card';
export { default as AffiliateProductGrid } from './affiliate-product-grid';
export { default as AffiliateProductCarousel } from './affiliate-product-carousel';
export { default as AffiliateCTABox } from './affiliate-cta-box';
export { default as AffiliateComparisonTable } from './affiliate-comparison-table';

export type { ProductCardData } from './affiliate-product-card';
export type { ComparisonProduct } from './affiliate-comparison-table';

// Display type enum
export const AFFILIATE_DISPLAY_TYPES = {
  TEXT_LINK: 'text_link',
  PRODUCT_CARD: 'product_card',
  PRODUCT_GRID: 'product_grid',
  CAROUSEL: 'carousel',
  CTA_BOX: 'cta_box',
  COMPARISON_TABLE: 'comparison_table',
} as const;

export type AffiliateDisplayType = typeof AFFILIATE_DISPLAY_TYPES[keyof typeof AFFILIATE_DISPLAY_TYPES];
