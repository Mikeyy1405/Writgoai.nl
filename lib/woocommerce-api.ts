
/**
 * WooCommerce REST API Client
 * Supports WooCommerce REST API v3
 */

import crypto from 'crypto';

export interface WooCommerceConfig {
  url: string; // WordPress site URL
  username: string; // WordPress username
  password: string; // WordPress password of Application Password
  version?: string; // WooCommerce API versie (standaard: wc/v3)
}

export interface WooProduct {
  id?: number;
  name: string;
  type?: 'simple' | 'grouped' | 'external' | 'variable';
  status?: 'draft' | 'pending' | 'private' | 'publish';
  featured?: boolean;
  description?: string;
  short_description?: string;
  sku?: string;
  regular_price?: string;
  sale_price?: string;
  date_on_sale_from?: string;
  date_on_sale_to?: string;
  price?: string;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity?: number;
  manage_stock?: boolean;
  categories?: Array<{ id?: number; name?: string }>;
  tags?: Array<{ id?: number; name?: string }>;
  images?: Array<{ src: string; alt?: string }>;
  attributes?: Array<{
    id?: number;
    name: string;
    position?: number;
    visible?: boolean;
    variation?: boolean;
    options?: string[];
  }>;
  external_url?: string;
  button_text?: string;
  meta_data?: Array<{ key: string; value: any }>;
}

export interface WooProductListOptions {
  page?: number;
  per_page?: number;
  search?: string;
  after?: string;
  before?: string;
  exclude?: number[];
  include?: number[];
  offset?: number;
  order?: 'asc' | 'desc';
  orderby?: 'date' | 'id' | 'include' | 'title' | 'slug';
  parent?: number[];
  parent_exclude?: number[];
  slug?: string;
  status?: string;
  type?: string;
  sku?: string;
  featured?: boolean;
  category?: string;
  tag?: string;
  on_sale?: boolean;
  min_price?: string;
  max_price?: string;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
}

class WooCommerceAPIClient {
  private config: Required<WooCommerceConfig>;
  private baseUrl: string;
  private authHeader: string;

  constructor(config: WooCommerceConfig) {
    if (!config.username || !config.password) {
      throw new Error('WordPress username en password zijn verplicht voor WooCommerce API');
    }
    
    this.config = {
      url: config.url.replace(/\/$/, ''), // Remove trailing slash
      username: config.username,
      password: config.password,
      version: config.version || 'wc/v3',
    };
    
    // Maak Basic Auth header
    this.authHeader = 'Basic ' + Buffer.from(
      `${this.config.username}:${this.config.password}`
    ).toString('base64');
    
    this.baseUrl = `${this.config.url}/wp-json/${this.config.version}`;
  }

  /**
   * Make an authenticated request to WooCommerce API using Basic Auth
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const queryParams = params || {};

    // Voeg query parameters toe (filter out undefined/null values)
    const urlWithParams = new URL(url);
    Object.keys(queryParams).forEach((key) => {
      const value = queryParams[key];
      // Only add parameter if value is defined and not null
      if (value !== undefined && value !== null) {
        urlWithParams.searchParams.append(key, value.toString());
      }
    });

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WritgoAI/1.0',
        'Authorization': this.authHeader, // Basic Auth header
      },
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      console.log('🌐 WooCommerce API Request:', {
        method,
        endpoint,
        url: urlWithParams.toString(),
        auth: 'Basic Auth (WordPress credentials)',
      });

      const response = await fetch(urlWithParams.toString(), options);
      
      console.log('📡 WooCommerce API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'X-WP-Total': response.headers.get('X-WP-Total'),
          'X-WP-TotalPages': response.headers.get('X-WP-TotalPages'),
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ WooCommerce API Error Response:', errorText);
        
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText };
        }
        
        throw new Error(
          `WooCommerce API Error: ${response.status} - ${JSON.stringify(error)}`
        );
      }

      // Get total pages from headers
      const totalPages = response.headers.get('X-WP-TotalPages');
      const total = response.headers.get('X-WP-Total');

      const result = await response.json();
      
      console.log('✅ WooCommerce API Success:', {
        resultType: Array.isArray(result) ? 'array' : typeof result,
        count: Array.isArray(result) ? result.length : 'N/A',
        totalPages,
        total,
      });

      // Add pagination info if available and result is an array
      if ((totalPages || total) && Array.isArray(result)) {
        // Cast result to any to add _pagination property
        (result as any)._pagination = {
          totalPages: totalPages ? parseInt(totalPages) : undefined,
          total: total ? parseInt(total) : undefined,
          currentPage: parseInt(urlWithParams.searchParams.get('page') || '1'),
        };
      }

      return result;
    } catch (error: any) {
      console.error('❌ WooCommerce API Request Error:', error);
      throw new Error(`WooCommerce API request failed: ${error.message}`);
    }
  }

  /**
   * Get products from WooCommerce
   */
  async getProducts(options?: WooProductListOptions): Promise<WooProduct[]> {
    const params = options ? { ...options } : {};
    return this.request<WooProduct[]>('GET', '/products', undefined, params);
  }

  /**
   * Get a single product by ID
   */
  async getProduct(productId: number): Promise<WooProduct> {
    return this.request<WooProduct>('GET', `/products/${productId}`);
  }

  /**
   * Create a new product
   */
  async createProduct(product: WooProduct): Promise<WooProduct> {
    return this.request<WooProduct>('POST', '/products', product);
  }

  /**
   * Update a product
   */
  async updateProduct(productId: number, product: Partial<WooProduct>): Promise<WooProduct> {
    return this.request<WooProduct>('PUT', `/products/${productId}`, product);
  }

  /**
   * Delete a product
   */
  async deleteProduct(productId: number, force: boolean = false): Promise<WooProduct> {
    return this.request<WooProduct>(
      'DELETE',
      `/products/${productId}`,
      undefined,
      { force }
    );
  }

  /**
   * Batch create/update/delete products
   */
  async batchProducts(data: {
    create?: WooProduct[];
    update?: Partial<WooProduct>[];
    delete?: number[];
  }): Promise<{ create?: WooProduct[]; update?: WooProduct[]; delete?: WooProduct[] }> {
    return this.request('POST', '/products/batch', data);
  }

  /**
   * Get product categories
   */
  async getCategories(options?: {
    page?: number;
    per_page?: number;
    search?: string;
    exclude?: number[];
    include?: number[];
    order?: 'asc' | 'desc';
    orderby?: 'id' | 'include' | 'name' | 'slug' | 'term_group' | 'description' | 'count';
    hide_empty?: boolean;
    parent?: number;
    product?: number;
    slug?: string;
  }): Promise<Array<{
    id: number;
    name: string;
    slug: string;
    parent: number;
    description: string;
    display: string;
    image?: any;
    menu_order: number;
    count: number;
  }>> {
    const params = options ? { ...options } : {};
    return this.request('GET', '/products/categories', undefined, params);
  }

  /**
   * Create a new category
   */
  async createCategory(category: {
    name: string;
    slug?: string;
    parent?: number;
    description?: string;
    display?: string;
    image?: any;
    menu_order?: number;
  }): Promise<any> {
    return this.request('POST', '/products/categories', category);
  }

  /**
   * Test connection to WooCommerce
   */
  async testConnection(): Promise<{ success: boolean; message: string; storeInfo?: any }> {
    try {
      const systemStatus = await this.request<any>('GET', '/system_status');
      return {
        success: true,
        message: 'Successfully connected to WooCommerce',
        storeInfo: {
          name: systemStatus.settings?.general_settings?.site_title,
          url: systemStatus.settings?.general_settings?.site_url,
          wooVersion: systemStatus.settings?.woocommerce_version,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

/**
 * Create a WooCommerce API client instance
 */
export function createWooCommerceClient(config: WooCommerceConfig): WooCommerceAPIClient {
  return new WooCommerceAPIClient(config);
}

/**
 * Test WooCommerce connection
 */
export async function testWooCommerceConnection(
  config: WooCommerceConfig
): Promise<{ success: boolean; message: string; storeInfo?: any }> {
  const client = createWooCommerceClient(config);
  return client.testConnection();
}

/**
 * Get WooCommerce config from project
 */
export function getWooCommerceConfig(project: any): WooCommerceConfig | null {
  // Prefer project-level config, fallback to client-level
  const url = project.woocommerceUrl || project.wordpressUrl;
  const username = project.woocommerceUsername || project.wordpressUsername;
  const password = project.woocommercePassword || project.wordpressPassword;

  if (!url || !username || !password) {
    return null;
  }

  return {
    url,
    username,
    password,
  };
}

/**
 * Update WooCommerce product
 */
export async function updateWooCommerceProduct(
  config: WooCommerceConfig,
  productId: number,
  productData: Partial<WooProduct>
): Promise<any> {
  const client = createWooCommerceClient(config);
  return client.updateProduct(productId, productData);
}
