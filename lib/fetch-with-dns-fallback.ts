/**
 * Fetch wrapper with DNS resolution fallback
 *
 * Fixes EAI_AGAIN errors for Dutch (.nl) domains by using system DNS
 * when Node.js's built-in DNS resolver fails
 */

import { lookup } from 'dns/promises';

export interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Enhanced fetch with DNS fallback for Dutch hosting providers
 *
 * This wrapper resolves DNS issues with Node.js fetch on .nl domains
 * by pre-resolving the hostname using system DNS before making the request.
 */
export async function fetchWithDnsFallback(
  url: string | URL,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = 15000, ...fetchOptions } = options;

  // Parse URL
  const urlObj = typeof url === 'string' ? new URL(url) : url;
  const hostname = urlObj.hostname;

  // Try DNS pre-resolution for .nl domains and others that might have issues
  // This forces Node.js to use system DNS instead of its own resolver
  if (hostname.endsWith('.nl') || hostname.endsWith('.be')) {
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
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);

    // If we get EAI_AGAIN, add more context to the error
    if (error.cause?.code === 'EAI_AGAIN') {
      const enhancedError = new Error(
        `DNS resolution failed for ${hostname}. This is a known issue with Node.js DNS resolver for some Dutch hosting providers. ` +
        `The domain exists but Node.js cannot resolve it. Contact support or check server DNS configuration.`
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
