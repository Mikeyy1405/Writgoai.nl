/**
 * WordPress Proxy Configuration
 *
 * This module provides proxy support for WordPress API requests to bypass
 * IP blocking by hosting providers (common with Dutch hosting providers
 * that block cloud provider IPs like Render, Vercel, AWS, etc.)
 *
 * Usage:
 * Set the WORDPRESS_PROXY_URL environment variable to use a proxy:
 * WORDPRESS_PROXY_URL=http://username:password@proxy.example.com:8080
 *
 * Or for a simple proxy without auth:
 * WORDPRESS_PROXY_URL=http://proxy.example.com:8080
 */

import { ProxyAgent } from 'undici';

/**
 * Get proxy agent if WORDPRESS_PROXY_URL is configured
 */
export function getProxyAgent(): ProxyAgent | undefined {
  const proxyUrl = process.env.WORDPRESS_PROXY_URL;

  if (!proxyUrl) {
    return undefined;
  }

  try {
    const agent = new ProxyAgent(proxyUrl);
    console.log('[WP-PROXY] Using proxy:', proxyUrl.replace(/:[^:@]+@/, ':****@')); // Hide password in logs
    return agent;
  } catch (error: any) {
    console.error('[WP-PROXY] Failed to create proxy agent:', error.message);
    return undefined;
  }
}

/**
 * Get fetch options with proxy support
 * Uses undici's ProxyAgent with the dispatcher option
 */
export function getProxyFetchOptions(baseOptions: RequestInit = {}): RequestInit {
  const proxyAgent = getProxyAgent();

  if (!proxyAgent) {
    return baseOptions;
  }

  // Use undici's dispatcher option for proxy
  return {
    ...baseOptions,
    // @ts-ignore - undici dispatcher option
    dispatcher: proxyAgent,
  };
}

/**
 * Check if proxy is configured
 */
export function isProxyConfigured(): boolean {
  return !!process.env.WORDPRESS_PROXY_URL;
}

/**
 * Get proxy info for logging (with password hidden)
 */
export function getProxyInfo(): string | null {
  const proxyUrl = process.env.WORDPRESS_PROXY_URL;

  if (!proxyUrl) {
    return null;
  }

  return proxyUrl.replace(/:[^:@]+@/, ':****@');
}
