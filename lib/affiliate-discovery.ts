/**
 * Affiliate Discovery Library
 * Detects products and brands in content using AI
 */

import { generateJSONCompletion, BEST_MODELS } from './ai-client';

export interface ProductMention {
  product_name: string;
  brand_name: string;
  mentioned_at: string;
  context: string;
  confidence: number; // 0-1 score
}

export interface DetectedProducts {
  products: ProductMention[];
  total_mentions: number;
}

/**
 * Detect products and brands mentioned in content using AI
 */
export async function detectProducts(content: string): Promise<DetectedProducts> {
  try {
    const systemPrompt = `Je bent een expert in het detecteren van producten, merken en diensten in content.
Analyseer de tekst en identificeer alle relevante producten, merken, software, tools en diensten die genoemd worden.

Focus op:
- Specifieke productnamen (iPhone 15, Samsung Galaxy S24, etc.)
- Software en tools (WordPress, Ahrefs, Semrush, etc.)
- Merknamen (Apple, Google, Microsoft, etc.)
- Diensten (hosting providers, SaaS platforms, etc.)

Negeer:
- Algemene termen (computer, telefoon, etc.)
- Niet-commerciële items
- Auteursnamen en bedrijven die niet relevant zijn voor affiliate marketing`;

    const userPrompt = `Analyseer deze content en detecteer alle producten, merken en diensten die relevant zijn voor affiliate marketing:

${content.substring(0, 8000)}

Geef terug als JSON met deze structuur:
{
  "products": [
    {
      "product_name": "Specifieke productnaam",
      "brand_name": "Merk of bedrijf",
      "mentioned_at": "Waar in de tekst (bijv. 'Introductie', 'Hoofdstuk 2', 'Conclusie')",
      "context": "Korte context waarin het product wordt genoemd (max 200 karakters)",
      "confidence": 0.9
    }
  ],
  "total_mentions": 5
}`;

    const result = await generateJSONCompletion<DetectedProducts>({
      model: BEST_MODELS.CONTENT,
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxTokens: 2000,
    });

    return result;
  } catch (error) {
    console.error('Error detecting products:', error);
    return {
      products: [],
      total_mentions: 0,
    };
  }
}

/**
 * Extract context around a specific product mention in content
 */
export function extractContext(content: string, productName: string): string {
  try {
    const lowerContent = content.toLowerCase();
    const lowerProduct = productName.toLowerCase();
    const index = lowerContent.indexOf(lowerProduct);

    if (index === -1) {
      return 'Product niet gevonden in content';
    }

    // Extract 100 characters before and after the mention
    const start = Math.max(0, index - 100);
    const end = Math.min(content.length, index + productName.length + 100);
    let context = content.substring(start, end);

    // Add ellipsis if needed
    if (start > 0) context = '...' + context;
    if (end < content.length) context = context + '...';

    return context.trim();
  } catch (error) {
    console.error('Error extracting context:', error);
    return 'Kon context niet extraheren';
  }
}

/**
 * Score how relevant an affiliate opportunity is
 * Based on: product specificity, brand recognition, context quality
 */
export function scoreOpportunity(product: string, context: string): number {
  let score = 0.5; // Base score

  // Higher score for specific product names (includes numbers/versions)
  if (/\d/.test(product)) {
    score += 0.2;
  }

  // Higher score for well-known brands/categories
  const popularBrands = [
    'apple', 'samsung', 'google', 'microsoft', 'amazon',
    'wordpress', 'ahrefs', 'semrush', 'kinsta', 'yoast',
    'shopify', 'woocommerce', 'elementor', 'cloudflare'
  ];
  
  if (popularBrands.some(brand => product.toLowerCase().includes(brand))) {
    score += 0.2;
  }

  // Higher score for positive context (review, recommendation)
  const positiveWords = ['beste', 'top', 'aanraden', 'recommend', 'excellent', 'perfect'];
  if (positiveWords.some(word => context.toLowerCase().includes(word))) {
    score += 0.1;
  }

  // Cap at 1.0
  return Math.min(score, 1.0);
}

/**
 * Determine section/location in article based on content position
 */
export function determineLocation(content: string, productName: string): string {
  const lines = content.split('\n');
  let currentLine = 0;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(productName.toLowerCase())) {
      currentLine = i;
      break;
    }
  }

  const totalLines = lines.length;
  const position = currentLine / totalLines;

  if (position < 0.2) return 'Introductie';
  if (position < 0.4) return 'Begin artikel';
  if (position < 0.6) return 'Midden artikel';
  if (position < 0.8) return 'Eind artikel';
  return 'Conclusie';
}
