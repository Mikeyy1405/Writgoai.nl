/**
 * WordPress and WooCommerce REST API Endpoints Configuration
 * 
 * This module provides centralized endpoint definitions and helper functions
 * for WordPress and WooCommerce REST API integration.
 */

/**
 * WordPress REST API Endpoints
 */
export const WORDPRESS_ENDPOINTS = {
  base: '/wp-json',
  wp: {
    base: '/wp-json/wp/v2',
    posts: '/wp-json/wp/v2/posts',
    pages: '/wp-json/wp/v2/pages',
    categories: '/wp-json/wp/v2/categories',
    tags: '/wp-json/wp/v2/tags',
    media: '/wp-json/wp/v2/media',
    users: '/wp-json/wp/v2/users',
  },
  woocommerce: {
    base: '/wp-json/wc/v3',
    products: '/wp-json/wc/v3/products',
    productCategories: '/wp-json/wc/v3/products/categories',
    productTags: '/wp-json/wc/v3/products/tags',
  },
} as const;

/**
 * Get full WordPress endpoint URL
 * @param baseUrl - Base WordPress site URL (e.g., "https://example.com")
 * @param endpoint - Endpoint path from WORDPRESS_ENDPOINTS
 * @returns Full endpoint URL
 */
export function getWordPressEndpoint(baseUrl: string, endpoint: string): string {
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  return `${cleanBaseUrl}${endpoint}`;
}

/**
 * Get WordPress posts endpoint with optional ID
 * @param baseUrl - Base WordPress site URL
 * @param postId - Optional post ID for single post
 * @returns Posts endpoint URL
 */
export function getPostsEndpoint(baseUrl: string, postId?: number): string {
  const base = getWordPressEndpoint(baseUrl, WORDPRESS_ENDPOINTS.wp.posts);
  return postId ? `${base}/${postId}` : base;
}

/**
 * Get WordPress pages endpoint with optional ID
 * @param baseUrl - Base WordPress site URL
 * @param pageId - Optional page ID for single page
 * @returns Pages endpoint URL
 */
export function getPagesEndpoint(baseUrl: string, pageId?: number): string {
  const base = getWordPressEndpoint(baseUrl, WORDPRESS_ENDPOINTS.wp.pages);
  return pageId ? `${base}/${pageId}` : base;
}

/**
 * Get WordPress categories endpoint with optional ID
 * @param baseUrl - Base WordPress site URL
 * @param categoryId - Optional category ID
 * @returns Categories endpoint URL
 */
export function getCategoriesEndpoint(baseUrl: string, categoryId?: number): string {
  const base = getWordPressEndpoint(baseUrl, WORDPRESS_ENDPOINTS.wp.categories);
  return categoryId ? `${base}/${categoryId}` : base;
}

/**
 * Get WordPress tags endpoint with optional ID
 * @param baseUrl - Base WordPress site URL
 * @param tagId - Optional tag ID
 * @returns Tags endpoint URL
 */
export function getTagsEndpoint(baseUrl: string, tagId?: number): string {
  const base = getWordPressEndpoint(baseUrl, WORDPRESS_ENDPOINTS.wp.tags);
  return tagId ? `${base}/${tagId}` : base;
}

/**
 * Get WordPress media endpoint with optional ID
 * @param baseUrl - Base WordPress site URL
 * @param mediaId - Optional media ID
 * @returns Media endpoint URL
 */
export function getMediaEndpoint(baseUrl: string, mediaId?: number): string {
  const base = getWordPressEndpoint(baseUrl, WORDPRESS_ENDPOINTS.wp.media);
  return mediaId ? `${base}/${mediaId}` : base;
}

/**
 * Get WooCommerce products endpoint with optional ID
 * @param baseUrl - Base WordPress site URL
 * @param productId - Optional product ID
 * @returns Products endpoint URL
 */
export function getProductsEndpoint(baseUrl: string, productId?: number): string {
  const base = getWordPressEndpoint(baseUrl, WORDPRESS_ENDPOINTS.woocommerce.products);
  return productId ? `${base}/${productId}` : base;
}

/**
 * Get WooCommerce product categories endpoint with optional ID
 * @param baseUrl - Base WordPress site URL
 * @param categoryId - Optional category ID
 * @returns Product categories endpoint URL
 */
export function getProductCategoriesEndpoint(baseUrl: string, categoryId?: number): string {
  const base = getWordPressEndpoint(baseUrl, WORDPRESS_ENDPOINTS.woocommerce.productCategories);
  return categoryId ? `${base}/${categoryId}` : base;
}

/**
 * Get WooCommerce product tags endpoint with optional ID
 * @param baseUrl - Base WordPress site URL
 * @param tagId - Optional tag ID
 * @returns Product tags endpoint URL
 */
export function getProductTagsEndpoint(baseUrl: string, tagId?: number): string {
  const base = getWordPressEndpoint(baseUrl, WORDPRESS_ENDPOINTS.woocommerce.productTags);
  return tagId ? `${base}/${tagId}` : base;
}

/**
 * WordPress query parameters for posts/pages
 */
export interface WordPressQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  categories?: number[];
  tags?: number[];
  status?: 'publish' | 'draft' | 'pending' | 'private' | 'future';
  orderby?: 'date' | 'modified' | 'title' | 'author' | 'id' | 'slug';
  order?: 'asc' | 'desc';
  author?: number;
  _embed?: boolean;
}

/**
 * Build query string from WordPress query parameters
 * @param params - Query parameters object
 * @returns URL query string (without leading ?)
 */
export function buildWordPressQuery(params: WordPressQueryParams): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // For arrays, join with comma (WordPress accepts this format)
        searchParams.append(key, value.join(','));
      } else if (typeof value === 'boolean') {
        // For booleans, convert to 1 or 0 (or 'true'/'false' for _embed)
        if (key === '_embed') {
          searchParams.append(key, value ? 'true' : 'false');
        } else {
          searchParams.append(key, value ? '1' : '0');
        }
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  return searchParams.toString();
}

/**
 * Build full WordPress endpoint URL with query parameters
 * @param baseUrl - Base WordPress site URL
 * @param endpoint - Endpoint path
 * @param params - Optional query parameters
 * @returns Full URL with query string
 */
export function buildWordPressUrl(
  baseUrl: string,
  endpoint: string,
  params?: WordPressQueryParams
): string {
  const url = getWordPressEndpoint(baseUrl, endpoint);
  if (!params || Object.keys(params).length === 0) {
    return url;
  }
  const queryString = buildWordPressQuery(params);
  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Helper to build WordPress authentication header
 * @param username - WordPress username
 * @param password - WordPress application password
 * @returns Basic auth header value
 */
export function buildAuthHeader(username: string, password: string): string {
  // Remove any whitespace from password (WordPress app passwords often have spaces)
  const cleanPassword = password.replace(/\s+/g, '');
  return 'Basic ' + Buffer.from(`${username}:${cleanPassword}`).toString('base64');
}

/**
 * Standard User-Agent header for WordPress API requests
 * Uses a browser-like User-Agent to avoid being blocked by security plugins
 */
export const WORDPRESS_USER_AGENT = 'Mozilla/5.0 (compatible; WritGoBot/1.0; +https://writgo.nl)';
