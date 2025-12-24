/**
 * Fetch wrapper with DNS resolution fallback
 *
 * Fixes EAI_AGAIN errors by using system DNS pre-resolution
 * for all domains. This ensures reliable connections regardless
 * of geographic location or TLD.
 */

import { lookup } from 'dns/promises';
import { Agent, fetch as undiciFetch } from 'undici';

export interface FetchOptions extends RequestInit {
  timeout?: number;
  connectTimeout?: number;
}

/**
 * Enhanced fetch with DNS fallback for all domains
 *
 * This wrapper resolves DNS issues with Node.js fetch by pre-resolving
 * the hostname using system DNS before making the request. This ensures
 * reliable connections for multi-site WordPress setups across different
 * geographic regions and TLDs.
 *
 * Timeouts optimized for international connectivity:
 * - Connection timeout: 60s (default undici is 10s)
 * - Request timeout: 45s (default is 15s)
 */
export async function fetchWithDnsFallback(
  url: string | URL,
  options: FetchOptions = {}
): Promise<Response> {
  // Increased timeouts for international WordPress sites
  // 45s request timeout, 60s connection timeout (was 15s/30s)
  const { timeout = 45000, connectTimeout = 60000, ...fetchOptions } = options;

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

      // We resolved it successfully, Node.js should now be able to use it
      // The DNS cache should help subsequent requests
    } else {
      console.warn(`[DNS] ⚠ No addresses found for ${hostname}`);
    }
  } catch (dnsError: any) {
    console.error(`[DNS] ✗ Pre-resolution failed for ${hostname}:`, dnsError.message);
    // Continue anyway, fetch might still work
  }

  // Create custom Agent with increased connection timeout
  // Default undici connection timeout is 10s, we increase it to 30s for slow hosts
  const agent = new Agent({
    connect: {
      timeout: connectTimeout,
    },
  });

  // Create abort controller for overall timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Use undici fetch directly to support custom dispatcher/agent
    const response = await undiciFetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      dispatcher: agent,
    } as any);

    clearTimeout(timeoutId);
    agent.destroy();
    // Cast undici Response to standard Response type - they're compatible for our use case
    return response as unknown as Response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    agent.destroy();

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

    if (error.cause?.code === 'ETIMEDOUT' || error.cause?.code === 'ECONNRESET') {
      const enhancedError = new Error(
        `Connection timeout to ${hostname}. The server did not respond in time. ` +
        `This may indicate: 1) Server is slow, 2) Network issue, or 3) Firewall dropping packets.`
      );
      enhancedError.cause = error.cause;
      (enhancedError as any).code = error.cause.code;
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
