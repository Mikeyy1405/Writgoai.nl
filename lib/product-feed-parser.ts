
import aimlAPI from './aiml-api';
import xml2js from 'xml2js';

export interface ProductFeedItem {
  name: string;
  url: string;
  price?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  sku?: string;
}

export type FeedFormat = 'tradetracker' | 'bol' | 'daisycon' | 'csv' | 'xml' | 'json' | 'auto';

/**
 * Parse product feed from various formats
 */
export async function parseProductFeed(
  content: string,
  format: FeedFormat = 'auto'
): Promise<ProductFeedItem[]> {
  // Auto-detect format if needed
  if (format === 'auto') {
    format = detectFeedFormat(content);
  }

  console.log(`[Feed Parser] Parsing feed as ${format}`);

  switch (format) {
    case 'xml':
      return parseXMLFeed(content);
    case 'csv':
      return parseCSVFeed(content);
    case 'json':
      return parseJSONFeed(content);
    case 'tradetracker':
      return parseTradetrackerFeed(content);
    case 'bol':
      return parseBolFeed(content);
    case 'daisycon':
      return parseDaisyconFeed(content);
    default:
      throw new Error(`Onbekend feed formaat: ${format}`);
  }
}

/**
 * Detect feed format from content
 */
function detectFeedFormat(content: string): FeedFormat {
  const trimmed = content.trim();
  
  // Check for XML
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) {
    // Check for specific vendor XML
    if (content.includes('tradetracker')) return 'tradetracker';
    if (content.includes('bol.com') || content.includes('<bol>')) return 'bol';
    if (content.includes('daisycon')) return 'daisycon';
    return 'xml';
  }
  
  // Check for JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'json';
  }
  
  // Check for CSV (contains commas and likely headers)
  if (content.includes(',') && content.split('\n').length > 1) {
    return 'csv';
  }
  
  throw new Error('Kon feed formaat niet automatisch detecteren. Selecteer handmatig een formaat.');
}

/**
 * Parse generic XML feed
 */
async function parseXMLFeed(content: string): Promise<ProductFeedItem[]> {
  try {
    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
      normalize: true,
      trim: true,
    });
    
    const result = await parser.parseStringPromise(content);
    const items: ProductFeedItem[] = [];
    
    // Try to find product items in common XML structures
    const products = 
      result?.rss?.channel?.item ||
      result?.feed?.entry ||
      result?.products?.product ||
      result?.items?.item ||
      [];
    
    const productArray = Array.isArray(products) ? products : [products];
    
    for (const product of productArray) {
      items.push({
        name: product.title || product.name || product['g:title'] || 'Product',
        url: product.link || product.url || product['g:link'] || '',
        price: product.price || product['g:price'] || '',
        category: product.category || product['g:product_type'] || '',
        description: product.description || product['g:description'] || '',
        imageUrl: product.image_link || product['g:image_link'] || '',
        sku: product.id || product.sku || product['g:id'] || '',
      });
    }
    
    return items;
  } catch (error: any) {
    console.error('[Feed Parser] XML parsing error:', error);
    throw new Error(`XML parsing error: ${error.message}`);
  }
}

/**
 * Parse Tradetracker XML feed
 */
async function parseTradetrackerFeed(content: string): Promise<ProductFeedItem[]> {
  try {
    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
      normalize: true,
      trim: true,
    });
    
    const result = await parser.parseStringPromise(content);
    const products = result?.products?.product || [];
    const productArray = Array.isArray(products) ? products : [products];
    
    return productArray.map(product => ({
      name: product.productName || product.name || 'Product',
      url: product.productURL || product.URL || '',
      price: product.price || '',
      category: product.categories?.category || product.category || '',
      description: product.description || '',
      imageUrl: product.imageURL || product.image || '',
      sku: product.productID || product.SKU || '',
    }));
  } catch (error: any) {
    console.error('[Feed Parser] Tradetracker XML parsing error:', error);
    // Fallback to generic XML parser
    return parseXMLFeed(content);
  }
}

/**
 * Parse Bol.com feed
 */
async function parseBolFeed(content: string): Promise<ProductFeedItem[]> {
  try {
    // Bol.com can provide both XML and CSV feeds
    if (content.trim().startsWith('<')) {
      // XML format
      const parser = new xml2js.Parser({
        explicitArray: false,
        mergeAttrs: true,
        normalize: true,
        trim: true,
      });
      
      const result = await parser.parseStringPromise(content);
      const products = result?.products?.product || result?.catalog?.product || [];
      const productArray = Array.isArray(products) ? products : [products];
      
      return productArray.map(product => ({
        name: product.title || product.name || 'Product',
        url: product.url || product.link || '',
        price: product.price || product.offerPrice || '',
        category: product.category || product.categoryName || '',
        description: product.shortDescription || product.description || '',
        imageUrl: product.imageUrl || product.image || '',
        sku: product.ean || product.id || '',
      }));
    } else {
      // CSV format
      return parseCSVFeed(content);
    }
  } catch (error: any) {
    console.error('[Feed Parser] Bol.com feed parsing error:', error);
    // Fallback to generic parser
    return content.trim().startsWith('<') ? parseXMLFeed(content) : parseCSVFeed(content);
  }
}

/**
 * Parse Daisycon feed
 */
async function parseDaisyconFeed(content: string): Promise<ProductFeedItem[]> {
  try {
    if (content.trim().startsWith('<')) {
      // XML format
      const parser = new xml2js.Parser({
        explicitArray: false,
        mergeAttrs: true,
        normalize: true,
        trim: true,
      });
      
      const result = await parser.parseStringPromise(content);
      const products = result?.feed?.product || result?.products?.product || [];
      const productArray = Array.isArray(products) ? products : [products];
      
      return productArray.map(product => ({
        name: product.name || product.title || 'Product',
        url: product.url || product.link || product.producturl || '',
        price: product.price || product.price_value || '',
        category: product.category || product.category_name || '',
        description: product.description || product.description_short || '',
        imageUrl: product.imageurl || product.image_url || product.image || '',
        sku: product.sku || product.id || product.product_id || '',
      }));
    } else {
      // CSV format
      return parseCSVFeed(content);
    }
  } catch (error: any) {
    console.error('[Feed Parser] Daisycon feed parsing error:', error);
    // Fallback to generic parser
    return content.trim().startsWith('<') ? parseXMLFeed(content) : parseCSVFeed(content);
  }
}

/**
 * Parse CSV feed
 */
function parseCSVFeed(content: string): ProductFeedItem[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV feed moet minimaal een header en een product bevatten');
  }

  // Parse header
  const headers = lines[0].split(/[,;\t]/).map(h => h.trim().toLowerCase());
  
  // Find column indices
  const nameIdx = headers.findIndex(h => 
    h.includes('name') || h.includes('title') || h.includes('product')
  );
  const urlIdx = headers.findIndex(h => 
    h.includes('url') || h.includes('link')
  );
  const priceIdx = headers.findIndex(h => h.includes('price'));
  const categoryIdx = headers.findIndex(h => h.includes('category'));
  const descriptionIdx = headers.findIndex(h => h.includes('description'));
  const imageIdx = headers.findIndex(h => h.includes('image'));
  const skuIdx = headers.findIndex(h => 
    h.includes('sku') || h.includes('id') || h.includes('ean')
  );

  if (nameIdx === -1 || urlIdx === -1) {
    throw new Error('CSV feed moet minimaal "name" en "url" kolommen bevatten');
  }

  const items: ProductFeedItem[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(/[,;\t]/).map(v => v.trim());
    
    if (values.length < 2) continue;
    
    items.push({
      name: values[nameIdx] || 'Product',
      url: values[urlIdx] || '',
      price: priceIdx !== -1 ? values[priceIdx] : undefined,
      category: categoryIdx !== -1 ? values[categoryIdx] : undefined,
      description: descriptionIdx !== -1 ? values[descriptionIdx] : undefined,
      imageUrl: imageIdx !== -1 ? values[imageIdx] : undefined,
      sku: skuIdx !== -1 ? values[skuIdx] : undefined,
    });
  }

  return items;
}

/**
 * Parse JSON feed
 */
function parseJSONFeed(content: string): ProductFeedItem[] {
  try {
    const data = JSON.parse(content);
    
    // Try to find products array in various structures
    const products = 
      data.products ||
      data.items ||
      data.data ||
      (Array.isArray(data) ? data : []);
    
    if (!Array.isArray(products)) {
      throw new Error('JSON feed moet een array van producten bevatten');
    }
    
    return products.map(product => ({
      name: product.name || product.title || product.productName || 'Product',
      url: product.url || product.link || product.productUrl || '',
      price: product.price || product.price_value || '',
      category: product.category || product.categoryName || '',
      description: product.description || product.desc || '',
      imageUrl: product.image || product.imageUrl || product.image_url || '',
      sku: product.sku || product.id || product.product_id || '',
    }));
  } catch (error: any) {
    console.error('[Feed Parser] JSON parsing error:', error);
    throw new Error(`JSON parsing error: ${error.message}`);
  }
}

/**
 * Generate affiliate links from product feed
 */
export async function generateAffiliateLinksFromFeed(
  products: ProductFeedItem[],
  defaultCategory?: string
): Promise<Array<{
  url: string;
  anchorText: string;
  category: string;
  keywords: string[];
  description?: string;
}>> {
  const links: Array<{
    url: string;
    anchorText: string;
    category: string;
    keywords: string[];
    description?: string;
  }> = [];

  for (const product of products) {
    if (!product.url) continue;
    
    // Generate keywords using AI
    const keywords = await generateKeywordsForProduct(product);
    
    links.push({
      url: product.url,
      anchorText: product.name,
      category: product.category || defaultCategory || 'Producten',
      keywords,
      description: product.description,
    });
  }

  return links;
}

/**
 * Generate keywords for product using AI
 */
async function generateKeywordsForProduct(product: ProductFeedItem): Promise<string[]> {
  try {
    const prompt = `Genereer 3-5 relevante Nederlandse zoekwoorden voor dit product.

Productnaam: ${product.name}
${product.category ? `Categorie: ${product.category}` : ''}
${product.description ? `Beschrijving: ${product.description.substring(0, 200)}` : ''}

Return ALLEEN een komma-gescheiden lijst van keywords, niets anders.
Voorbeeld: yoga mat, sportmat, fitness, workout`;

    const response = await aimlAPI.chatCompletion({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Je bent een keyword extractie expert. Genereer relevante Nederlandse keywords voor producten.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    const keywords = response.choices[0].message.content
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 2)
      .slice(0, 5);

    return keywords.length > 0 ? keywords : [product.name.toLowerCase()];
  } catch (error) {
    console.error('[Feed Parser] Error generating keywords:', error);
    // Fallback keywords from product name
    return product.name.toLowerCase().split(' ').filter(w => w.length > 2).slice(0, 5);
  }
}

