/**
 * Bol.com Marketing Catalog API Client
 * 
 * Provides access to Bol.com product catalog for affiliate marketing
 * Documentation: https://api.bol.com/marketing/docs/catalog-api/
 */

interface BolAuthConfig {
  clientId: string;
  clientSecret: string;
}

interface BolToken {
  accessToken: string;
  expiresAt: number;
}

interface BolProduct {
  ean: string;
  bolProductId: string;
  title: string;
  description?: string;
  url: string;
  image?: {
    url: string;
    width: number;
    height: number;
  };
  rating?: number;
  offer?: {
    price: number;
    strikethroughPrice?: number;
    deliveryDescription?: string;
  };
  specifications?: Array<{
    title: string;
    specifications: Array<{
      key: string;
      name: string;
      values: string[];
    }>;
  }>;
}

interface BolSearchResult {
  totalResults: number;
  page: number;
  pageSize: number;
  products: BolProduct[];
}

interface BolProductMedia {
  ean: string;
  images: Array<{
    order: number;
    mimeType: string;
    renditions: Array<{
      width: number;
      height: number;
      url: string;
    }>;
  }>;
}

interface BolProductRating {
  ean: string;
  averageRating: number;
  ratings: Array<{
    rating: number;
    count: number;
  }>;
}

// Token cache per client credentials
const tokenCache = new Map<string, BolToken>();

/**
 * Get OAuth2 access token from Bol.com
 */
async function getAccessToken(config: BolAuthConfig): Promise<string> {
  const cacheKey = `${config.clientId}`;
  const cached = tokenCache.get(cacheKey);
  
  // Return cached token if still valid (with 30 second buffer)
  if (cached && cached.expiresAt > Date.now() + 30000) {
    return cached.accessToken;
  }

  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  
  const response = await fetch('https://login.bol.com/token?grant_type=client_credentials', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Bol.com auth error:', response.status, error);
    throw new Error(`Bol.com authentication failed: ${response.status}`);
  }

  const data = await response.json();
  
  const token: BolToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };
  
  tokenCache.set(cacheKey, token);
  return token.accessToken;
}

/**
 * Bol.com API Client class
 */
export class BolClient {
  private config: BolAuthConfig;
  private baseUrl = 'https://api.bol.com/marketing/catalog/v1';

  constructor(config: BolAuthConfig) {
    this.config = config;
  }

  /**
   * Make authenticated request to Bol.com API
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    const token = await getAccessToken(this.config);
    
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Accept-Language': 'nl',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Bol.com API error:', response.status, error);
      throw new Error(`Bol.com API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Search for products
   */
  async searchProducts(
    searchTerm: string,
    options: {
      page?: number;
      pageSize?: number;
      countryCode?: 'NL' | 'BE';
      includeImage?: boolean;
      includeOffer?: boolean;
      includeRating?: boolean;
    } = {}
  ): Promise<BolSearchResult> {
    const {
      page = 1,
      pageSize = 10,
      countryCode = 'NL',
      includeImage = true,
      includeOffer = true,
      includeRating = true,
    } = options;

    const response = await this.request<any>('/products/search', {
      'search-term': searchTerm,
      'page': page.toString(),
      'page-size': pageSize.toString(),
      'country-code': countryCode,
      'include-image': includeImage.toString(),
      'include-offer': includeOffer.toString(),
      'include-rating': includeRating.toString(),
    });

    return {
      totalResults: response.totalResults || 0,
      page: response.page || page,
      pageSize: response.pageSize || pageSize,
      products: (response.results || []).map(this.mapProduct),
    };
  }

  /**
   * Get product by EAN
   */
  async getProduct(
    ean: string,
    options: {
      countryCode?: 'NL' | 'BE';
      includeSpecifications?: boolean;
      includeImage?: boolean;
      includeOffer?: boolean;
      includeRating?: boolean;
    } = {}
  ): Promise<BolProduct | null> {
    const {
      countryCode = 'NL',
      includeSpecifications = true,
      includeImage = true,
      includeOffer = true,
      includeRating = true,
    } = options;

    try {
      const response = await this.request<any>(`/products/${ean}`, {
        'country-code': countryCode,
        'include-specifications': includeSpecifications.toString(),
        'include-image': includeImage.toString(),
        'include-offer': includeOffer.toString(),
        'include-rating': includeRating.toString(),
      });

      return this.mapProduct(response);
    } catch (error) {
      console.error(`Failed to get product ${ean}:`, error);
      return null;
    }
  }

  /**
   * Get product media (all images)
   */
  async getProductMedia(ean: string): Promise<BolProductMedia | null> {
    try {
      return await this.request<BolProductMedia>(`/products/${ean}/media`);
    } catch (error) {
      console.error(`Failed to get media for ${ean}:`, error);
      return null;
    }
  }

  /**
   * Get product rating details
   */
  async getProductRating(ean: string): Promise<BolProductRating | null> {
    try {
      return await this.request<BolProductRating>(`/products/${ean}/ratings`);
    } catch (error) {
      console.error(`Failed to get rating for ${ean}:`, error);
      return null;
    }
  }

  /**
   * Get popular products in a category
   */
  async getPopularProducts(
    categoryId?: string,
    options: {
      page?: number;
      pageSize?: number;
      countryCode?: 'NL' | 'BE';
    } = {}
  ): Promise<BolSearchResult> {
    const { page = 1, pageSize = 10, countryCode = 'NL' } = options;

    const params: Record<string, string> = {
      'page': page.toString(),
      'page-size': pageSize.toString(),
      'country-code': countryCode,
      'include-image': 'true',
      'include-offer': 'true',
      'include-rating': 'true',
    };

    if (categoryId) {
      params['category-id'] = categoryId;
    }

    const response = await this.request<any>('/products/lists/popular', params);

    return {
      totalResults: response.totalResults || 0,
      page: response.page || page,
      pageSize: response.pageSize || pageSize,
      products: (response.results || []).map(this.mapProduct),
    };
  }

  /**
   * Map API response to BolProduct
   */
  private mapProduct(data: any): BolProduct {
    return {
      ean: data.ean,
      bolProductId: data.bolProductId,
      title: data.title || '',
      description: data.description,
      url: data.url,
      image: data.image ? {
        url: data.image.url,
        width: data.image.width,
        height: data.image.height,
      } : undefined,
      rating: data.rating,
      offer: data.offer ? {
        price: data.offer.price,
        strikethroughPrice: data.offer.strikethroughPrice,
        deliveryDescription: data.offer.deliveryDescription,
      } : undefined,
      specifications: data.specificationGroups,
    };
  }
}

/**
 * Generate affiliate link for Bol.com product
 */
export function generateBolAffiliateLink(
  productUrl: string,
  siteCode: string,
  productName?: string
): string {
  const encodedUrl = encodeURIComponent(productUrl);
  const encodedName = encodeURIComponent(productName || 'Product');
  
  return `https://partner.bol.com/click/click?p=2&t=url&s=${siteCode}&f=TXL&url=${encodedUrl}&name=${encodedName}`;
}

/**
 * Create Bol.com client from project affiliates config
 */
export function createBolClientFromConfig(config: {
  clientId: string;
  clientSecret: string;
}): BolClient {
  return new BolClient({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  });
}

/**
 * Format price for display
 */
export function formatBolPrice(price: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency,
  }).format(price);
}

/**
 * Generate product card HTML for articles
 */
export function generateProductCardHTML(
  product: BolProduct,
  siteCode: string,
  options: {
    pros?: string[];
    cons?: string[];
    verdict?: string;
    rank?: number;
  } = {}
): string {
  const { pros = [], cons = [], verdict = '', rank } = options;
  const affiliateLink = generateBolAffiliateLink(product.url, siteCode, product.title);
  
  const priceDisplay = product.offer 
    ? formatBolPrice(product.offer.price)
    : 'Prijs niet beschikbaar';
  
  const originalPriceDisplay = product.offer?.strikethroughPrice
    ? `<span class="original-price">${formatBolPrice(product.offer.strikethroughPrice)}</span>`
    : '';

  const ratingStars = product.rating 
    ? '★'.repeat(Math.round(product.rating)) + '☆'.repeat(5 - Math.round(product.rating))
    : '';

  const prosHTML = pros.length > 0
    ? `<div class="product-pros">
        <h4>✅ Pluspunten</h4>
        <ul>${pros.map(p => `<li>${p}</li>`).join('')}</ul>
      </div>`
    : '';

  const consHTML = cons.length > 0
    ? `<div class="product-cons">
        <h4>❌ Minpunten</h4>
        <ul>${cons.map(c => `<li>${c}</li>`).join('')}</ul>
      </div>`
    : '';

  const verdictHTML = verdict
    ? `<div class="product-verdict">
        <h4>🏆 Ons oordeel</h4>
        <p>${verdict}</p>
      </div>`
    : '';

  const rankBadge = rank
    ? `<div class="product-rank">#${rank}</div>`
    : '';

  return `
<div class="bol-product-card" data-ean="${product.ean}">
  ${rankBadge}
  <div class="product-image">
    ${product.image ? `<img src="${product.image.url}" alt="${product.title}" loading="lazy" />` : ''}
  </div>
  <div class="product-info">
    <h3 class="product-title">${product.title}</h3>
    ${product.rating ? `<div class="product-rating">${ratingStars} (${product.rating.toFixed(1)})</div>` : ''}
    <div class="product-price">
      ${originalPriceDisplay}
      <span class="current-price">${priceDisplay}</span>
    </div>
    ${product.offer?.deliveryDescription ? `<div class="product-delivery">${product.offer.deliveryDescription}</div>` : ''}
    ${product.description ? `<p class="product-description">${product.description.slice(0, 200)}${product.description.length > 200 ? '...' : ''}</p>` : ''}
    ${prosHTML}
    ${consHTML}
    ${verdictHTML}
    <a href="${affiliateLink}" target="_blank" rel="noopener sponsored" class="product-cta">
      Bekijk op Bol.com →
    </a>
  </div>
</div>
`.trim();
}

/**
 * Generate CSS for product cards
 */
export const productCardCSS = `
.bol-product-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  margin: 1.5rem 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: box-shadow 0.2s;
}

.bol-product-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}

.product-rank {
  position: absolute;
  top: 12px;
  left: 12px;
  background: #0000a4;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
  padding: 8px 14px;
  border-radius: 8px;
  z-index: 1;
}

.product-image {
  width: 100%;
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f8f8;
  padding: 1rem;
}

.product-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.product-info {
  padding: 1.5rem;
}

.product-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #333;
}

.product-rating {
  color: #ffc107;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.product-price {
  margin: 0.75rem 0;
}

.original-price {
  text-decoration: line-through;
  color: #999;
  margin-right: 0.5rem;
}

.current-price {
  font-size: 1.5rem;
  font-weight: bold;
  color: #0000a4;
}

.product-delivery {
  font-size: 0.875rem;
  color: #28a745;
  margin-bottom: 0.75rem;
}

.product-description {
  font-size: 0.95rem;
  color: #666;
  line-height: 1.5;
  margin: 0.75rem 0;
}

.product-pros, .product-cons {
  margin: 1rem 0;
}

.product-pros h4, .product-cons h4, .product-verdict h4 {
  font-size: 1rem;
  margin: 0 0 0.5rem 0;
}

.product-pros ul, .product-cons ul {
  margin: 0;
  padding-left: 1.25rem;
}

.product-pros li {
  color: #28a745;
}

.product-cons li {
  color: #dc3545;
}

.product-verdict {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}

.product-cta {
  display: inline-block;
  background: #0000a4;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  margin-top: 1rem;
  transition: background 0.2s;
}

.product-cta:hover {
  background: #000080;
}

@media (min-width: 768px) {
  .bol-product-card {
    flex-direction: row;
  }
  
  .product-image {
    width: 300px;
    height: auto;
    min-height: 250px;
  }
  
  .product-info {
    flex: 1;
  }
}
`;
