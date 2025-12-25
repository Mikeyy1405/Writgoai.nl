/**
 * WordPress Proxy Client
 *
 * Routes WordPress API requests through a central proxy server
 * to avoid IP blocking issues with hosting providers.
 *
 * Environment variables:
 * - WP_PROXY_ENABLED: Set to 'true' to enable proxy
 * - WP_PROXY_URL: URL of proxy server (e.g., https://wp-proxy.jouwdomein.nl)
 */

interface ProxyResponse<T = any> {
  data?: T;
  error?: string;
  cached?: boolean;
  responseTime?: number;
}

interface ProxyConfig {
  enabled: boolean;
  url: string;
  timeout: number;
  retries: number;
}

// Proxy configuration from environment
const PROXY_CONFIG: ProxyConfig = {
  enabled: process.env.WP_PROXY_ENABLED === 'true',
  url: process.env.WP_PROXY_URL || '',
  timeout: parseInt(process.env.WP_PROXY_TIMEOUT || '120000'),
  retries: parseInt(process.env.WP_PROXY_RETRIES || '3'),
};

/**
 * Fetch WordPress API via proxy or direct
 */
export async function fetchWordPressViaProxy(
  wpUrl: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {

  // If proxy is enabled and configured, use it
  if (PROXY_CONFIG.enabled && PROXY_CONFIG.url) {
    return fetchViaProxy(wpUrl, endpoint, options);
  }

  // Fallback to direct fetch
  return fetchDirect(wpUrl, endpoint, options);
}

/**
 * Fetch via proxy server
 */
async function fetchViaProxy(
  wpUrl: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {

  const proxyUrl = `${PROXY_CONFIG.url}${endpoint}`;

  console.log(`[PROXY] ${options.method || 'GET'} ${endpoint} for ${sanitizeUrl(wpUrl)}`);

  const startTime = Date.now();

  try {
    const response = await fetch(proxyUrl, {
      ...options,
      headers: {
        ...options.headers,
        // Tell proxy which WordPress site to target
        'X-WP-Target': wpUrl,
      },
      signal: AbortSignal.timeout(PROXY_CONFIG.timeout),
    });

    const responseTime = Date.now() - startTime;
    const cached = response.headers.get('X-Cache') === 'HIT';

    console.log(`[PROXY] Response: ${response.status} in ${responseTime}ms ${cached ? '(cached)' : ''}`);

    return response;

  } catch (error: any) {
    console.error(`[PROXY] Error: ${error.message}`);

    // If proxy fails, try direct fetch as fallback
    console.log('[PROXY] Falling back to direct fetch...');
    return fetchDirect(wpUrl, endpoint, options);
  }
}

/**
 * Direct fetch to WordPress (fallback)
 */
async function fetchDirect(
  wpUrl: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {

  const fullUrl = `${wpUrl}${endpoint}`;

  console.log(`[DIRECT] ${options.method || 'GET'} ${sanitizeUrl(fullUrl)}`);

  return fetch(fullUrl, {
    ...options,
    signal: AbortSignal.timeout(PROXY_CONFIG.timeout),
  });
}

/**
 * Sanitize URL for logging (remove credentials)
 */
function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.username = '';
    urlObj.password = '';
    return urlObj.toString();
  } catch {
    return '[Invalid URL]';
  }
}

/**
 * Fetch with automatic retries
 */
export async function fetchWordPressWithRetry(
  wpUrl: string,
  endpoint: string,
  options: RequestInit = {},
  maxRetries: number = PROXY_CONFIG.retries
): Promise<Response> {

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWordPressViaProxy(wpUrl, endpoint, options);

      // Don't retry on authentication or client errors
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      // Success or server error (which we might want to retry)
      if (response.ok || attempt === maxRetries) {
        return response;
      }

      // Retry on 5xx errors
      console.log(`[RETRY] Attempt ${attempt}/${maxRetries} failed with ${response.status}, retrying...`);

      // Exponential backoff: 2s, 4s, 8s
      const backoffMs = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, backoffMs));

    } catch (error: any) {
      lastError = error;

      // Don't retry on specific errors
      if (error.name === 'AbortError' && attempt === maxRetries) {
        throw error;
      }

      console.log(`[RETRY] Attempt ${attempt}/${maxRetries} failed: ${error.message}`);

      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Check proxy health
 */
export async function checkProxyHealth(): Promise<{
  available: boolean;
  responseTime?: number;
  error?: string;
}> {

  if (!PROXY_CONFIG.enabled || !PROXY_CONFIG.url) {
    return { available: false, error: 'Proxy not configured' };
  }

  const startTime = Date.now();

  try {
    const response = await fetch(`${PROXY_CONFIG.url}/health`, {
      signal: AbortSignal.timeout(5000),
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      return {
        available: true,
        responseTime,
        ...data,
      };
    }

    return {
      available: false,
      responseTime,
      error: `HTTP ${response.status}`,
    };

  } catch (error: any) {
    return {
      available: false,
      responseTime: Date.now() - startTime,
      error: error.message,
    };
  }
}

/**
 * Get proxy statistics
 */
export async function getProxyStats(): Promise<{
  enabled: boolean;
  url: string;
  health?: any;
}> {

  const stats = {
    enabled: PROXY_CONFIG.enabled,
    url: PROXY_CONFIG.enabled ? PROXY_CONFIG.url : 'Not configured',
  };

  if (PROXY_CONFIG.enabled) {
    const health = await checkProxyHealth();
    return { ...stats, health };
  }

  return stats;
}

/**
 * WordPress API helper functions using proxy
 */

// Fetch posts via proxy
export async function fetchPostsViaProxy(
  wpUrl: string,
  authHeader: string,
  page: number = 1,
  perPage: number = 10
) {
  const endpoint = `/wp-json/wp/v2/posts?page=${page}&per_page=${perPage}&_embed=1`;

  const response = await fetchWordPressWithRetry(wpUrl, endpoint, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
  }

  const posts = await response.json();
  const totalPosts = parseInt(response.headers.get('X-WP-Total') || '0');
  const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '0');

  return {
    posts,
    pagination: {
      page,
      perPage,
      total: totalPosts,
      totalPages,
    },
  };
}

// Publish post via proxy
export async function publishPostViaProxy(
  wpUrl: string,
  authHeader: string,
  postData: {
    title: string;
    content: string;
    status?: string;
    categories?: number[];
    featured_media?: number;
  }
) {
  const endpoint = '/wp-json/wp/v2/posts';

  const response = await fetchWordPressWithRetry(wpUrl, endpoint, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to publish post: ${response.status} ${errorData.message || response.statusText}`
    );
  }

  return response.json();
}

// Test WordPress connection via proxy
export async function testConnectionViaProxy(
  wpUrl: string,
  authHeader: string
): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {

  try {
    // Test 1: Check REST API
    const apiResponse = await fetchWordPressWithRetry(wpUrl, '/wp-json/', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!apiResponse.ok) {
      return {
        success: false,
        message: `REST API returned ${apiResponse.status}`,
      };
    }

    // Test 2: Check authentication
    const authResponse = await fetchWordPressWithRetry(wpUrl, '/wp-json/wp/v2/users/me', {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
    });

    if (!authResponse.ok) {
      return {
        success: false,
        message: authResponse.status === 401
          ? 'Authentication failed - invalid credentials'
          : `Auth check returned ${authResponse.status}`,
      };
    }

    const userData = await authResponse.json();

    return {
      success: true,
      message: `Connected as ${userData.name}`,
      details: {
        username: userData.name,
        email: userData.email,
        roles: userData.roles,
      },
    };

  } catch (error: any) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
    };
  }
}

// Export configuration for debugging
export const proxyConfig = PROXY_CONFIG;
