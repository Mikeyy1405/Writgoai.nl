import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { ConnectionTestResult, sanitizeUrl } from '@/lib/wordpress-errors';

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
        authenticationValid: { passed: false, message: 'Nog niet getest' },
      },
      wpUrl: sanitizeUrl(project.wp_url || ''),
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

    // Prepare WordPress credentials
    const wpUrl = project.wp_url.replace(/\/$/, ''); // Remove trailing slash
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
    const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

    // Test 1: Check if site is reachable
    console.log(`Testing WordPress site reachability: ${wpUrl}`);
    try {
      const siteResponse = await fetch(wpUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000), // 10 second timeout
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
      result.checks.siteReachable = {
        passed: false,
        message: 'Kan WordPress site niet bereiken',
        details: error.message,
      };
      console.error('✗ Site not reachable:', error.message);
      
      // If site is not reachable, no point in checking further
      return NextResponse.json(result);
    }

    // Test 2: Check if REST API is enabled
    console.log(`Testing REST API availability: ${wpUrl}/wp-json/`);
    try {
      const apiResponse = await fetch(`${wpUrl}/wp-json/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
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
            details: JSON.stringify(apiData.namespaces),
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
      
      // Continue to test authentication even if REST API check failed
    }

    // Test 3: Check authentication
    console.log(`Testing authentication with wp/v2/users/me`);
    try {
      const authResponse = await fetch(`${wpUrl}/wp-json/wp/v2/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
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
