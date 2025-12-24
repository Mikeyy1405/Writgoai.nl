import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { sanitizeUrl } from '@/lib/wordpress-errors';
import { WORDPRESS_USER_AGENT } from '@/lib/wordpress-endpoints';
import {
  createDiagnosticReport,
  formatDiagnosticReport,
  getAdvancedBrowserHeaders,
  getWordPressApiHeaders,
  RequestDiagnostics,
} from '@/lib/wordpress-request-diagnostics';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface DiagnoseResult {
  serverInfo: {
    renderIp: string | null;
    renderRegion: string | null;
    nodeVersion: string;
    timestamp: string;
  };
  targetInfo: {
    url: string;
    hostname: string;
    tld: string;
    isDutchDomain: boolean;
  };
  connectivityTests: {
    headRequest: TestResult;
    restApiRequest: TestResult;
    postsRequest: TestResult;
  };
  diagnosticReport: RequestDiagnostics | null;
  recommendations: string[];
}

interface TestResult {
  success: boolean;
  status?: number;
  statusText?: string;
  responseHeaders?: Record<string, string>;
  timing?: number;
  error?: string;
  errorCode?: string;
}

/**
 * Diagnostic endpoint for debugging WordPress API connection issues
 *
 * This endpoint performs comprehensive diagnostics to identify why
 * requests to Dutch WordPress sites might be failing from Render.com.
 *
 * POST /api/wordpress/diagnose
 * Body: { project_id: string }
 */
export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[WP-DIAGNOSE-${requestId}] 🔍 Starting WordPress diagnostics`);

  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    // Get project_id from body
    const body = await request.json();
    const projectId = body.project_id;

    if (!projectId) {
      return NextResponse.json({ error: 'project_id is verplicht' }, { status: 400 });
    }

    // Get project with WordPress credentials
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, wp_url, wp_username, wp_password, wp_app_password')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    if (!project.wp_url) {
      return NextResponse.json({
        error: 'WordPress URL niet geconfigureerd',
        recommendations: ['Configureer een WordPress URL in project instellingen'],
      }, { status: 400 });
    }

    // Prepare WordPress credentials and normalize URL
    let wpUrl = project.wp_url.replace(/\/$/, '').replace(/\/wp-json.*$/, '');
    const hostname = new URL(wpUrl).hostname;
    const tld = hostname.split('.').pop() || '';
    const isDutchDomain = tld === 'nl' || tld === 'be';

    const username = project.wp_username || '';
    const password = (project.wp_app_password || project.wp_password || '').replace(/\s+/g, '');
    const authHeader = password ? `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}` : '';

    console.log(`[WP-DIAGNOSE-${requestId}] 📍 Target: ${sanitizeUrl(wpUrl)}`);
    console.log(`[WP-DIAGNOSE-${requestId}] 🌍 TLD: ${tld}, Dutch domain: ${isDutchDomain}`);

    // Initialize result
    const result: DiagnoseResult = {
      serverInfo: {
        renderIp: null,
        renderRegion: process.env.RENDER_REGION || null,
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
      },
      targetInfo: {
        url: sanitizeUrl(wpUrl),
        hostname,
        tld,
        isDutchDomain,
      },
      connectivityTests: {
        headRequest: { success: false },
        restApiRequest: { success: false },
        postsRequest: { success: false },
      },
      diagnosticReport: null,
      recommendations: [],
    };

    // Step 1: Get our own IP (for debugging purposes)
    try {
      console.log(`[WP-DIAGNOSE-${requestId}] 🔍 Getting server IP...`);
      const ipResponse = await fetch('https://api.ipify.org?format=json', {
        signal: AbortSignal.timeout(10000),
      });
      if (ipResponse.ok) {
        const ipData = await ipResponse.json();
        result.serverInfo.renderIp = ipData.ip;
        console.log(`[WP-DIAGNOSE-${requestId}] 📍 Server IP: ${ipData.ip}`);
      }
    } catch (e: any) {
      console.log(`[WP-DIAGNOSE-${requestId}] ⚠️ Could not get server IP: ${e.message}`);
    }

    // Step 2: HEAD request test (basic connectivity)
    console.log(`[WP-DIAGNOSE-${requestId}] 🔍 Testing HEAD request to ${sanitizeUrl(wpUrl)}...`);
    const headStart = Date.now();
    try {
      const headResponse = await fetch(wpUrl, {
        method: 'HEAD',
        headers: getAdvancedBrowserHeaders(wpUrl),
        signal: AbortSignal.timeout(30000),
      });

      const headTime = Date.now() - headStart;
      const headHeaders: Record<string, string> = {};
      headResponse.headers.forEach((value, key) => {
        headHeaders[key] = value;
      });

      result.connectivityTests.headRequest = {
        success: headResponse.ok || headResponse.status === 301 || headResponse.status === 302,
        status: headResponse.status,
        statusText: headResponse.statusText,
        responseHeaders: headHeaders,
        timing: headTime,
      };

      console.log(`[WP-DIAGNOSE-${requestId}] HEAD response: ${headResponse.status} in ${headTime}ms`);

      // Log important headers
      const importantHeaders = ['server', 'cf-ray', 'x-sucuri-id', 'x-powered-by', 'x-cache'];
      for (const h of importantHeaders) {
        if (headHeaders[h]) {
          console.log(`[WP-DIAGNOSE-${requestId}]   ${h}: ${headHeaders[h]}`);
        }
      }

    } catch (e: any) {
      const headTime = Date.now() - headStart;
      result.connectivityTests.headRequest = {
        success: false,
        error: e.message,
        errorCode: e.code || e.cause?.code,
        timing: headTime,
      };
      console.log(`[WP-DIAGNOSE-${requestId}] ❌ HEAD request failed: ${e.message}`);
    }

    // Step 3: REST API test (without auth)
    const restApiUrl = `${wpUrl}/wp-json`;
    console.log(`[WP-DIAGNOSE-${requestId}] 🔍 Testing REST API at ${sanitizeUrl(restApiUrl)}...`);
    const restStart = Date.now();
    try {
      const restResponse = await fetch(restApiUrl, {
        method: 'GET',
        headers: {
          ...getAdvancedBrowserHeaders(wpUrl),
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(30000),
      });

      const restTime = Date.now() - restStart;
      const restHeaders: Record<string, string> = {};
      restResponse.headers.forEach((value, key) => {
        restHeaders[key] = value;
      });

      // Try to get response body for error analysis
      let responseBody: string | null = null;
      try {
        responseBody = await restResponse.text();
      } catch {
        // Ignore body read errors
      }

      result.connectivityTests.restApiRequest = {
        success: restResponse.ok,
        status: restResponse.status,
        statusText: restResponse.statusText,
        responseHeaders: restHeaders,
        timing: restTime,
      };

      console.log(`[WP-DIAGNOSE-${requestId}] REST API response: ${restResponse.status} in ${restTime}ms`);

      // If we got a non-200 response, create a diagnostic report
      if (!restResponse.ok) {
        result.diagnosticReport = createDiagnosticReport(
          restApiUrl,
          'GET',
          getAdvancedBrowserHeaders(wpUrl),
          {
            status: restResponse.status,
            statusText: restResponse.statusText,
            headers: restHeaders,
          },
          undefined,
          { totalMs: restTime }
        );
        console.log(formatDiagnosticReport(result.diagnosticReport));
      }

    } catch (e: any) {
      const restTime = Date.now() - restStart;
      result.connectivityTests.restApiRequest = {
        success: false,
        error: e.message,
        errorCode: e.code || e.cause?.code,
        timing: restTime,
      };

      result.diagnosticReport = createDiagnosticReport(
        restApiUrl,
        'GET',
        getAdvancedBrowserHeaders(wpUrl),
        undefined,
        {
          code: e.code || e.cause?.code,
          message: e.message,
          cause: e.cause?.message,
        },
        { totalMs: restTime }
      );

      console.log(`[WP-DIAGNOSE-${requestId}] ❌ REST API request failed: ${e.message}`);
      console.log(formatDiagnosticReport(result.diagnosticReport));
    }

    // Step 4: Authenticated posts endpoint test
    if (authHeader) {
      const postsUrl = `${wpUrl}/wp-json/wp/v2/posts?per_page=1`;
      console.log(`[WP-DIAGNOSE-${requestId}] 🔍 Testing posts endpoint with auth...`);
      const postsStart = Date.now();
      try {
        const postsResponse = await fetch(postsUrl, {
          method: 'GET',
          headers: getWordPressApiHeaders(authHeader, wpUrl),
          signal: AbortSignal.timeout(30000),
        });

        const postsTime = Date.now() - postsStart;
        const postsHeaders: Record<string, string> = {};
        postsResponse.headers.forEach((value, key) => {
          postsHeaders[key] = value;
        });

        result.connectivityTests.postsRequest = {
          success: postsResponse.ok,
          status: postsResponse.status,
          statusText: postsResponse.statusText,
          responseHeaders: postsHeaders,
          timing: postsTime,
        };

        console.log(`[WP-DIAGNOSE-${requestId}] Posts endpoint response: ${postsResponse.status} in ${postsTime}ms`);

        // If authenticated request failed but REST API worked, it's likely auth or permission issue
        if (!postsResponse.ok && result.connectivityTests.restApiRequest.success) {
          if (postsResponse.status === 401) {
            result.recommendations.push(
              'Authentication failed (401) - check credentials:',
              '  1. Verify username is correct',
              '  2. Generate a new Application Password in WordPress',
              '  3. Ensure the user has edit_posts capability',
            );
          } else if (postsResponse.status === 403) {
            result.recommendations.push(
              'Access forbidden (403) - possible causes:',
              '  1. User lacks required permissions',
              '  2. Security plugin blocking the request',
              '  3. REST API access restricted',
            );
          }
        }

      } catch (e: any) {
        const postsTime = Date.now() - postsStart;
        result.connectivityTests.postsRequest = {
          success: false,
          error: e.message,
          errorCode: e.code || e.cause?.code,
          timing: postsTime,
        };
        console.log(`[WP-DIAGNOSE-${requestId}] ❌ Posts endpoint request failed: ${e.message}`);
      }
    }

    // Generate recommendations based on test results
    const tests = result.connectivityTests;

    if (!tests.headRequest.success && !tests.restApiRequest.success) {
      // Both failed - likely network level blocking
      result.recommendations.push(
        '⚠️ NETWORK LEVEL BLOCKING DETECTED',
        '',
        'Your Render.com server IP appears to be blocked by the hosting provider.',
        `Current server IP: ${result.serverInfo.renderIp || 'unknown'}`,
        '',
        'SOLUTIONS:',
        '',
        '1. WHITELIST RENDER IP',
        '   Contact your WordPress hosting provider and ask them to whitelist:',
        `   - IP: ${result.serverInfo.renderIp || 'Check https://api.ipify.org from your Render service'}`,
        '   - Note: Render uses dynamic IPs, so this may need periodic updates',
        '',
        '2. USE A PROXY SERVICE',
        '   Add a residential proxy to bypass cloud IP blocks:',
        '   - BrightData (brightdata.com)',
        '   - Oxylabs (oxylabs.io)',
        '   - Smartproxy (smartproxy.com)',
        '',
        '3. STATIC IP ADD-ON (Render)',
        '   Render offers static IP addresses as an add-on.',
        '   This makes whitelisting easier but may not work if all cloud IPs are blocked.',
        '',
        '4. VPS PROXY',
        '   Set up a small VPS in the Netherlands as a proxy:',
        '   - TransIP VPS (~€5/month)',
        '   - DigitalOcean Amsterdam (~$4/month)',
        '   - Configure as HTTP proxy for WordPress requests',
        '',
        '5. DISABLE SECURITY PLUGINS (temporary test)',
        '   If you have access to WordPress admin:',
        '   - Temporarily disable Wordfence, Sucuri, or similar plugins',
        '   - If it works, add proper whitelist rules',
      );
    } else if (!tests.restApiRequest.success && tests.headRequest.success) {
      // Site reachable but REST API blocked
      result.recommendations.push(
        '⚠️ REST API SPECIFICALLY BLOCKED',
        '',
        'The WordPress site is reachable, but the REST API is blocked.',
        'This is often caused by security plugins or hosting configuration.',
        '',
        'SOLUTIONS:',
        '',
        '1. CHECK WORDPRESS SETTINGS',
        '   - Settings > Reading: Ensure "Discourage search engines" is unchecked',
        '   - Permalinks: Try resaving permalinks',
        '',
        '2. SECURITY PLUGIN CONFIGURATION',
        '   - Wordfence: Whitelist /wp-json/ in Firewall settings',
        '   - iThemes Security: Check REST API settings',
        '   - All In One Security: Check Firewall settings',
        '',
        '3. .HTACCESS RULES',
        '   Check if .htaccess blocks /wp-json/ paths',
        '',
        '4. HOSTING LEVEL BLOCKING',
        '   Some hosts block REST API access by default:',
        '   - Contact hosting support',
        '   - Check cPanel/hosting dashboard for firewall settings',
      );
    } else if (tests.restApiRequest.success && !tests.postsRequest.success) {
      // REST API works but posts endpoint fails
      result.recommendations.push(
        '⚠️ AUTHENTICATION OR PERMISSION ISSUE',
        '',
        'The REST API is accessible but the authenticated request failed.',
        '',
        'SOLUTIONS:',
        '',
        '1. VERIFY CREDENTIALS',
        '   - Go to WordPress Admin > Users > Your Profile',
        '   - Scroll to "Application Passwords"',
        '   - Generate a NEW application password',
        '   - Update the password in Writgo project settings',
        '',
        '2. CHECK USER PERMISSIONS',
        '   - Ensure the user has Administrator or Editor role',
        '   - Required capability: edit_posts',
        '',
        '3. APPLICATION PASSWORDS PLUGIN',
        '   - Ensure Application Passwords is enabled (built-in since WP 5.6)',
        '   - Some security plugins may disable this feature',
      );
    }

    // Add Dutch domain specific recommendations
    if (isDutchDomain && result.recommendations.length > 0) {
      result.recommendations.push(
        '',
        '📍 DUTCH HOSTING SPECIFIC NOTES',
        '',
        'Many Dutch hosting providers (Antagonist, TransIP, Byte, Vimexx)',
        'block cloud provider IP ranges by default as bot protection.',
        '',
        'This is a known issue when connecting from:',
        '- AWS (used by Render, Vercel, etc.)',
        '- Google Cloud Platform',
        '- Microsoft Azure',
        '- DigitalOcean',
        '',
        'The most reliable solutions are:',
        '1. Contact hosting support for IP whitelisting',
        '2. Use a Netherlands-based proxy/VPS',
      );
    }

    console.log(`[WP-DIAGNOSE-${requestId}] ✅ Diagnostics complete`);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error(`[WP-DIAGNOSE-${requestId}] ❌ Fatal error:`, error);
    return NextResponse.json(
      {
        error: 'Diagnostics failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
