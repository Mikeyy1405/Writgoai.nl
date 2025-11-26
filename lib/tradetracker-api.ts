
/**
 * TradeTracker Affiliate API Integration
 * 
 * TradeTracker biedt SOAP webservices voor affiliate integratie:
 * - Product feeds voor duizenden adverteerders
 * - Campaign informatie en materialen
 * - Transactie tracking
 * - Custom affiliate link generatie
 * 
 * Documentatie: http://ws.tradetracker.com/soap/affiliate?wsdl
 * Handleiding: https://docs.affiliateheld.nl/api-koppelingen/koppelen-met-tradetracker/
 */

import { chatCompletion } from '@/lib/aiml-api';
import xml2js from 'xml2js';

// TradeTracker SOAP credentials
export interface TradeTrackerCredentials {
  siteId: string;          // TradeTracker Site/Affiliate ID voor tracking
  passphrase?: string;     // API passphrase/token (optioneel voor feed import)
  locale?: string;         // Locale (default: nl_NL)
  sandbox?: boolean;       // Gebruik sandbox environment
}

// Product data structure
export interface TradeTrackerProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image?: string;
  url: string;
  affiliateUrl: string;
  category?: string;
  brand?: string;
  ean?: string;
  campaignId: string;
  campaignName: string;
  deliveryTime?: string;
  stock?: boolean;
}

// Campaign data
export interface TradeTrackerCampaign {
  id: string;
  name: string;
  description?: string;
  commission?: string;
  url: string;
  category?: string;
  logo?: string;
}

// Search result
export interface TradeTrackerSearchResult {
  products: TradeTrackerProduct[];
  totalResults: number;
  page: number;
  totalPages: number;
}

/**
 * Generate TradeTracker affiliate link
 * Ondersteunt twee formaten:
 * 1. Click tracking: https://tc.tradetracker.net/?c=[CAMPAIGN_ID]&m=[SITE_ID]&u=[URL]
 * 2. Deep link: Als productUrl al TradeTracker parameters bevat, update dan site_id
 */
export function generateTradeTrackerAffiliateLink(
  campaignId: string,
  siteId: string,
  productUrl: string,
  materialId?: string
): string {
  try {
    // Check of de URL al TradeTracker tracking heeft (deep link)
    if (productUrl.includes('/endpoint/TradeTracker/') || productUrl.includes('tt=')) {
      // Deep link format - update site_id in bestaande URL
      const url = new URL(productUrl);
      const ttParam = url.searchParams.get('tt');
      
      if (ttParam) {
        // Format: {campaignID}_{materialID}_{siteID}_
        const parts = ttParam.split('_');
        if (parts.length >= 3) {
          parts[2] = siteId; // Update site ID
          url.searchParams.set('tt', parts.join('_'));
          return url.toString();
        }
      }
      
      // Als we de parameters niet kunnen updaten, gebruik dan de originele URL
      console.log('[TradeTracker] Deep link detected but could not update site_id:', productUrl);
      return productUrl;
    }
  } catch (error) {
    console.error('[TradeTracker] Error parsing deep link:', error);
  }
  
  // Standaard click tracking format
  const params = new URLSearchParams({
    c: campaignId,
    m: siteId,
    u: productUrl,
  });
  
  if (materialId) {
    params.append('a', materialId);
  }
  
  return `https://tc.tradetracker.net/?${params.toString()}`;
}

/**
 * Search products via TradeTracker feeds
 * Note: TradeTracker SOAP API is complex - deze functie simuleert feed zoeken
 */
export async function searchTradeTrackerProducts(
  query: string,
  credentials: TradeTrackerCredentials,
  options?: {
    maxResults?: number;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    campaignId?: string;
  }
): Promise<TradeTrackerSearchResult> {
  try {
    // Voor nu gebruiken we een REST-achtige benadering
    // In productie zou je de SOAP API gebruiken met xml2js
    const maxResults = Math.min(options?.maxResults || 10, 20);
    
    console.log(`[TradeTracker] Searching for: ${query}`, {
      maxResults,
      category: options?.category,
      campaignId: options?.campaignId,
    });

    // Placeholder: In productie zou je hier SOAP calls doen
    // Voor nu returnen we een empty result - de implementatie zou
    // xml2js gebruiken om SOAP requests te maken naar TradeTracker
    
    return {
      products: [],
      totalResults: 0,
      page: 1,
      totalPages: 0,
    };
  } catch (error) {
    console.error('[TradeTracker] Search error:', error);
    throw new Error(`TradeTracker search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get campaign information
 */
export async function getTradeTrackerCampaigns(
  credentials: TradeTrackerCredentials,
  options?: {
    category?: string;
    active?: boolean;
  }
): Promise<TradeTrackerCampaign[]> {
  try {
    console.log('[TradeTracker] Fetching campaigns', options);
    
    // Placeholder voor SOAP API call
    // In productie: authenticate() -> getCampaigns() SOAP call
    
    return [];
  } catch (error) {
    console.error('[TradeTracker] Campaign fetch error:', error);
    return [];
  }
}

/**
 * Get product feed for specific campaign
 */
export async function getTradeTrackerFeed(
  campaignId: string,
  credentials: TradeTrackerCredentials,
  options?: {
    maxProducts?: number;
    category?: string;
  }
): Promise<TradeTrackerProduct[]> {
  try {
    const maxProducts = Math.min(options?.maxProducts || 50, 200);
    
    console.log(`[TradeTracker] Fetching feed for campaign ${campaignId}`, {
      maxProducts,
      category: options?.category,
    });
    
    // Placeholder voor SOAP getFeedProducts call
    // In productie: authenticate() -> getFeedProducts() met campaignId
    
    return [];
  } catch (error) {
    console.error('[TradeTracker] Feed fetch error:', error);
    return [];
  }
}

/**
 * AI-powered TradeTracker product finder
 * Gebruikt AI om relevante producten te vinden en selecteren
 */
export async function findRelevantTradeTrackerProducts(
  query: string,
  credentials: TradeTrackerCredentials,
  options?: {
    maxProducts?: number;
    category?: string;
    priceRange?: { min?: number; max?: number };
    includeDescription?: boolean;
  }
): Promise<TradeTrackerProduct[]> {
  try {
    const maxProducts = Math.min(options?.maxProducts || 5, 10);
    
    console.log(`[TradeTracker AI] Finding products for: ${query}`, {
      maxProducts,
      category: options?.category,
    });

    // Step 1: Search products via TradeTracker
    const searchResult = await searchTradeTrackerProducts(query, credentials, {
      maxResults: maxProducts * 3, // Search more to filter best
      category: options?.category,
      minPrice: options?.priceRange?.min,
      maxPrice: options?.priceRange?.max,
    });

    if (searchResult.products.length === 0) {
      console.log('[TradeTracker AI] No products found');
      return [];
    }

    // Step 2: Use AI to select most relevant products
    const aiPrompt = `Je bent een product expert. Selecteer de ${maxProducts} MEEST RELEVANTE producten voor: "${query}"

Beschikbare producten:
${searchResult.products.map((p, i) => `
${i + 1}. ${p.name}
Prijs: €${p.price}
Campaign: ${p.campaignName}
Beschrijving: ${p.description?.substring(0, 150) || 'Geen beschrijving'}
`).join('\n')}

Selecteer de TOP ${maxProducts} producten die:
1. Het beste passen bij de zoekopdracht
2. Een goede prijs-kwaliteit verhouding hebben
3. Van betrouwbare campagnes komen
4. Goed verkopen en populair zijn

Geef je antwoord als JSON array met product IDs (alleen de nummers):
{"selected": [1, 3, 5]}`;

    const aiResponse = await chatCompletion({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: aiPrompt }
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    // Parse AI response
    let selectedIndices: number[] = [];
    try {
      const responseContent = aiResponse.choices[0]?.message?.content || '{}';
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        selectedIndices = parsed.selected || [];
      }
    } catch (e) {
      console.error('[TradeTracker AI] JSON parse error:', e);
      // Fallback: take first N products
      selectedIndices = Array.from({ length: maxProducts }, (_, i) => i + 1);
    }

    // Return selected products
    const selectedProducts = selectedIndices
      .filter(i => i >= 1 && i <= searchResult.products.length)
      .map(i => searchResult.products[i - 1])
      .filter(Boolean)
      .slice(0, maxProducts);

    console.log(`[TradeTracker AI] Selected ${selectedProducts.length} products`);
    
    return selectedProducts;
  } catch (error) {
    console.error('[TradeTracker AI] Product finding error:', error);
    return [];
  }
}

/**
 * Generate affiliate link HTML for product
 */
export function generateTradeTrackerProductLink(
  product: TradeTrackerProduct,
  linkText?: string,
  cssClass?: string
): string {
  const text = linkText || `Bekijk ${product.name}`;
  const className = cssClass || 'tradetracker-affiliate-link';
  
  return `<a href="${product.affiliateUrl}" target="_blank" rel="noopener noreferrer sponsored" class="${className}">${text}</a>`;
}

/**
 * Check if TradeTracker credentials are configured
 */
export function hasTradeTrackerCredentials(credentials?: TradeTrackerCredentials | null): boolean {
  return !!(credentials?.siteId);
}

/**
 * Parse TradeTracker XML feed
 * Ondersteunt TradeTracker productfeed XML format
 */
export async function parseTradeTrackerFeed(
  feedContent: string,
  siteId: string,
  defaultCampaignId?: string
): Promise<TradeTrackerProduct[]> {
  try {
    console.log('[TradeTracker] Parsing XML feed...');
    
    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
      normalize: true,
      trim: true,
    });
    
    const result = await parser.parseStringPromise(feedContent);
    
    // TradeTracker feed structure variaties
    const products = 
      result?.products?.product ||
      result?.feed?.product ||
      result?.product ||
      [];
    
    const productArray = Array.isArray(products) ? products : [products];
    console.log(`[TradeTracker] Found ${productArray.length} products in feed`);
    
    const parsedProducts: TradeTrackerProduct[] = [];
    
    for (const product of productArray) {
      try {
        // Haal product details op
        const productId = product.productID || product.id || product.ID || '';
        const productName = product.productName || product.name || product.title || 'Product';
        const productUrl = product.productURL || product.URL || product.url || product.link || '';
        const price = parseFloat(product.price || product.price_value || '0');
        const currency = product.currency || 'EUR';
        const imageUrl = product.imageURL || product.image || product.image_url || '';
        const description = product.description || product.description_short || '';
        const category = product.category?._ || product.category || '';
        const brand = product.brand || product.manufacturer || '';
        const ean = product.EAN || product.ean || '';
        
        // Haal campaign ID en material ID op uit URL of feed
        let campaignId = defaultCampaignId || '';
        let materialId = '';
        
        // Probeer campaign ID te extraheren uit product data
        if (product.campaignID || product.campaign_id) {
          campaignId = String(product.campaignID || product.campaign_id);
        }
        
        // Probeer material ID te extraheren
        if (product.materialID || product.material_id) {
          materialId = String(product.materialID || product.material_id);
        }
        
        // Als de productUrl al een deep link is, behoud deze
        let affiliateUrl = productUrl;
        
        // Als het een deep link is met tt parameter, update de site_id
        if (productUrl.includes('tt=')) {
          try {
            const url = new URL(productUrl);
            const ttParam = url.searchParams.get('tt');
            if (ttParam) {
              const parts = ttParam.split('_');
              if (parts.length >= 3) {
                parts[2] = siteId; // Update site ID
                url.searchParams.set('tt', parts.join('_'));
                affiliateUrl = url.toString();
              }
            }
          } catch (e) {
            console.error('[TradeTracker] Could not parse deep link:', e);
          }
        } else if (campaignId) {
          // Genereer click tracking link
          affiliateUrl = generateTradeTrackerAffiliateLink(
            campaignId,
            siteId,
            productUrl,
            materialId
          );
        }
        
        parsedProducts.push({
          id: productId,
          name: productName,
          description,
          price,
          currency,
          image: imageUrl,
          url: productUrl,
          affiliateUrl,
          category,
          brand,
          ean,
          campaignId,
          campaignName: product.campaignName || product.campaign_name || 'TradeTracker',
          deliveryTime: product.deliveryTime || product.delivery_time,
          stock: product.stock ? product.stock === 'true' || product.stock === '1' : undefined,
        });
      } catch (error) {
        console.error('[TradeTracker] Error parsing product:', error);
      }
    }
    
    console.log(`[TradeTracker] Successfully parsed ${parsedProducts.length} products`);
    return parsedProducts;
  } catch (error: any) {
    console.error('[TradeTracker] Feed parsing error:', error);
    throw new Error(`TradeTracker feed parsing failed: ${error.message}`);
  }
}

/**
 * Fetch TradeTracker feed from URL
 */
export async function fetchTradeTrackerFeed(
  feedUrl: string,
  siteId: string,
  defaultCampaignId?: string
): Promise<TradeTrackerProduct[]> {
  try {
    console.log('[TradeTracker] Fetching feed from URL:', feedUrl);
    
    const response = await fetch(feedUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const feedContent = await response.text();
    return parseTradeTrackerFeed(feedContent, siteId, defaultCampaignId);
  } catch (error: any) {
    console.error('[TradeTracker] Feed fetch error:', error);
    throw new Error(`Failed to fetch TradeTracker feed: ${error.message}`);
  }
}
