/**
 * Simple WordPress REST API Client
 *
 * Eenvoudige en betrouwbare WordPress integratie
 */

// Types
export interface WordPressCredentials {
  url: string;
  username: string;
  password: string;
}

export interface WordPressPost {
  title: string;
  content: string;
  status?: 'draft' | 'publish' | 'pending';
  categories?: number[];
  tags?: number[];
  featured_media?: number;
}

export interface WordPressPage {
  title: string;
  content: string;
  status?: 'draft' | 'publish';
  parent?: number;
}

export interface WordPressProduct {
  name: string;
  description: string;
  regular_price: string;
  status?: 'draft' | 'publish';
}

export interface WordPressTestResult {
  success: boolean;
  message: string;
  details?: {
    siteReachable: boolean;
    apiAvailable: boolean;
    authenticated: boolean;
  };
}

// WordPress Client Class
export class WordPressClient {
  private baseUrl: string;
  private authHeader: string;
  private timeout: number;

  constructor(credentials: WordPressCredentials, timeout: number = 30000) {
    // Normaliseer URL (verwijder trailing slash en /wp-json)
    this.baseUrl = credentials.url.replace(/\/$/, '').replace(/\/wp-json.*$/, '');

    // Maak Basic Auth header
    const cleanPassword = credentials.password.replace(/\s+/g, '');
    this.authHeader = 'Basic ' + Buffer.from(`${credentials.username}:${cleanPassword}`).toString('base64');

    this.timeout = timeout;
  }

  /**
   * Maak een request naar WordPress REST API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries: number = 2
  ): Promise<T> {
    const url = `${this.baseUrl}/wp-json${endpoint}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.authHeader,
            'User-Agent': 'Mozilla/5.0 (compatible; WritgoAI/1.0)',
            ...options.headers,
          },
          signal: AbortSignal.timeout(this.timeout),
        });

        if (!response.ok) {
          const error = await this.parseError(response);
          throw new Error(error);
        }

        return await response.json();
      } catch (error: any) {
        // Retry alleen bij timeout of network errors
        const shouldRetry = attempt < retries && (
          error.name === 'AbortError' ||
          error.code === 'ETIMEDOUT' ||
          error.code === 'ECONNRESET'
        );

        if (shouldRetry) {
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
          continue;
        }

        throw this.createFriendlyError(error);
      }
    }

    throw new Error('Alle pogingen zijn mislukt');
  }

  /**
   * Parse WordPress error response
   */
  private async parseError(response: Response): Promise<string> {
    try {
      const data = await response.json();
      if (data.message) return data.message;
      if (data.code) return `WordPress fout: ${data.code}`;
    } catch {
      // Niet een JSON response
    }

    // Fallback naar HTTP status
    switch (response.status) {
      case 401:
        return 'Authenticatie mislukt. Controleer gebruikersnaam en app password.';
      case 403:
        return 'Toegang geweigerd. Gebruiker heeft onvoldoende rechten.';
      case 404:
        return 'Endpoint niet gevonden. Controleer of WordPress REST API actief is.';
      case 500:
        return 'WordPress server error. Neem contact op met je hosting provider.';
      default:
        return `HTTP ${response.status}: ${response.statusText}`;
    }
  }

  /**
   * Maak gebruiksvriendelijke foutmelding
   */
  private createFriendlyError(error: any): Error {
    if (error.name === 'AbortError') {
      return new Error('Timeout: WordPress server reageert te langzaam.');
    }

    if (error.code === 'ENOTFOUND') {
      return new Error('WordPress site niet gevonden. Controleer de URL.');
    }

    if (error.code === 'ECONNREFUSED') {
      return new Error('Verbinding geweigerd. WordPress site is mogelijk offline.');
    }

    return error;
  }

  /**
   * Test WordPress connectie
   */
  async testConnection(): Promise<WordPressTestResult> {
    const result: WordPressTestResult = {
      success: false,
      message: '',
      details: {
        siteReachable: false,
        apiAvailable: false,
        authenticated: false,
      },
    };

    try {
      // Test 1: Site bereikbaar
      const siteResponse = await fetch(this.baseUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
      });
      result.details!.siteReachable = siteResponse.ok;

      // Test 2: REST API beschikbaar
      const apiResponse = await fetch(`${this.baseUrl}/wp-json`, {
        signal: AbortSignal.timeout(10000),
      });
      const apiData = await apiResponse.json();
      result.details!.apiAvailable = apiData.namespaces?.includes('wp/v2') || false;

      // Test 3: Authenticatie geldig
      const authResponse = await fetch(`${this.baseUrl}/wp-json/wp/v2/users/me`, {
        headers: {
          'Authorization': this.authHeader,
        },
        signal: AbortSignal.timeout(10000),
      });
      result.details!.authenticated = authResponse.ok;

      // Bepaal overall success
      result.success =
        result.details!.siteReachable &&
        result.details!.apiAvailable &&
        result.details!.authenticated;

      result.message = result.success
        ? 'WordPress connectie succesvol'
        : 'WordPress connectie mislukt';

      return result;
    } catch (error: any) {
      result.message = this.createFriendlyError(error).message;
      return result;
    }
  }

  /**
   * Haal posts op
   */
  async getPosts(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.per_page) queryParams.set('per_page', params.per_page.toString());
    if (params?.search) queryParams.set('search', params.search);
    if (params?.status) queryParams.set('status', params.status);

    const query = queryParams.toString();
    const endpoint = `/wp/v2/posts${query ? `?${query}` : ''}`;

    return this.request<any[]>(endpoint);
  }

  /**
   * Haal één post op
   */
  async getPost(id: number): Promise<any> {
    return this.request<any>(`/wp/v2/posts/${id}`);
  }

  /**
   * Maak een nieuwe post
   */
  async createPost(post: WordPressPost): Promise<any> {
    return this.request<any>('/wp/v2/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  }

  /**
   * Update een post
   */
  async updatePost(id: number, post: Partial<WordPressPost>): Promise<any> {
    return this.request<any>(`/wp/v2/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(post),
    });
  }

  /**
   * Verwijder een post
   */
  async deletePost(id: number): Promise<any> {
    return this.request<any>(`/wp/v2/posts/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Haal pages op
   */
  async getPages(params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.per_page) queryParams.set('per_page', params.per_page.toString());
    if (params?.search) queryParams.set('search', params.search);

    const query = queryParams.toString();
    const endpoint = `/wp/v2/pages${query ? `?${query}` : ''}`;

    return this.request<any[]>(endpoint);
  }

  /**
   * Maak een nieuwe page
   */
  async createPage(page: WordPressPage): Promise<any> {
    return this.request<any>('/wp/v2/pages', {
      method: 'POST',
      body: JSON.stringify(page),
    });
  }

  /**
   * Haal WooCommerce products op
   */
  async getProducts(params?: {
    page?: number;
    per_page?: number;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.per_page) queryParams.set('per_page', params.per_page.toString());

    const query = queryParams.toString();
    const endpoint = `/wc/v3/products${query ? `?${query}` : ''}`;

    return this.request<any[]>(endpoint);
  }

  /**
   * Maak een WooCommerce product
   */
  async createProduct(product: WordPressProduct): Promise<any> {
    return this.request<any>('/wc/v3/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  /**
   * Upload media/afbeelding
   */
  async uploadMedia(imageUrl: string, filename: string): Promise<any> {
    // Download de afbeelding
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Kon afbeelding niet downloaden');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Upload naar WordPress
    const url = `${this.baseUrl}/wp-json/wp/v2/media`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
      body: imageBuffer,
      signal: AbortSignal.timeout(60000), // 60s voor uploads
    });

    if (!response.ok) {
      const error = await this.parseError(response);
      throw new Error(error);
    }

    return response.json();
  }

  /**
   * Haal categorieën op
   */
  async getCategories(): Promise<any[]> {
    return this.request<any[]>('/wp/v2/categories');
  }

  /**
   * Haal tags op
   */
  async getTags(): Promise<any[]> {
    return this.request<any[]>('/wp/v2/tags');
  }
}

/**
 * Helper functie: maak WordPress client van project credentials
 */
export function createWordPressClient(credentials: WordPressCredentials): WordPressClient {
  return new WordPressClient(credentials);
}
