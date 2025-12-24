import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { ConnectionTestResult, sanitizeUrl } from '@/lib/wordpress-errors';
import { WORDPRESS_ENDPOINTS, getWordPressEndpoint, buildAuthHeader, WORDPRESS_USER_AGENT } from '@/lib/wordpress-endpoints';
import { getAdvancedBrowserHeaders, getWordPressApiHeaders } from '@/lib/wordpress-request-diagnostics';

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

/**
 * Test WordPress connection and verify credentials
 * 
 * This endpoint performs comprehensive checks:
 * 1. Site reachability
 * 2. REST API availability
 * 3. Authentication validity
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    // Get project_id from body
    const body = await request.json();
    const projectId = body.project_id;

    if (!projectId) {
      return NextResponse.json(
        { error: 'project_id is verplicht' },
        { status: 400 }
      );
    }

    // Get project with WordPress credentials
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, wp_url, wp_username, wp_password, wp_app_password')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    const result: ConnectionTestResult = {
      success: false,
      checks: {
        siteReachable: { passed: false, message: 'Nog niet getest' },
        restApiEnabled: { passed: false, message: 'Nog niet getest' },
        wpV2ApiEnabled: { passed: false, message: 'Nog niet getest' },
        postsEndpointAccessible: { passed: false, message: 'Nog niet getest' },
        authenticationValid: { passed: false, message: 'Nog niet getest' },
      },
      wpUrl: sanitizeUrl(project.wp_url || ''),
      testedEndpoints: [],
      timestamp: new Date().toISOString(),
    };

    // Check if WordPress credentials are configured
    if (!project.wp_url) {
      result.checks.siteReachable = {
        passed: false,
        message: 'WordPress URL is niet geconfigureerd',
        details: 'Configureer je WordPress URL in de project instellingen',
      };
      return NextResponse.json(result);
    }

    if (!project.wp_username && !project.wp_app_password) {
      result.checks.authenticationValid = {
        passed: false,
        message: 'WordPress credentials zijn niet geconfigureerd',
        details: 'Configureer je WordPress gebruikersnaam en app password in de project instellingen',
      };
      return NextResponse.json(result);
    }

    // Prepare WordPress credentials and normalize URL
    // Remove trailing slash AND any /wp-json paths that might have been incorrectly saved
    let wpUrl = project.wp_url.replace(/\/$/, ''); // Remove trailing slash
    wpUrl = wpUrl.replace(/\/wp-json.*$/, ''); // Remove any /wp-json paths to ensure clean base URL

    const username = project.wp_username || '';
    const password = (project.wp_app_password || project.wp_password || '').replace(/\s+/g, '');

    if (!password) {
      result.checks.authenticationValid = {
        passed: false,
        message: 'WordPress password ontbreekt',
        details: 'Configureer je WordPress app password in de project instellingen',
      };
      return NextResponse.json(result);
    }

    // Create Basic Auth header
    const authHeader = buildAuthHeader(username, password);

    // Track tested endpoints
    result.testedEndpoints = [];

    // Pre-flight: Try to parse and validate the URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(wpUrl);
      console.log(`✓ URL is valid: ${sanitizeUrl(wpUrl)}`);
      console.log(`  Protocol: ${parsedUrl.protocol}`);
      console.log(`  Hostname: ${parsedUrl.hostname}`);
      console.log(`  Port: ${parsedUrl.port || 'default'}`);
    } catch (urlError: any) {
      result.checks.siteReachable = {
        passed: false,
        message: 'WordPress URL is ongeldig',
        details: `URL parsing failed: ${urlError.message}`,
      };
      console.error('✗ Invalid URL:', urlError.message);
      return NextResponse.json(result);
    }

    // Test 1: Check if site is reachable
    console.log(`Testing WordPress site reachability: ${sanitizeUrl(wpUrl)}`);
    try {
      console.log(`Attempting HEAD request to ${sanitizeUrl(wpUrl)}...`);
      // Use advanced browser-like headers to avoid WAF/firewall blocking
      const siteResponse = await fetch(wpUrl, {
        method: 'HEAD',
        headers: getAdvancedBrowserHeaders(wpUrl),
        signal: AbortSignal.timeout(120000),
      });

      if (siteResponse.ok || siteResponse.status === 301 || siteResponse.status === 302) {
        result.checks.siteReachable = {
          passed: true,
          message: 'WordPress site is bereikbaar',
          details: `HTTP ${siteResponse.status}`,
        };
        console.log(`✓ Site reachable: ${siteResponse.status}`);
      } else {
        result.checks.siteReachable = {
          passed: false,
          message: `Site geeft onverwachte response: ${siteResponse.status}`,
          details: siteResponse.statusText,
        };
        console.log(`✗ Site returned: ${siteResponse.status} ${siteResponse.statusText}`);
      }
    } catch (error: any) {
      // Enhanced error diagnostics
      const errorInfo = {
        name: error.name,
        message: error.message,
        code: error.code,
        cause: error.cause?.message || error.cause?.code,
        errno: error.errno,
        syscall: error.syscall,
      };

      console.error('✗ Site not reachable:', error.message);
      console.error('Error details:', JSON.stringify(errorInfo, null, 2));

      // Provide specific error messages based on error type
      let userMessage = 'Kan WordPress site niet bereiken';
      let troubleshooting: string[] = [];

      if (error.code === 'ENOTFOUND' || error.syscall === 'getaddrinfo') {
        userMessage = 'DNS resolutie mislukt - domein kan niet worden gevonden';
        troubleshooting = [
          'Controleer of de WordPress URL correct is gespeld',
          'Controleer of het domein actief is en DNS records correct zijn ingesteld',
          'Test de URL in een browser op een ander apparaat',
          `Probeer: ping ${parsedUrl.hostname}`,
        ];
      } else if (error.code === 'ECONNREFUSED') {
        userMessage = 'Verbinding geweigerd - server accepteert geen verbindingen';
        troubleshooting = [
          'Controleer of de WordPress site online is',
          'Mogelijk blokkeert een firewall de verbinding',
          'Controleer of de juiste poort wordt gebruikt (443 voor HTTPS, 80 voor HTTP)',
        ];
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
        userMessage = 'Timeout - server reageert niet tijdig';
        troubleshooting = [
          'De hosting server reageert te langzaam',
          'Mogelijk is er een netwerk probleem',
          'Probeer het over enkele minuten opnieuw',
        ];
      } else if (error.name === 'AbortError') {
        userMessage = 'Request timeout (120 seconden)';
        troubleshooting = [
          'De WordPress server reageert niet binnen 120 seconden',
          'Controleer de snelheid van je hosting',
          'Test de site in een browser - laadt deze snel?',
        ];
      } else if (error.message?.includes('SSL') || error.message?.includes('certificate')) {
        userMessage = 'SSL/TLS certificaat probleem';
        troubleshooting = [
          'Controleer of je WordPress site een geldig SSL certificaat heeft',
          'Test de URL in een browser - krijg je een certificaat waarschuwing?',
          'Mogelijk is het certificaat verlopen of ongeldig',
        ];
      } else if (error.cause?.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || error.cause?.code === 'CERT_HAS_EXPIRED') {
        userMessage = `SSL certificaat fout: ${error.cause.code}`;
        troubleshooting = [
          'Het SSL certificaat van je WordPress site is ongeldig of verlopen',
          'Controleer het certificaat via je hosting provider',
          'Test de URL op https://www.ssllabs.com/ssltest/',
        ];
      }

      result.checks.siteReachable = {
        passed: false,
        message: userMessage,
        details: `${error.message}${error.cause ? ` (${error.cause.message || error.cause.code})` : ''} | Code: ${error.code || 'N/A'}`,
      };

      // Add troubleshooting to result if available
      if (troubleshooting.length > 0) {
        result.checks.siteReachable.details += `\n\nTroubleshooting:\n${troubleshooting.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}`;
      }

      // If site is not reachable, no point in checking further
      return NextResponse.json(result);
    }

    // Test 2: Check if REST API is enabled
    const restApiEndpoint = getWordPressEndpoint(wpUrl, WORDPRESS_ENDPOINTS.base);
    result.testedEndpoints.push(restApiEndpoint);
    console.log(`Testing REST API availability: ${sanitizeUrl(restApiEndpoint)}`);
    try {
      const apiResponse = await fetch(restApiEndpoint, {
        method: 'GET',
        headers: {
          ...getAdvancedBrowserHeaders(wpUrl),
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(120000),
      });

      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        
        if (apiData.namespaces && apiData.namespaces.includes('wp/v2')) {
          result.checks.restApiEnabled = {
            passed: true,
            message: 'WordPress REST API is actief',
            details: `API versie gevonden: wp/v2`,
          };
          console.log('✓ REST API is enabled');
        } else {
          result.checks.restApiEnabled = {
            passed: false,
            message: 'REST API is bereikbaar maar wp/v2 namespace ontbreekt',
            details: `Gevonden namespaces: ${apiData.namespaces ? apiData.namespaces.join(', ') : 'geen'}`,
          };
          console.log('✗ REST API missing wp/v2 namespace');
        }
      } else {
        result.checks.restApiEnabled = {
          passed: false,
          message: `REST API niet bereikbaar: ${apiResponse.status}`,
          details: apiResponse.statusText,
        };
        console.log(`✗ REST API returned: ${apiResponse.status}`);
      }
    } catch (error: any) {
      result.checks.restApiEnabled = {
        passed: false,
        message: 'Kan REST API niet bereiken',
        details: error.message,
      };
      console.error('✗ REST API not reachable:', error.message);
      
      // Continue to test other endpoints even if REST API check failed
    }

    // Test 3: Check if wp/v2 API is accessible
    const wpV2Endpoint = getWordPressEndpoint(wpUrl, WORDPRESS_ENDPOINTS.wp.base);
    result.testedEndpoints.push(wpV2Endpoint);
    console.log(`Testing WordPress v2 API: ${sanitizeUrl(wpV2Endpoint)}`);
    try {
      const wpV2Response = await fetch(wpV2Endpoint, {
        method: 'GET',
        headers: {
          ...getAdvancedBrowserHeaders(wpUrl),
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(120000),
      });

      if (wpV2Response.ok) {
        const wpV2Data = await wpV2Response.json();
        result.checks.wpV2ApiEnabled = {
          passed: true,
          message: 'WordPress REST API v2 is bereikbaar',
          details: `Endpoints beschikbaar: ${Object.keys(wpV2Data.routes || {}).length}`,
        };
        console.log('✓ WordPress v2 API is accessible');
      } else {
        result.checks.wpV2ApiEnabled = {
          passed: false,
          message: `WordPress v2 API niet bereikbaar: ${wpV2Response.status}`,
          details: wpV2Response.statusText,
        };
        console.log(`✗ WordPress v2 API returned: ${wpV2Response.status}`);
      }
    } catch (error: any) {
      result.checks.wpV2ApiEnabled = {
        passed: false,
        message: 'Kan WordPress v2 API niet bereiken',
        details: error.message,
      };
      console.error('✗ WordPress v2 API not reachable:', error.message);
    }

    // Test 4: Check if posts endpoint is accessible
    const postsEndpoint = getWordPressEndpoint(wpUrl, WORDPRESS_ENDPOINTS.wp.posts);
    result.testedEndpoints.push(`${postsEndpoint}?per_page=1`);
    console.log(`Testing posts endpoint: ${sanitizeUrl(postsEndpoint)}?per_page=1`);
    try {
      const postsResponse = await fetch(`${postsEndpoint}?per_page=1`, {
        method: 'GET',
        headers: getWordPressApiHeaders(authHeader, wpUrl),
        signal: AbortSignal.timeout(120000),
      });

      if (postsResponse.ok) {
        const posts = await postsResponse.json();
        result.checks.postsEndpointAccessible = {
          passed: true,
          message: 'Posts endpoint is bereikbaar',
          details: `Status ${postsResponse.status}, ${Array.isArray(posts) ? posts.length : 0} post(s) gevonden`,
        };
        console.log(`✓ Posts endpoint accessible: ${Array.isArray(posts) ? posts.length : 0} posts`);
      } else {
        result.checks.postsEndpointAccessible = {
          passed: false,
          message: `Posts endpoint niet bereikbaar: ${postsResponse.status}`,
          details: postsResponse.statusText,
        };
        console.log(`✗ Posts endpoint returned: ${postsResponse.status}`);
      }
    } catch (error: any) {
      result.checks.postsEndpointAccessible = {
        passed: false,
        message: 'Kan posts endpoint niet bereiken',
        details: error.message,
      };
      console.error('✗ Posts endpoint not reachable:', error.message);
    }

    // Test 5: Check authentication
    const usersEndpoint = `${getWordPressEndpoint(wpUrl, WORDPRESS_ENDPOINTS.wp.base)}/users/me`;
    result.testedEndpoints.push(usersEndpoint);
    console.log(`Testing authentication with ${sanitizeUrl(usersEndpoint)}`);
    try {
      const authResponse = await fetch(usersEndpoint, {
        method: 'GET',
        headers: getWordPressApiHeaders(authHeader, wpUrl),
        signal: AbortSignal.timeout(120000),
      });

      if (authResponse.ok) {
        const userData = await authResponse.json();
        result.checks.authenticationValid = {
          passed: true,
          message: `Authenticatie succesvol als: ${userData.name || username}`,
          details: `Gebruiker ID: ${userData.id}, Roles: ${userData.roles?.join(', ') || 'N/A'}`,
        };
        console.log(`✓ Authentication successful: ${userData.name}`);
      } else if (authResponse.status === 401) {
        result.checks.authenticationValid = {
          passed: false,
          message: 'Authenticatie mislukt - ongeldige credentials',
          details: 'HTTP 401 Unauthorized - controleer je gebruikersnaam en app password',
        };
        console.log('✗ Authentication failed: 401 Unauthorized');
      } else if (authResponse.status === 403) {
        result.checks.authenticationValid = {
          passed: false,
          message: 'Authenticatie mislukt - toegang geweigerd',
          details: 'HTTP 403 Forbidden - onvoldoende rechten',
        };
        console.log('✗ Authentication failed: 403 Forbidden');
      } else {
        result.checks.authenticationValid = {
          passed: false,
          message: `Authenticatie test gaf onverwachte response: ${authResponse.status}`,
          details: authResponse.statusText,
        };
        console.log(`✗ Authentication test returned: ${authResponse.status}`);
      }
    } catch (error: any) {
      result.checks.authenticationValid = {
        passed: false,
        message: 'Kan authenticatie niet testen',
        details: error.message,
      };
      console.error('✗ Authentication test error:', error.message);
    }

    // Determine overall success
    result.success = 
      result.checks.siteReachable.passed &&
      result.checks.restApiEnabled.passed &&
      (result.checks.wpV2ApiEnabled?.passed ?? true) &&
      (result.checks.postsEndpointAccessible?.passed ?? true) &&
      result.checks.authenticationValid.passed;

    console.log(`Connection test complete. Success: ${result.success}`);
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error testing WordPress connection:', error);
    return NextResponse.json(
      { 
        error: 'Fout bij testen van WordPress connectie',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
