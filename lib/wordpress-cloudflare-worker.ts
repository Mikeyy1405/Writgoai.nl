/**
 * Cloudflare Worker Proxy Integration
 *
 * Deze module zorgt voor het routeren van WordPress API calls via een Cloudflare Worker
 * om IP blocking en firewall issues te omzeilen.
 *
 * Configuratie:
 * Voeg CLOUDFLARE_WORKER_URL toe aan je .env:
 * CLOUDFLARE_WORKER_URL=https://jouw-worker.workers.dev
 */

/**
 * Check of Cloudflare Worker is geconfigureerd
 */
export function isCloudflareWorkerEnabled(): boolean {
  return !!process.env.CLOUDFLARE_WORKER_URL;
}

/**
 * Get de Cloudflare Worker URL
 */
export function getCloudflareWorkerUrl(): string | null {
  return process.env.CLOUDFLARE_WORKER_URL || null;
}

/**
 * Route een WordPress endpoint via de Cloudflare Worker
 *
 * Converteert:
 * https://klantsite.nl/wp-json/wp/v2/posts
 *
 * Naar:
 * https://jouw-worker.workers.dev?target=https://klantsite.nl/wp-json/wp/v2/posts
 *
 * @param endpoint - De originele WordPress endpoint URL
 * @returns Proxied URL via Cloudflare Worker, of originele URL als worker niet geconfigureerd is
 */
export function routeViaCloudflareWorker(endpoint: string): string {
  const workerUrl = getCloudflareWorkerUrl();

  // Als worker niet geconfigureerd is, return originele endpoint
  if (!workerUrl) {
    return endpoint;
  }

  try {
    // Valideer dat endpoint een geldige URL is
    new URL(endpoint);

    // Bouw worker URL met target parameter
    const proxiedUrl = `${workerUrl.replace(/\/$/, '')}?target=${encodeURIComponent(endpoint)}`;

    console.log('[CF-Worker] Routing via Cloudflare Worker');
    console.log('[CF-Worker] Original:', endpoint);
    console.log('[CF-Worker] Proxied:', proxiedUrl);

    return proxiedUrl;
  } catch (error) {
    console.error('[CF-Worker] Invalid endpoint URL, using original:', endpoint);
    return endpoint;
  }
}

/**
 * Wrapper voor fetch met automatische Cloudflare Worker routing
 *
 * @param endpoint - WordPress endpoint URL
 * @param options - Fetch options
 * @returns Fetch Response
 */
export async function fetchViaCloudflareWorker(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const proxiedUrl = routeViaCloudflareWorker(endpoint);

  return fetch(proxiedUrl, {
    ...options,
    // Ensure headers are properly passed through
    headers: {
      ...options.headers,
    },
  });
}

/**
 * Get info over de Cloudflare Worker configuratie voor logging
 */
export function getCloudflareWorkerInfo(): {
  enabled: boolean;
  url: string | null;
} {
  return {
    enabled: isCloudflareWorkerEnabled(),
    url: getCloudflareWorkerUrl(),
  };
}
