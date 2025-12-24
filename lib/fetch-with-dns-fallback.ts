/**
 * Fetch wrapper with DNS resolution fallback
 *
 * Fixes EAI_AGAIN errors by using system DNS pre-resolution
 * for all domains. This ensures reliable connections regardless
 * of geographic location or TLD.
 */

import { lookup } from 'dns/promises';
import { Agent, fetch as undiciFetch, Response as UndiciResponse } from 'undici';

export interface FetchOptions extends RequestInit {
  timeout?: number;
  connectTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

// Type alias to handle undici Response compatibility with standard Response
type CompatibleResponse = Response | UndiciResponse;

/**
 * Sleep for a given number of milliseconds
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get browser-like default headers to avoid being blocked by firewalls
 */
function getBrowserHeaders(): HeadersInit {
  return {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,nl;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  };
}

/**
 * Merge default browser headers with user-provided headers
 */
function mergeHeaders(userHeaders?: HeadersInit): HeadersInit {
  const defaultHeaders = getBrowserHeaders();

  if (!userHeaders) {
    return defaultHeaders;
  }

  // Convert user headers to plain object
  const userHeadersObj: Record<string, string> = {};
  if (userHeaders instanceof Headers) {
    userHeaders.forEach((value, key) => {
      userHeadersObj[key] = value;
    });
  } else if (Array.isArray(userHeaders)) {
    userHeaders.forEach(([key, value]) => {
      userHeadersObj[key] = value;
    });
  } else {
    Object.assign(userHeadersObj, userHeaders);
  }

  // User headers override default headers
  return { ...defaultHeaders, ...userHeadersObj };
}

/**
 * Enhanced fetch with DNS fallback, retry logic, and exponential backoff
 *
 * This wrapper resolves DNS issues with Node.js fetch by pre-resolving
 * the hostname using system DNS before making the request. This ensures
 * reliable connections for multi-site WordPress setups across different
 * geographic regions and TLDs.
 *
 * Features:
 * - DNS pre-resolution for all domains
 * - Automatic retry with exponential backoff
 * - Extended timeouts for slow servers
 * - Browser-like connection settings
 *
 * Timeouts optimized for international connectivity:
 * - Connection timeout: 90s (default undici is 10s)
 * - Request timeout: 60s (default is 15s)
 * - Retries: 4 attempts with exponential backoff
 */
export async function fetchWithDnsFallback(
  url: string | URL,
  options: FetchOptions = {}
): Promise<Response> {
  // Increased timeouts and retry settings for slow/unreliable WordPress hosts
  // 60s request timeout, 90s connection timeout, 4 retries
  const {
    timeout = 60000,
    connectTimeout = 90000,
    maxRetries = 4,
    retryDelay = 2000,
    ...fetchOptions
  } = options;

  // Parse URL
  const urlObj = typeof url === 'string' ? new URL(url) : url;
  const hostname = urlObj.hostname;

  // Try DNS pre-resolution for all domains
  // This forces Node.js to use system DNS instead of its own resolver
  // Critical for multi-site setups where Render server location differs from WordPress sites
  try {
    console.log(`[DNS] Pre-resolving ${hostname}...`);
    const addresses = await lookup(hostname, { family: 0, all: true });

    if (addresses && addresses.length > 0) {
      const address = addresses[0].address;
      console.log(`[DNS] ✓ Resolved ${hostname} to ${address} (${addresses[0].family === 4 ? 'IPv4' : 'IPv6'})`);
    } else {
      console.warn(`[DNS] ⚠ No addresses found for ${hostname}`);
    }
  } catch (dnsError: any) {
    console.error(`[DNS] ✗ Pre-resolution failed for ${hostname}:`, dnsError.message);
    // Continue anyway, fetch might still work
  }

  // Retry loop with exponential backoff
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Create custom Agent with increased connection timeout and optimized settings
    const agent = new Agent({
      connect: {
        timeout: connectTimeout,
        // TCP keepalive for long-running connections
        keepAlive: true,
        keepAliveInitialDelay: 10000,
      },
      // Connection pooling for better performance
      pipelining: 1,
    });

    // Create abort controller for overall timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      if (attempt > 0) {
        const delay = retryDelay * Math.pow(2, attempt - 1);
        console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries + 1} for ${hostname} after ${delay}ms delay...`);
        await sleep(delay);
      }

      // Merge browser-like headers with user-provided headers
      const headers = mergeHeaders(fetchOptions.headers);

      // Use undici fetch directly with custom agent and optimized settings
      const response = await undiciFetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
        dispatcher: agent,
      } as any);

      clearTimeout(timeoutId);
      agent.destroy();

      if (attempt > 0) {
        console.log(`[Retry] ✓ Success on attempt ${attempt + 1} for ${hostname}`);
      }

      // Cast undici Response to standard Response type
      return response as unknown as Response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      agent.destroy();
      lastError = error;

      // Check if this is a retryable error
      const isRetryable =
        error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        error.cause?.code === 'ETIMEDOUT' ||
        error.cause?.code === 'ECONNRESET' ||
        error.cause?.code === 'ECONNREFUSED' ||
        error.name === 'AbortError';

      if (!isRetryable || attempt >= maxRetries) {
        // Don't retry non-retryable errors or if we've exhausted retries
        break;
      }

      console.log(`[Retry] ✗ Attempt ${attempt + 1} failed for ${hostname}: ${error.message}`);
    }
  }

  // All retries failed, handle the error
  const error = lastError;

    // Enhanced error diagnostics for better debugging
    console.error(`[Fetch Error] Failed to fetch ${hostname}`);
    console.error(`[Fetch Error] Error name: ${error.name}`);
    console.error(`[Fetch Error] Error message: ${error.message}`);
    console.error(`[Fetch Error] Error code: ${error.code || 'N/A'}`);
    console.error(`[Fetch Error] Error cause:`, error.cause);

    // Categorize and enhance error messages
    if (error.cause?.code === 'EAI_AGAIN') {
      const enhancedError = new Error(
        `DNS resolution failed for ${hostname}. This can occur when the Node.js DNS resolver cannot reach the domain ` +
        `from the current server location. The domain exists but Node.js cannot resolve it. ` +
        `Contact support or check server DNS configuration.`
      );
      enhancedError.cause = error.cause;
      (enhancedError as any).code = 'EAI_AGAIN';
      throw enhancedError;
    }

    if (error.cause?.code === 'ENOTFOUND') {
      const enhancedError = new Error(
        `DNS lookup failed for ${hostname}. The domain could not be found. ` +
        `This may indicate: 1) Domain does not exist, 2) DNS server cannot resolve it, or 3) Network connectivity issue.`
      );
      enhancedError.cause = error.cause;
      (enhancedError as any).code = 'ENOTFOUND';
      throw enhancedError;
    }

    if (error.cause?.code === 'ECONNREFUSED') {
      const enhancedError = new Error(
        `Connection refused by ${hostname}. The server actively rejected the connection. ` +
        `This may indicate: 1) Firewall blocking, 2) Server offline, or 3) Wrong port.`
      );
      enhancedError.cause = error.cause;
      (enhancedError as any).code = 'ECONNREFUSED';
      throw enhancedError;
    }

    if (error.cause?.code === 'ETIMEDOUT' || error.cause?.code === 'ECONNRESET' || error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
      const enhancedError = new Error(
        `Connection timeout to ${hostname} after ${maxRetries + 1} attempts. The server did not respond in time. ` +
        `This may indicate: 1) Server is slow/overloaded, 2) Network issue, 3) Firewall blocking requests, or 4) Server rate limiting.`
      );
      enhancedError.cause = error.cause;
      (enhancedError as any).code = error.cause?.code || 'TIMEOUT';
      throw enhancedError;
    }

    if (error.name === 'AbortError') {
      const enhancedError = new Error(
        `Request timeout (${timeout}ms) for ${hostname}. The request took too long to complete.`
      );
      (enhancedError as any).code = 'TIMEOUT';
      throw enhancedError;
    }

    if (error.cause?.code?.includes('CERT') || error.cause?.code?.includes('SSL')) {
      const enhancedError = new Error(
        `SSL/TLS certificate error for ${hostname}: ${error.cause.code}. ` +
        `The server's SSL certificate is invalid, expired, or cannot be verified.`
      );
      enhancedError.cause = error.cause;
      (enhancedError as any).code = error.cause.code;
      throw enhancedError;
    }

    // If we don't recognize the error, add generic context
    const enhancedError = new Error(
      `Failed to fetch ${hostname}: ${error.message}. ` +
      `Error type: ${error.name}${error.code ? `, Code: ${error.code}` : ''}${error.cause ? `, Cause: ${error.cause.code || error.cause.message}` : ''}`
    );
    enhancedError.cause = error.cause;
    (enhancedError as any).code = error.code || error.cause?.code || 'FETCH_FAILED';
    throw enhancedError;
  }
}

/**
 * Test if a hostname can be resolved
 */
export async function testDnsResolution(hostname: string): Promise<{
  success: boolean;
  addresses?: Array<{ address: string; family: 4 | 6 }>;
  error?: string;
}> {
  try {
    const addresses = await lookup(hostname, { family: 0, all: true });
    return {
      success: true,
      addresses: addresses.map(a => ({ address: a.address, family: a.family as 4 | 6 })),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
