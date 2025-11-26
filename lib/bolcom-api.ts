
/**
 * Bol.com Marketing Catalog API Integration
 * OAuth2 authenticatie + Product zoeken + Affiliate links
 */

interface BolcomCredentials {
  clientId: string;
  clientSecret: string;
  affiliateId?: string;
}

interface BolcomTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // Seconds (299 = ~5 minutes)
  scope: string;
}

interface BolcomProduct {
  ean: string;
  bolProductId: number;
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
  gpc?: Array<{ id: number; name: string; level: number }>;
  specificationGroups?: Array<{
    name: string;
    specifications: Array<{ name: string; value: string }>;
  }>;
}

interface BolcomSearchResult {
  totalResults: number;
  totalPages: number;
  page: number;
  resultsPerPage: number;
  results: BolcomProduct[];
}

interface BolcomOffer {
  ean: string;
  countryCode: string;
  condition: string;
  price: number;
  strikethroughPrice?: number;
  deliveryDescription: string;
  url: string;
  seller: {
    name: string;
  };
}

interface BolcomMediaResponse {
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

interface BolcomRating {
  ean: string;
  averageRating: number;
  ratings: Array<{
    stars: number;
    count: number;
  }>;
}

interface BolcomCategory {
  id: number;
  name: string;
  parentId?: number;
  level: number;
}

interface BolcomCategoriesResponse {
  ean: string;
  categories: BolcomCategory[];
}

interface BolcomProductDetails extends BolcomProduct {
  categories?: BolcomCategory[];
  specifications?: Array<{
    name: string;
    specifications: Array<{ name: string; value: string }>;
  }>;
  images?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  bestOffer?: BolcomOffer;
  rating?: number;
  affiliateLink?: string;
}

// Token cache (in-memory, 5 minute TTL)
let tokenCache: {
  token: string;
  expiresAt: number;
  clientId: string;
} | null = null;

/**
 * Get OAuth2 access token
 */
async function getAccessToken(credentials: BolcomCredentials): Promise<string> {
  // Check cache first
  if (
    tokenCache &&
    tokenCache.clientId === credentials.clientId &&
    tokenCache.expiresAt > Date.now()
  ) {
    return tokenCache.token;
  }

  try {
    // Basic auth: base64(clientId:clientSecret)
    const authString = Buffer.from(
      `${credentials.clientId}:${credentials.clientSecret}`
    ).toString('base64');

    const response = await fetch(
      'https://login.bol.com/token?grant_type=client_credentials',
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bol.com OAuth error (${response.status}): ${errorText}`);
    }

    const data: BolcomTokenResponse = await response.json();

    // Cache token (expires_in = 299 seconds, cache for 4 minutes to be safe)
    tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
      clientId: credentials.clientId,
    };

    return data.access_token;
  } catch (error) {
    console.error('Bol.com OAuth error:', error);
    throw new Error(
      `Failed to get Bol.com access token: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Make authenticated API request
 */
async function bolcomApiRequest<T>(
  endpoint: string,
  credentials: BolcomCredentials,
  options: {
    method?: string;
    params?: Record<string, string | number | boolean>;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const token = await getAccessToken(credentials);

  // Build URL with query params
  const url = new URL(`https://api.bol.com/marketing/catalog/v1${endpoint}`);
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  const response = await fetch(url.toString(), {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Accept-Language': 'nl',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bol.com API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Search for products
 */
export async function searchBolcomProducts(
  searchTerm: string,
  credentials: BolcomCredentials,
  options: {
    page?: number;
    resultsPerPage?: number;
    categoryId?: string;
    sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating';
    countryCode?: 'NL' | 'BE';
  } = {}
): Promise<BolcomSearchResult> {
  try {
    const params: Record<string, string | number> = {
      'search-term': searchTerm,
      'country-code': options.countryCode || 'NL',
    };

    if (options.page) params.page = options.page;
    if (options.resultsPerPage) params['results-per-page'] = options.resultsPerPage;
    if (options.categoryId) params['category-id'] = options.categoryId;
    if (options.sortBy) params['sort-by'] = options.sortBy;

    const result = await bolcomApiRequest<BolcomSearchResult>(
      '/products/search',
      credentials,
      { params }
    );

    return result;
  } catch (error) {
    console.error('Bol.com search error:', error);
    throw error;
  }
}

/**
 * Get product details by EAN
 */
export async function getBolcomProduct(
  ean: string,
  credentials: BolcomCredentials,
  options: {
    countryCode?: 'NL' | 'BE';
    includeOffer?: boolean;
    includeRating?: boolean;
    includeMedia?: boolean;
  } = {}
): Promise<BolcomProduct> {
  try {
    const params: Record<string, string> = {
      'country-code': options.countryCode || 'NL',
    };

    // Add include parameters
    const includes: string[] = [];
    if (options.includeOffer) includes.push('offer');
    if (options.includeRating) includes.push('rating');
    if (options.includeMedia) includes.push('media');
    if (includes.length > 0) {
      params.include = includes.join(',');
    }

    const product = await bolcomApiRequest<BolcomProduct>(
      `/products/${ean}`,
      credentials,
      { params }
    );

    return product;
  } catch (error) {
    console.error('Bol.com get product error:', error);
    throw error;
  }
}

/**
 * Get best offer for product
 */
export async function getBolcomOffer(
  ean: string,
  credentials: BolcomCredentials,
  countryCode: 'NL' | 'BE' = 'NL'
): Promise<BolcomOffer> {
  try {
    const offer = await bolcomApiRequest<BolcomOffer>(
      `/products/${ean}/offers/best`,
      credentials,
      {
        params: { 'country-code': countryCode },
      }
    );

    return offer;
  } catch (error) {
    console.error('Bol.com get offer error:', error);
    throw error;
  }
}

/**
 * Get product images
 */
export async function getBolcomMedia(
  ean: string,
  credentials: BolcomCredentials
): Promise<BolcomMediaResponse> {
  try {
    const endpoint = `/products/${ean}/media`;
    console.log('📡 Requesting media for EAN:', ean);
    console.log('📡 API endpoint:', endpoint);
    
    const media = await bolcomApiRequest<BolcomMediaResponse>(
      endpoint,
      credentials
    );

    console.log('✅ Media response for EAN', ean, ':', JSON.stringify(media, null, 2));
    
    return media;
  } catch (error: any) {
    console.error('❌ Bol.com get media error for EAN', ean, ':', {
      message: error.message,
      status: error.status,
      response: error.response,
      fullError: JSON.stringify(error, null, 2)
    });
    throw error;
  }
}

/**
 * Get product ratings
 */
export async function getBolcomRating(
  ean: string,
  credentials: BolcomCredentials
): Promise<BolcomRating> {
  try {
    const rating = await bolcomApiRequest<BolcomRating>(
      `/products/${ean}/ratings`,
      credentials
    );

    return rating;
  } catch (error) {
    console.error('Bol.com get rating error:', error);
    throw error;
  }
}

/**
 * Get product categories
 */
export async function getBolcomCategories(
  ean: string,
  credentials: BolcomCredentials
): Promise<BolcomCategoriesResponse> {
  try {
    const categories = await bolcomApiRequest<BolcomCategoriesResponse>(
      `/products/${ean}/categories`,
      credentials,
      {
        headers: {
          'Accept-Language': 'nl',
        },
      }
    );

    return categories;
  } catch (error) {
    console.error('Bol.com get categories error:', error);
    throw error;
  }
}

/**
 * Filter high-resolution images (>= 800px width)
 */
export function filterHighResolutionImages(
  media: BolcomMediaResponse,
  minWidth: number = 800
): Array<{ url: string; width: number; height: number }> {
  const highResImages: Array<{ url: string; width: number; height: number }> = [];

  if (media.images && media.images.length > 0) {
    media.images.forEach((image) => {
      if (image.renditions && image.renditions.length > 0) {
        // Filter renditions >= minWidth and sort by width descending
        const sortedRenditions = image.renditions
          .filter((r) => r.width >= minWidth)
          .sort((a, b) => b.width - a.width);

        if (sortedRenditions.length > 0) {
          // Take the highest resolution
          highResImages.push(sortedRenditions[0]);
        }
      }
    });
  }

  return highResImages;
}

/**
 * Get complete product details with all information
 */
export async function getBolcomProductDetails(
  ean: string,
  credentials: BolcomCredentials,
  countryCode: 'NL' | 'BE' = 'NL'
): Promise<BolcomProductDetails> {
  try {
    console.log(`📦 Ophalen volledige productinformatie voor EAN: ${ean}`);

    // Fetch all product data in parallel
    const [product, media, offer, categories] = await Promise.all([
      getBolcomProduct(ean, credentials, {
        countryCode,
        includeOffer: true,
        includeRating: true,
        includeMedia: true,
      }),
      getBolcomMedia(ean, credentials).catch((error) => {
        console.error(`❌ Media API fout voor ${ean}:`, error.message);
        return null;
      }),
      getBolcomOffer(ean, credentials, countryCode).catch((error) => {
        console.error(`❌ Offer API fout voor ${ean}:`, error.message);
        return null;
      }),
      getBolcomCategories(ean, credentials).catch((error) => {
        console.error(`❌ Categories API fout voor ${ean}:`, error.message);
        return null;
      }),
    ]);

    // Filter high-resolution images from media API
    let highResImages = media ? filterHighResolutionImages(media) : [];
    
    console.log(`🖼️ Afbeeldingen voor ${product.title}:`, {
      mediaImages: media?.images?.length || 0,
      highResImages: highResImages.length,
      productImage: !!product.image,
    });
    
    // Als media API geen images geeft, gebruik dan product.image
    if (highResImages.length === 0 && product.image) {
      console.log(`ℹ️ Gebruik product.image als fallback voor ${product.title}`);
      highResImages = [product.image];
    }

    // Generate affiliate link
    const affiliateLink = generateBolcomAffiliateLink(
      product.url,
      credentials.affiliateId,
      product.title
    );

    const details: BolcomProductDetails = {
      ...product,
      categories: categories?.categories || [],
      images: highResImages,
      bestOffer: offer || undefined,
      affiliateLink,
    };

    console.log(`✅ Productinformatie opgehaald:`, {
      title: details.title,
      price: details.bestOffer?.price || details.offer?.price || 'N/A',
      inStock: !!(details.bestOffer?.price || details.offer?.price),
      categories: details.categories?.map(c => c.name).join(' > ') || 'N/A',
      images: details.images?.length || 0,
    });

    return details;
  } catch (error) {
    console.error('Bol.com get product details error:', error);
    throw error;
  }
}

/**
 * Get popular products in category
 */
export async function getBolcomPopularProducts(
  credentials: BolcomCredentials,
  options: {
    categoryId?: string;
    page?: number;
    resultsPerPage?: number;
    countryCode?: 'NL' | 'BE';
  } = {}
): Promise<BolcomSearchResult> {
  try {
    const params: Record<string, string | number> = {
      'country-code': options.countryCode || 'NL',
    };

    if (options.categoryId) params['category-id'] = options.categoryId;
    if (options.page) params.page = options.page;
    if (options.resultsPerPage) params['results-per-page'] = options.resultsPerPage;

    const result = await bolcomApiRequest<BolcomSearchResult>(
      '/products/lists/popular',
      credentials,
      { params }
    );

    return result;
  } catch (error) {
    console.error('Bol.com get popular products error:', error);
    throw error;
  }
}

/**
 * Generate affiliate link via Bol.com Partner tracking system
 * Format: https://partner.bol.com/click/click?p=2&t=url&s={siteId}&f=TXL&url={encodedUrl}&name={productName}
 */
export function generateBolcomAffiliateLink(
  productUrl: string,
  affiliateId?: string,
  productName?: string
): string {
  if (!affiliateId) {
    return productUrl;
  }

  // Build partner tracking URL
  const baseUrl = 'https://partner.bol.com/click/click';
  const params = new URLSearchParams({
    p: '2',
    t: 'url',
    s: affiliateId, // Site/Partner ID
    f: 'TXL',
    url: productUrl, // Original product URL (will be automatically encoded)
  });

  // Add product name if provided (for tracking/reporting)
  if (productName) {
    // Truncate product name to reasonable length
    const truncatedName = productName.length > 100 
      ? productName.substring(0, 97) + '...' 
      : productName;
    params.append('name', truncatedName);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Convert Bol Product ID to EAN
 */
export async function convertBolProductIdToEan(
  bolProductId: number,
  credentials: BolcomCredentials
): Promise<{ ean: string }> {
  try {
    const result = await bolcomApiRequest<{ ean: string }>(
      `/products/${bolProductId}/to-ean`,
      credentials
    );

    return result;
  } catch (error) {
    console.error('Bol.com convert ID to EAN error:', error);
    throw error;
  }
}

/**
 * Test Bol.com credentials
 */
export async function testBolcomCredentials(
  credentials: BolcomCredentials
): Promise<boolean> {
  try {
    // Try to search for a common product to test the connection
    await searchBolcomProducts('laptop', credentials, {
      resultsPerPage: 1,
    });
    return true;
  } catch (error) {
    console.error('Bol.com credentials test failed:', error);
    return false;
  }
}

// Export types
export type {
  BolcomCredentials,
  BolcomProduct,
  BolcomSearchResult,
  BolcomOffer,
  BolcomMediaResponse,
  BolcomRating,
  BolcomCategory,
  BolcomCategoriesResponse,
  BolcomProductDetails,
};
