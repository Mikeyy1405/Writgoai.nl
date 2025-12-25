/**
 * WordPress Plugin Client
 *
 * Client for communicating with Writgo Connector WordPress plugin.
 * This provides 100% reliability by using custom API endpoints
 * instead of standard WordPress REST API.
 *
 * Benefits over REST API:
 * - No IP blocking issues
 * - Works with all hosting providers
 * - Automatic Wordfence whitelisting
 * - Real-time webhooks
 * - Simpler authentication (API key vs Application Password)
 */

export interface PluginConnectionConfig {
  apiEndpoint: string; // e.g., https://site.nl/wp-json/writgo/v1/
  apiKey: string;
  timeout?: number;
}

export interface PluginPost {
  id?: number;
  title: string;
  content: string;
  excerpt?: string;
  status?: 'draft' | 'publish' | 'pending';
  categories?: number[];
  featured_image_url?: string;
  seo_title?: string;
  seo_description?: string;
  focus_keyword?: string;
}

export interface PluginCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface PluginConnectionTest {
  success: boolean;
  message: string;
  wordpress_version?: string;
  site_url?: string;
  plugin_version?: string;
  error?: string;
}

/**
 * WordPress Plugin Client
 */
export class WordPressPluginClient {

  private config: Required<PluginConnectionConfig>;

  constructor(config: PluginConnectionConfig) {
    this.config = {
      apiEndpoint: config.apiEndpoint.replace(/\/$/, ''), // Remove trailing slash
      apiKey: config.apiKey,
      timeout: config.timeout || 120000, // 2 minutes default
    };
  }

  /**
   * Make API request to plugin
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.apiEndpoint}${endpoint}`;

    console.log(`[PLUGIN] ${options.method || 'GET'} ${endpoint}`);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Writgo-API-Key': this.config.apiKey,
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Plugin API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Test connection to WordPress plugin
   */
  async testConnection(): Promise<PluginConnectionTest> {
    try {
      const result = await this.request<any>('/test');
      return {
        success: true,
        message: result.message || 'Connection successful',
        wordpress_version: result.wordpress_version,
        site_url: result.site_url,
        plugin_version: result.plugin_version,
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Connection failed',
        error: error.message,
      };
    }
  }

  /**
   * Health check (no auth required)
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const url = `${this.config.apiEndpoint}/health`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });
    return response.json();
  }

  /**
   * Get posts
   */
  async getPosts(params?: {
    page?: number;
    per_page?: number;
  }): Promise<{
    posts: PluginPost[];
    total: number;
    pages: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.per_page) queryParams.set('per_page', params.per_page.toString());

    const query = queryParams.toString();
    const endpoint = query ? `/posts?${query}` : '/posts';

    return this.request(endpoint);
  }

  /**
   * Get single post
   */
  async getPost(postId: number): Promise<PluginPost> {
    return this.request(`/posts/${postId}`);
  }

  /**
   * Create post
   */
  async createPost(post: PluginPost): Promise<PluginPost> {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  }

  /**
   * Update post
   */
  async updatePost(postId: number, post: Partial<PluginPost>): Promise<PluginPost> {
    return this.request(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(post),
    });
  }

  /**
   * Get categories
   */
  async getCategories(): Promise<PluginCategory[]> {
    return this.request('/categories');
  }

  /**
   * Publish article to WordPress
   *
   * Simplified version of publishToWordPress that uses plugin
   */
  async publishArticle(article: {
    title: string;
    content: string;
    excerpt?: string;
    status?: 'draft' | 'publish';
    categories?: number[];
    featured_image_url?: string;
    seo_title?: string;
    seo_description?: string;
    focus_keyword?: string;
  }): Promise<{
    success: boolean;
    post_id?: number;
    post_url?: string;
    error?: string;
  }> {
    try {
      const post = await this.createPost({
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        status: article.status || 'publish',
        categories: article.categories,
        featured_image_url: article.featured_image_url,
        seo_title: article.seo_title,
        seo_description: article.seo_description,
        focus_keyword: article.focus_keyword,
      });

      return {
        success: true,
        post_id: post.id,
        post_url: (post as any).url,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

/**
 * Helper: Create client from project WordPress settings
 */
export function createPluginClient(project: {
  wp_plugin_endpoint?: string | null;
  wp_plugin_api_key?: string | null;
}): WordPressPluginClient | null {

  if (!project.wp_plugin_endpoint || !project.wp_plugin_api_key) {
    return null;
  }

  return new WordPressPluginClient({
    apiEndpoint: project.wp_plugin_endpoint,
    apiKey: project.wp_plugin_api_key,
  });
}

/**
 * Detect if project uses plugin or REST API
 */
export function usesPlugin(project: {
  wp_plugin_endpoint?: string | null;
  wp_plugin_api_key?: string | null;
}): boolean {
  return !!(project.wp_plugin_endpoint && project.wp_plugin_api_key);
}

/**
 * Test connection to WordPress (plugin or REST API)
 *
 * Automatically detects which method to use
 */
export async function testWordPressConnection(project: {
  wp_url?: string | null;
  wp_username?: string | null;
  wp_app_password?: string | null;
  wp_plugin_endpoint?: string | null;
  wp_plugin_api_key?: string | null;
}): Promise<PluginConnectionTest> {

  // Try plugin first if configured
  if (usesPlugin(project)) {
    const client = createPluginClient(project);
    if (client) {
      console.log('[WP] Testing connection via Writgo Connector plugin...');
      return await client.testConnection();
    }
  }

  // Fallback to REST API (existing implementation)
  console.log('[WP] Testing connection via WordPress REST API...');

  // TODO: Call existing REST API test function
  // For now, return not configured
  return {
    success: false,
    message: 'WordPress not configured',
    error: 'Please configure either Writgo Connector plugin or REST API credentials',
  };
}

/**
 * Sync posts from WordPress (plugin or REST API)
 */
export async function syncWordPressPosts(
  project: {
    wp_url?: string | null;
    wp_username?: string | null;
    wp_app_password?: string | null;
    wp_plugin_endpoint?: string | null;
    wp_plugin_api_key?: string | null;
  },
  options?: {
    page?: number;
    per_page?: number;
  }
): Promise<{
  posts: any[];
  total: number;
  pages: number;
}> {

  // Use plugin if configured
  if (usesPlugin(project)) {
    const client = createPluginClient(project);
    if (client) {
      console.log('[WP] Syncing posts via plugin...');
      return await client.getPosts(options);
    }
  }

  // Fallback to REST API
  console.log('[WP] Syncing posts via REST API...');
  // TODO: Call existing REST API sync function
  throw new Error('REST API sync not implemented in this context');
}
