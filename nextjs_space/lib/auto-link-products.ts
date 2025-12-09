
/**
 * Auto-Link Products System
 * Automatically inserts affiliate links when specific product names are mentioned
 */

import { quickProductSearch, type EnrichedProduct } from './bolcom-product-finder';
import { generateAffiliateDisplayHTML, type ProductData } from './affiliate-display-html';
import type { BolcomCredentials } from './bolcom-api';


export interface AutoLinkOptions {
  projectId: string;
  content: string;
  credentials: BolcomCredentials;
  cacheResults?: boolean; // Cache product data for 24 hours (default: true)
}

export interface AutoLinkResult {
  content: string;
  linksInserted: number;
  productsLinked: string[];
}

/**
 * Automatically link products in content
 * Scans content for product names and inserts affiliate links
 */
export async function autoLinkProducts(
  options: AutoLinkOptions
): Promise<AutoLinkResult> {
  const { projectId, content, credentials, cacheResults = true } = options;
  
  try {
    // Get all enabled auto-link products for this project
    const autoLinkProducts = await prisma.autoLinkProduct.findMany({
      where: {
        projectId,
        enabled: true,
      },
    });

    if (autoLinkProducts.length === 0) {
      return {
        content,
        linksInserted: 0,
        productsLinked: [],
      };
    }

    console.log(`[AutoLink] Found ${autoLinkProducts.length} auto-link products for project ${projectId}`);

    let updatedContent = content;
    let linksInserted = 0;
    const productsLinked: string[] = [];

    // Process each product
    for (const autoProduct of autoLinkProducts) {
      // Check if product name is mentioned in content (case-insensitive)
      const regex = new RegExp(`\\b${escapeRegex(autoProduct.productName)}\\b`, 'gi');
      const matches = content.match(regex);

      if (!matches || matches.length === 0) {
        continue; // Product not mentioned in content
      }

      console.log(`[AutoLink] Found ${matches.length} mentions of "${autoProduct.productName}"`);

      // Check if we have cached data and it's recent (< 24 hours)
      const cacheValid = 
        cacheResults &&
        autoProduct.affiliateUrl &&
        autoProduct.lastFetched &&
        (Date.now() - autoProduct.lastFetched.getTime()) < 24 * 60 * 60 * 1000;

      let affiliateUrl = autoProduct.affiliateUrl;
      let productData: ProductData | null = null;

      if (!cacheValid) {
        // Fetch fresh product data from Bol.com
        try {
          const searchTerm = autoProduct.searchTerm || autoProduct.productName;
          console.log(`[AutoLink] Fetching product data for "${searchTerm}"...`);
          
          const products = await quickProductSearch(searchTerm, credentials, 1);
          
          if (products.length > 0) {
            const product = products[0];
            affiliateUrl = product.affiliateUrl;
            
            productData = {
              id: product.ean,
              title: product.title,
              price: `€${product.price.toFixed(2)}`,
              rating: product.rating,
              reviewCount: product.ratingCount || 0,
              image: product.image.url,
              affiliateUrl: product.affiliateUrl,
              description: product.description,
            };

            // Update cache
            if (cacheResults) {
              await prisma.autoLinkProduct.update({
                where: { id: autoProduct.id },
                data: {
                  affiliateUrl: product.affiliateUrl,
                  price: product.price,
                  imageUrl: product.image.url,
                  bolProductId: product.bolProductId,
                  ean: product.ean,
                  lastFetched: new Date(),
                },
              });
              console.log(`[AutoLink] Cached product data for "${autoProduct.productName}"`);
            }
          } else {
            console.warn(`[AutoLink] No products found for "${searchTerm}"`);
            continue;
          }
        } catch (error) {
          console.error(`[AutoLink] Error fetching product "${autoProduct.productName}":`, error);
          continue;
        }
      } else {
        console.log(`[AutoLink] Using cached data for "${autoProduct.productName}"`);
        
        // Build product data from cache
        productData = {
          id: autoProduct.ean || '',
          title: autoProduct.productName,
          price: autoProduct.price ? `€${autoProduct.price.toFixed(2)}` : undefined,
          image: autoProduct.imageUrl || '',
          affiliateUrl: autoProduct.affiliateUrl!,
        };
      }

      if (!affiliateUrl || !productData) {
        continue;
      }

      // Generate link HTML based on linkType
      let linkHTML = '';
      
      switch (autoProduct.linkType) {
        case 'inline':
          // Simple inline link
          linkHTML = `<a href="${affiliateUrl}" target="_blank" rel="noopener nofollow sponsored" class="affiliate-link">${autoProduct.productName}</a>`;
          break;
          
        case 'product-box':
          // Full product box
          linkHTML = generateAffiliateDisplayHTML(productData, 'product-box');
          break;
          
        case 'cta-box':
          // CTA box
          linkHTML = generateAffiliateDisplayHTML(productData, 'cta-box');
          break;
          
        default:
          // Default to inline link
          linkHTML = `<a href="${affiliateUrl}" target="_blank" rel="noopener nofollow sponsored" class="affiliate-link">${autoProduct.productName}</a>`;
      }

      // Replace first mention with link (avoid over-linking)
      // Only replace the first occurrence to avoid cluttered content
      updatedContent = updatedContent.replace(regex, (match, offset) => {
        // Check if this is the first match
        const isFirstMatch = offset === updatedContent.search(regex);
        
        if (isFirstMatch && autoProduct.linkType === 'inline') {
          // For inline links, replace the first occurrence
          return linkHTML;
        } else if (isFirstMatch && (autoProduct.linkType === 'product-box' || autoProduct.linkType === 'cta-box')) {
          // For box types, insert after the first paragraph that mentions it
          return match; // Keep original text, we'll insert box separately
        }
        
        return match; // Keep other mentions as plain text
      });

      // For product-box and cta-box, insert after first mention
      if (autoProduct.linkType === 'product-box' || autoProduct.linkType === 'cta-box') {
        // Find the first paragraph containing the product name
        const paragraphRegex = new RegExp(`<p[^>]*>([^<]*\\b${escapeRegex(autoProduct.productName)}\\b[^<]*)<\/p>`, 'i');
        const paragraphMatch = updatedContent.match(paragraphRegex);
        
        if (paragraphMatch) {
          // Insert box after this paragraph
          updatedContent = updatedContent.replace(paragraphRegex, `$&\n\n${linkHTML}\n\n`);
        }
      }

      linksInserted++;
      productsLinked.push(autoProduct.productName);
    }

    console.log(`[AutoLink] Inserted ${linksInserted} product links`);

    return {
      content: updatedContent,
      linksInserted,
      productsLinked,
    };
  } catch (error) {
    console.error('[AutoLink] Error in autoLinkProducts:', error);
    
    // Return original content on error
    return {
      content,
      linksInserted: 0,
      productsLinked: [],
    };
  }
}

/**
 * Bulk add auto-link products to a project
 */
export async function bulkAddAutoLinkProducts(
  projectId: string,
  products: Array<{
    productName: string;
    searchTerm?: string;
    ean?: string;
    linkType?: 'inline' | 'product-box' | 'cta-box';
  }>
): Promise<number> {
  try {
    const created = await prisma.autoLinkProduct.createMany({
      data: products.map(p => ({
        projectId,
        productName: p.productName,
        searchTerm: p.searchTerm,
        ean: p.ean,
        linkType: p.linkType || 'inline',
        enabled: true,
      })),
      skipDuplicates: true,
    });

    console.log(`[AutoLink] Bulk added ${created.count} products to project ${projectId}`);
    
    return created.count;
  } catch (error) {
    console.error('[AutoLink] Error in bulkAddAutoLinkProducts:', error);
    throw error;
  }
}

/**
 * Helper function to escape special regex characters
 */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default autoLinkProducts;
