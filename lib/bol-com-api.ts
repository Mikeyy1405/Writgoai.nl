/**
 * Bol.com API Integration
 * Voor het zoeken en embedden van affiliate producten in content
 */

const BOL_COM_CLIENT_ID = process.env.BOL_COM_CLIENT_ID || '';
const BOL_COM_CLIENT_SECRET = process.env.BOL_COM_CLIENT_SECRET || '';
const BOL_COM_API_URL = 'https://api.bol.com/retailer/v10';

export interface BolProduct {
  id: string;
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
  url: string;
  rating?: number;
  reviews?: number;
  affiliate: boolean;
}

/**
 * Haal een access token op van Bol.com
 */
async function getBolAccessToken(): Promise<string> {
  if (!BOL_COM_CLIENT_ID || !BOL_COM_CLIENT_SECRET) {
    throw new Error('Bol.com API credentials are not configured');
  }

  const credentials = Buffer.from(`${BOL_COM_CLIENT_ID}:${BOL_COM_CLIENT_SECRET}`).toString('base64');

  const response = await fetch('https://login.bol.com/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error('Failed to get Bol.com access token');
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Zoek producten op Bol.com
 */
export async function searchBolProducts(
  query: string,
  limit: number = 5
): Promise<BolProduct[]> {
  try {
    // Note: Dit is een placeholder implementatie
    // De daadwerkelijke Bol.com API vereist een retailer account
    // Voor nu returnen we mock data
    
    console.log(`Searching Bol.com for: ${query}`);
    
    // Mock producten voor demo doeleinden
    const mockProducts: BolProduct[] = [
      {
        id: '1',
        title: `Productvoorbeeld: ${query}`,
        description: `Een geweldig product gerelateerd aan ${query}. Hoogwaardige kwaliteit en uitstekende recensies.`,
        price: 29.99,
        imageUrl: 'https://placehold.co/300x300',
        url: `https://www.bol.com/nl/nl/p/${encodeURIComponent(query)}/`,
        rating: 4.5,
        reviews: 127,
        affiliate: true
      }
    ];
    
    return mockProducts.slice(0, limit);
  } catch (error) {
    console.error('Error searching Bol.com:', error);
    return [];
  }
}

/**
 * Genereer HTML voor Bol.com product embedding
 */
export function generateProductHtml(product: BolProduct): string {
  return `
<div class="bol-product" style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0; background: #f9fafb;">
  <div style="display: flex; gap: 16px; align-items: start;">
    ${product.imageUrl ? `
    <div style="flex-shrink: 0;">
      <img src="${product.imageUrl}" alt="${product.title}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 4px;" />
    </div>
    ` : ''}
    <div style="flex: 1;">
      <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
        <a href="${product.url}" target="_blank" rel="noopener noreferrer sponsored" style="color: #0066c0; text-decoration: none;">
          ${product.title}
        </a>
      </h3>
      ${product.description ? `
      <p style="margin: 8px 0; color: #374151; font-size: 14px; line-height: 1.5;">
        ${product.description}
      </p>
      ` : ''}
      <div style="margin-top: 12px; display: flex; align-items: center; gap: 16px;">
        <div style="font-size: 20px; font-weight: 700; color: #059669;">
          €${product.price.toFixed(2)}
        </div>
        ${product.rating ? `
        <div style="display: flex; align-items: center; gap: 4px; font-size: 14px; color: #6b7280;">
          <span>⭐ ${product.rating}</span>
          ${product.reviews ? `<span>(${product.reviews} reviews)</span>` : ''}
        </div>
        ` : ''}
      </div>
      <a href="${product.url}" target="_blank" rel="noopener noreferrer sponsored" 
         style="display: inline-block; margin-top: 12px; padding: 10px 20px; background: #0066c0; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
        Bekijk op Bol.com →
      </a>
    </div>
  </div>
</div>
  `.trim();
}

/**
 * Embed Bol.com producten in content
 */
export function embedProductsInContent(
  content: string,
  products: BolProduct[],
  strategy: 'beginning' | 'middle' | 'end' | 'distributed' = 'distributed'
): string {
  if (products.length === 0) {
    return content;
  }

  const paragraphs = content.split('\n\n');
  
  if (strategy === 'beginning') {
    // Plaats product na introductie
    const productHtml = generateProductHtml(products[0]);
    return [paragraphs[0], productHtml, ...paragraphs.slice(1)].join('\n\n');
  } else if (strategy === 'middle') {
    // Plaats product in het midden
    const middleIndex = Math.floor(paragraphs.length / 2);
    const productHtml = generateProductHtml(products[0]);
    return [
      ...paragraphs.slice(0, middleIndex),
      productHtml,
      ...paragraphs.slice(middleIndex)
    ].join('\n\n');
  } else if (strategy === 'end') {
    // Plaats product aan het einde
    const productHtml = generateProductHtml(products[0]);
    return [...paragraphs, productHtml].join('\n\n');
  } else {
    // Distributed: Verspreid producten gelijkmatig door content
    const result: string[] = [];
    const insertInterval = Math.floor(paragraphs.length / (products.length + 1));
    
    let productIndex = 0;
    for (let i = 0; i < paragraphs.length; i++) {
      result.push(paragraphs[i]);
      
      if (productIndex < products.length && (i + 1) % insertInterval === 0 && i < paragraphs.length - 1) {
        result.push(generateProductHtml(products[productIndex]));
        productIndex++;
      }
    }
    
    return result.join('\n\n');
  }
}
