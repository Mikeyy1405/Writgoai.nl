/**
 * Cloudflare Worker - WordPress REST API Proxy
 *
 * Deze worker fungeert als proxy voor WordPress REST API calls om:
 * - IP blocking van hosting providers te omzeilen
 * - Firewall regels te bypassen
 * - Betere connectiviteit te garanderen vanuit cloud providers
 *
 * Deploy:
 * 1. Ga naar workers.cloudflare.com
 * 2. Create Worker
 * 3. Plak deze code
 * 4. Deploy
 * 5. Gebruik de worker URL: jouw-worker.workers.dev
 *
 * Gebruik:
 * https://jouw-worker.workers.dev?target=https://klantsite.nl/wp-json/wp/v2/posts
 */

export default {
  async fetch(request) {
    // CORS headers voor pre-flight requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Writgo-API-Key',
      'Access-Control-Max-Age': '86400',
    };

    // Handle CORS pre-flight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    try {
      const url = new URL(request.url);
      const targetUrl = url.searchParams.get('target');

      // Valideer target URL
      if (!targetUrl) {
        return new Response(JSON.stringify({
          error: 'Missing target parameter',
          usage: 'https://worker.workers.dev?target=https://example.com/wp-json/...'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Valideer dat target URL een geldige URL is
      let target;
      try {
        target = new URL(targetUrl);
      } catch (e) {
        return new Response(JSON.stringify({
          error: 'Invalid target URL',
          provided: targetUrl
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Security check: alleen WordPress REST API endpoints toestaan
      if (!target.pathname.includes('/wp-json/') && !target.pathname.includes('/wp-admin/')) {
        return new Response(JSON.stringify({
          error: 'Only WordPress REST API endpoints allowed',
          path: target.pathname
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      console.log('Proxying request to:', target.hostname, target.pathname);

      // Verzamel headers van de originele request
      const headers = {};
      request.headers.forEach((value, key) => {
        // Skip host header en cloudflare specifieke headers
        if (!key.toLowerCase().startsWith('cf-') &&
            key.toLowerCase() !== 'host' &&
            key.toLowerCase() !== 'x-real-ip' &&
            key.toLowerCase() !== 'x-forwarded-for') {
          headers[key] = value;
        }
      });

      // Fetch naar de target URL
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      });

      // Clone de response en voeg CORS headers toe
      const modifiedResponse = new Response(response.body, response);

      // Voeg CORS headers toe aan response
      Object.keys(corsHeaders).forEach(key => {
        modifiedResponse.headers.set(key, corsHeaders[key]);
      });

      return modifiedResponse;

    } catch (error) {
      console.error('Proxy error:', error);
      return new Response(JSON.stringify({
        error: 'Proxy request failed',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};
