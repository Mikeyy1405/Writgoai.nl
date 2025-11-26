
/**
 * Product Box Generator for Blog Content
 * Generates beautiful, WordPress-compatible product boxes
 */

import { generateAffiliateDisplayHTML, bolcomToProductData, type ProductData, type DisplayType } from './affiliate-display-html';

export interface ProductInfo {
  name: string;
  url: string;
  price?: string;
  rating?: string;
  description?: string;
  imageUrl?: string;
  image?: string; // Alternative property name (from Bol.com selector)
}

/**
 * Convert product info to ProductData format
 */
export function convertToProductData(product: ProductInfo): ProductData {
  // Parse rating if exists (format: "4.5/5")
  const rating = product.rating ? parseFloat(product.rating.split('/')[0]) : undefined;
  
  // Get image URL - support both imageUrl and image properties
  const imageUrl = product.imageUrl || product.image || '';
  
  return {
    id: product.url, // Use URL as ID
    title: product.name,
    price: product.price,
    rating,
    reviewCount: 0, // Not provided in current format
    image: imageUrl,
    affiliateUrl: product.url,
    description: product.description,
    pros: (product as any).pros || [], // ✅ AI-gegenereerde pluspunten
    cons: (product as any).cons || [], // ✅ AI-gegenereerde minpunten
    category: undefined,
  };
}

/**
 * Generate product box HTML for AI prompt
 * Returns a placeholder that will be replaced later
 * NOTE: Placeholders MUST be on their own line to avoid formatting issues
 */
export function generateProductBoxPlaceholder(
  product: ProductInfo,
  displayType: DisplayType,
  index: number
): string {
  // Add newlines to ensure placeholder is on its own line
  return `\n\n{{PRODUCT_BOX_${index}_${displayType.toUpperCase().replace(/-/g, '_')}}}\n\n`;
}

/**
 * Replace placeholders with actual HTML
 * Handles both old and new placeholder formats for backward compatibility
 */
export function replaceProductPlaceholders(
  content: string,
  products: ProductInfo[],
  displayType: DisplayType
): string {
  let updatedContent = content;
  
  products.forEach((product, index) => {
    // Try new format (with underscores and newlines)
    const placeholderNew = `\n\n{{PRODUCT_BOX_${index}_${displayType.toUpperCase().replace(/-/g, '_')}}}\n\n`;
    // Try old format (with hyphens, no newlines)
    const placeholderOld = `{{PRODUCT_BOX_${index}_${displayType.toUpperCase()}}}`;
    // Try format with just surrounding newlines
    const placeholderMid = `{{PRODUCT_BOX_${index}_${displayType.toUpperCase().replace(/-/g, '_')}}}`;
    
    const productData = convertToProductData(product);
    const html = generateAffiliateDisplayHTML(productData, displayType);
    
    // Replace all variations
    if (updatedContent.includes(placeholderNew.trim())) {
      updatedContent = updatedContent.replace(new RegExp(placeholderNew.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), html);
    }
    if (updatedContent.includes(placeholderOld)) {
      updatedContent = updatedContent.replace(new RegExp(placeholderOld.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), html);
    }
    if (updatedContent.includes(placeholderMid)) {
      updatedContent = updatedContent.replace(new RegExp(placeholderMid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), html);
    }
  });
  
  return updatedContent;
}

/**
 * Get instructions for AI on how to integrate products
 */
export function getProductIntegrationInstructions(
  products: ProductInfo[],
  displayType: DisplayType
): string {
  if (products.length === 0) return '';
  
  const placeholders = products.map((p, i) => 
    generateProductBoxPlaceholder(p, displayType, i)
  ).join(', ');
  
  let instructions = `\n**🛒 PRODUCT INTEGRATIE:**\n\n`;
  
  switch (displayType) {
    case 'text-link':
      instructions += `Gebruik deze product placeholders INLINE in de tekst waar relevant:\n`;
      products.forEach((p, i) => {
        instructions += `- ${generateProductBoxPlaceholder(p, displayType, i)} voor "${p.name}"\n`;
      });
      instructions += `\nVoorbeeld: "Voor wie op zoek is naar een goede optie, raad ik ${placeholders.split(',')[0]} aan."\n`;
      break;
    
    case 'product-box':
      instructions += `Plaats deze product boxes na relevante secties:\n`;
      products.forEach((p, i) => {
        instructions += `\n${generateProductBoxPlaceholder(p, displayType, i)}\n(Product: ${p.name})\n`;
      });
      instructions += `\n⚠️ Plaats maximaal 1 product box per 400-500 woorden.\n`;
      break;
    
    case 'cta-box':
      instructions += `Plaats deze premium CTA boxes op STRATEGISCHE locaties:\n`;
      products.forEach((p, i) => {
        instructions += `\n${generateProductBoxPlaceholder(p, displayType, i)}\n(Product: ${p.name} - Beste keuze)\n`;
      });
      instructions += `\n💡 Best practices:\n`;
      instructions += `- Plaats na overtuigende secties die de noodzaak uitleggen\n`;
      instructions += `- Maximaal 1 CTA box per 600-800 woorden\n`;
      instructions += `- Gebruik voor je TOP aanbeveling\n`;
      break;
    
    case 'product-grid':
      instructions += `Plaats deze product grid op een logische plek (bv. "Onze Top Aanbevelingen" sectie):\n\n`;
      instructions += `{{PRODUCT_GRID}}\n\n`;
      instructions += `Dit toont alle ${products.length} producten in een mooie grid layout.\n`;
      break;
    
    case 'comparison-table':
      instructions += `Plaats deze vergelijkingstabel op een logische plek:\n\n`;
      instructions += `{{PRODUCT_COMPARISON_TABLE}}\n\n`;
      instructions += `Dit toont alle ${products.length} producten in een overzichtelijke tabel.\n`;
      break;
    
    case 'ai-mix':
      instructions += `🤖 AI MIX MODE - Intelligente product verdeling!\n\n`;
      instructions += `Je hebt ${products.length} producten om te integreren. Verdeel ze NETJES en GELIJKMATIG door de hele tekst.\n\n`;
      
      instructions += `**VERDELING STRATEGIE:**\n`;
      instructions += `- Als je ${products.length} producten hebt, plaats ze verspreid over de tekst\n`;
      instructions += `- Ongeveer elke ${Math.floor(100 / products.length)}% van de content een product\n`;
      instructions += `- Mix inline links en productboxen voor variatie\n\n`;
      
      instructions += `**BESCHIKBARE PRODUCTEN:**\n`;
      products.forEach((p, i) => {
        instructions += `\n**Product ${i + 1}: ${p.name}**\n`;
        instructions += `- Voor inline vermelding (in tekst): ${generateProductBoxPlaceholder(p, 'text-link', i).trim()}\n`;
        instructions += `- Voor volledige productbox: ${generateProductBoxPlaceholder(p, 'product-box', i).trim()}\n`;
      });
      
      instructions += `\n**PLAATSING REGELS:**\n`;
      instructions += `1. **Eerste product (0-20% van tekst):**\n`;
      instructions += `   - Gebruik inline link bij eerste vermelding\n`;
      instructions += `   - Plaats productbox na relevante uitleg sectie\n\n`;
      
      instructions += `2. **Middelste producten (20-80% van tekst):**\n`;
      instructions += `   - Afwisselend inline links en productboxen\n`;
      instructions += `   - Productboxen na belangrijke paragrafen\n`;
      instructions += `   - Inline links binnen lopende tekst met context\n\n`;
      
      instructions += `3. **Laatste product (80-100% van tekst):**\n`;
      instructions += `   - Bij voorkeur productbox voor sterke afsluiting\n`;
      instructions += `   - Of inline in conclusie sectie\n\n`;
      
      instructions += `**VOORBEELD VERDELING (${products.length} producten):**\n`;
      if (products.length >= 3) {
        instructions += `- Begin: Inline link voor ${products[0].name}\n`;
        instructions += `- 30% van tekst: Productbox voor ${products[1].name}\n`;
        if (products.length >= 5) {
          instructions += `- 50% van tekst: Inline link voor ${products[2].name}\n`;
          instructions += `- 70% van tekst: Productbox voor ${products[3].name}\n`;
          instructions += `- Einde: Productbox voor ${products[4].name}\n`;
        } else if (products.length >= 4) {
          instructions += `- 60% van tekst: Productbox voor ${products[2].name}\n`;
          instructions += `- Einde: Inline link voor ${products[3].name}\n`;
        } else {
          instructions += `- Einde: Productbox voor ${products[2].name}\n`;
        }
      }
      
      instructions += `\n💡 **BESTE PRAKTIJKEN:**\n`;
      instructions += `- Inline links: Noem product natuurlijk in lopende tekst, vervang naam met placeholder\n`;
      instructions += `- Productboxen: Plaats na uitleg waarom dit product goed is\n`;
      instructions += `- Zorg voor goede spreiding - NIET alles aan het einde!\n`;
      instructions += `- Varieer tussen inline en box voor dynamische content\n`;
      break;
  }
  
  instructions += `\n⚠️ KRITIEKE REGELS - NOOIT OVERTREDEN:

1. **GEBRUIK ALLEEN PLACEHOLDERS - GEEN MARKDOWN, GEEN HTML**
   ✅ CORRECT: {{PRODUCT_BOX_0_PRODUCT_BOX}}
   ❌ FOUT: **🏆 TOP AANBEVELING** (dit is markdown)
   ❌ FOUT: <div>Product</div> (dit is HTML)
   ❌ FOUT: ### Product (dit is markdown heading)

2. **PLACEHOLDERS MOETEN OP EIGEN REGEL STAAN**
   ✅ CORRECT:
   
   {{PRODUCT_BOX_0_PRODUCT_BOX}}
   
   ❌ FOUT: Bekijk {{PRODUCT_BOX_0_PRODUCT_BOX}} voor meer info

3. **GEBRUIK EXACT DEZE PLACEHOLDER SYNTAX**
   - Inclusief de {{}} dubbele accolades
   - Met HOOFDLETTERS en UNDERSCORES
   - Bijvoorbeeld: {{PRODUCT_BOX_0_CTA_BOX}}

4. **DE PLACEHOLDERS WORDEN AUTOMATISCH VERVANGEN**
   - Door professionele HTML boxen met styling
   - Met product afbeeldingen, prijzen, ratings
   - Met werkende knoppen en hover effecten

5. **SCHRIJF NOOIT MARKDOWN VOOR PRODUCTEN**
   - Geen emoji's bij producten (🏆, ⭐, 🛒)
   - Geen bold/italic (**tekst**, *tekst*)
   - Geen headings (###)
   - ALLEEN de placeholder codes

6. **GENEREER NOOIT ZELF HTML VOOR PRODUCTEN**
   - Geen <div>, <a>, <button> tags
   - Gebruik ALLEEN de placeholder codes
   - De HTML wordt automatisch gegenereerd

Als je deze regels overtreedt, zullen de productboxen NIET correct worden weergegeven in WordPress!\n`;
  
  return instructions;
}

/**
 * Process content and replace all product placeholders
 */
export function processProductBoxes(
  content: string,
  products: ProductInfo[],
  displayType: DisplayType
): string {
  let processedContent = content;
  
  // Handle grid and table displays
  if (displayType === 'product-grid') {
    const gridPlaceholder = '{{PRODUCT_GRID}}';
    if (processedContent.includes(gridPlaceholder)) {
      const productsData = products.map(convertToProductData);
      const gridHTML = generateAffiliateDisplayHTML(productsData, 'product-grid');
      processedContent = processedContent.replace(new RegExp(gridPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), gridHTML);
    }
  } else if (displayType === 'comparison-table') {
    const tablePlaceholder = '{{PRODUCT_COMPARISON_TABLE}}';
    if (processedContent.includes(tablePlaceholder)) {
      const productsData = products.map(convertToProductData);
      const tableHTML = generateAffiliateDisplayHTML(productsData, 'comparison-table');
      processedContent = processedContent.replace(new RegExp(tablePlaceholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), tableHTML);
    }
  } else if (displayType === 'ai-mix') {
    // Handle all display types for AI mix
    const displayTypes: DisplayType[] = ['text-link', 'product-box', 'cta-box'];
    products.forEach((product, index) => {
      displayTypes.forEach(type => {
        // Try all placeholder variations
        const placeholderNew = `{{PRODUCT_BOX_${index}_${type.toUpperCase().replace(/-/g, '_')}}}`;
        const placeholderOld = `{{PRODUCT_BOX_${index}_${type.toUpperCase()}}}`;
        
        const productData = convertToProductData(product);
        const html = generateAffiliateDisplayHTML(productData, type);
        
        // Replace all variations
        if (processedContent.includes(placeholderNew)) {
          processedContent = processedContent.replace(new RegExp(placeholderNew.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), html);
        }
        if (processedContent.includes(placeholderOld)) {
          processedContent = processedContent.replace(new RegExp(placeholderOld.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), html);
        }
      });
    });
  } else {
    // Handle individual product displays
    processedContent = replaceProductPlaceholders(processedContent, products, displayType);
  }
  
  return processedContent;
}
