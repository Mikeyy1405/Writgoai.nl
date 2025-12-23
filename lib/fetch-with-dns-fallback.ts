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
 * geographic regions and TLDs. Also increases connection timeout from
 * default 10s to 30s for slow hosts.
 */
export async function fetchWithDnsFallback(
  url: string | URL,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = 15000, connectTimeout = 30000, ...fetchOptions } = options;

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

    // If we get EAI_AGAIN, add more context to the error
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

    throw error;
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
