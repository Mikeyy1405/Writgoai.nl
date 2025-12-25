#!/usr/bin/env ts-node
/**
 * WordPress REST API Connection Diagnostic Tool
 *
 * Usage:
 *   npm run test:wordpress -- --url https://jouwsite.nl --username admin --password "xxxx xxxx xxxx"
 *
 * Or set environment variables:
 *   WP_URL=https://jouwsite.nl WP_USERNAME=admin WP_PASSWORD="xxxx" npm run test:wordpress
 */

interface TestResult {
  name: string;
  success: boolean;
  status?: number;
  message: string;
  details?: string;
  timing?: number;
}

interface DiagnosticResult {
  wpUrl: string;
  timestamp: string;
  tests: TestResult[];
  overallSuccess: boolean;
  recommendations: string[];
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config: { url?: string; username?: string; password?: string } = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
      config.url = args[i + 1];
      i++;
    } else if (args[i] === '--username' && args[i + 1]) {
      config.username = args[i + 1];
      i++;
    } else if (args[i] === '--password' && args[i + 1]) {
      config.password = args[i + 1];
      i++;
    }
  }

  // Fallback to environment variables
  return {
    url: config.url || process.env.WP_URL,
    username: config.username || process.env.WP_USERNAME,
    password: config.password || process.env.WP_PASSWORD,
  };
}

// Get advanced browser-like headers to avoid WAF blocking
function getBrowserHeaders(referer?: string): Record<string, string> {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'Connection': 'keep-alive',
    'DNT': '1',
    ...(referer ? { 'Referer': referer } : {}),
  };
}

// Run a single test
async function runTest(
  name: string,
  url: string,
  options: RequestInit,
  expectedStatuses: number[] = [200]
): Promise<TestResult> {
  const start = Date.now();

  try {
    console.log(`\n🔍 Testing: ${name}`);
    console.log(`   URL: ${url}`);

    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(30000),
    });

    const timing = Date.now() - start;
    const success = expectedStatuses.includes(response.status);

    // Get response headers
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Log important headers
    const importantHeaders = ['server', 'cf-ray', 'x-sucuri-id', 'x-wordfence-blocked', 'x-powered-by'];
    for (const h of importantHeaders) {
      if (headers[h]) {
        console.log(`   ${h}: ${headers[h]}`);
      }
    }

    const result: TestResult = {
      name,
      success,
      status: response.status,
      message: success ? `✅ Success: ${response.status} ${response.statusText}` : `❌ Failed: ${response.status} ${response.statusText}`,
      details: JSON.stringify(headers, null, 2),
      timing,
    };

    console.log(`   ${result.message} (${timing}ms)`);

    return result;

  } catch (error: any) {
    const timing = Date.now() - start;
    const errorCode = error.code || error.cause?.code || 'UNKNOWN';

    console.log(`   ❌ Error: ${error.message}`);
    if (errorCode !== 'UNKNOWN') {
      console.log(`   Error code: ${errorCode}`);
    }

    return {
      name,
      success: false,
      message: `❌ Error: ${error.message}`,
      details: `Error code: ${errorCode}\nCause: ${error.cause?.message || 'N/A'}`,
      timing,
    };
  }
}

// Main diagnostic function
async function runDiagnostics(): Promise<DiagnosticResult> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  WordPress REST API Diagnostics');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const config = parseArgs();

  if (!config.url) {
    console.error('\n❌ WordPress URL is vereist!');
    console.log('\nGebruik:');
    console.log('  npm run test:wordpress -- --url https://jouwsite.nl --username admin --password "xxxx"');
    console.log('\nOf met environment variables:');
    console.log('  WP_URL=https://jouwsite.nl WP_USERNAME=admin WP_PASSWORD="xxxx" npm run test:wordpress');
    process.exit(1);
  }

  // Normalize URL
  let wpUrl = config.url.replace(/\/$/, '').replace(/\/wp-json.*$/, '');
  const hostname = new URL(wpUrl).hostname;
  const isDutchDomain = hostname.endsWith('.nl') || hostname.endsWith('.be');

  console.log(`\n📍 Target: ${wpUrl}`);
  console.log(`   Hostname: ${hostname}`);
  console.log(`   Dutch domain: ${isDutchDomain ? 'Yes' : 'No'}`);

  // Create auth header if credentials provided
  let authHeader = '';
  if (config.username && config.password) {
    const cleanPassword = config.password.replace(/\s+/g, '');
    authHeader = 'Basic ' + Buffer.from(`${config.username}:${cleanPassword}`).toString('base64');
    console.log(`   Authentication: Enabled (user: ${config.username})`);
  } else {
    console.log(`   Authentication: Not provided (some tests will be skipped)`);
  }

  const tests: TestResult[] = [];

  // Test 1: Basic site connectivity (HEAD request)
  tests.push(await runTest(
    'Site Reachability (HEAD)',
    wpUrl,
    {
      method: 'HEAD',
      headers: getBrowserHeaders(wpUrl),
    },
    [200, 301, 302]
  ));

  // Test 2: REST API discovery endpoint
  tests.push(await runTest(
    'REST API Discovery',
    `${wpUrl}/wp-json/`,
    {
      method: 'GET',
      headers: {
        ...getBrowserHeaders(wpUrl),
        'Accept': 'application/json',
      },
    }
  ));

  // Test 3: WordPress v2 API
  tests.push(await runTest(
    'WordPress v2 API',
    `${wpUrl}/wp-json/wp/v2/`,
    {
      method: 'GET',
      headers: {
        ...getBrowserHeaders(wpUrl),
        'Accept': 'application/json',
      },
    }
  ));

  // Test 4: Posts endpoint (public, no auth)
  tests.push(await runTest(
    'Posts Endpoint (Public)',
    `${wpUrl}/wp-json/wp/v2/posts?per_page=1`,
    {
      method: 'GET',
      headers: {
        ...getBrowserHeaders(wpUrl),
        'Accept': 'application/json',
      },
    }
  ));

  // Test 5: Authentication test (if credentials provided)
  if (authHeader) {
    tests.push(await runTest(
      'Authentication Test',
      `${wpUrl}/wp-json/wp/v2/users/me`,
      {
        method: 'GET',
        headers: {
          ...getBrowserHeaders(wpUrl),
          'Authorization': authHeader,
          'Accept': 'application/json',
        },
      }
    ));
  }

  // Analyze results and generate recommendations
  const recommendations: string[] = [];
  const siteReachable = tests[0]?.success;
  const restApiWorks = tests[1]?.success;
  const wpV2Works = tests[2]?.success;
  const postsWork = tests[3]?.success;
  const authWorks = tests[4]?.success;

  if (!siteReachable) {
    recommendations.push(
      '⚠️ SITE NIET BEREIKBAAR',
      '',
      'De WordPress site kan niet bereikt worden. Mogelijke oorzaken:',
      '  1. WordPress URL is incorrect',
      '  2. Site is offline',
      '  3. Firewall blokkeert verbindingen',
      '  4. DNS problemen',
      '',
      'Oplossingen:',
      '  - Test de URL in een browser',
      '  - Ping de hostname om DNS te checken',
      '  - Controleer firewall instellingen',
    );
  } else if (!restApiWorks) {
    recommendations.push(
      '⚠️ REST API GEBLOKKEERD OF UITGESCHAKELD',
      '',
      'De site is bereikbaar maar de REST API werkt niet. Mogelijke oorzaken:',
      '  1. REST API is uitgeschakeld',
      '  2. Security plugin blokkeert de REST API',
      '  3. .htaccess regels blokkeren /wp-json/',
      '  4. Permalink instellingen zijn incorrect',
      '',
      'Oplossingen:',
      '  - Check WordPress Settings > Permalinks en sla opnieuw op',
      '  - Controleer security plugins (Wordfence, iThemes, etc.)',
      '  - Test /wp-json/ in de browser - krijg je een JSON response?',
      '  - Check .htaccess voor regels die /wp-json/ blokkeren',
    );
  } else if (!wpV2Works) {
    recommendations.push(
      '⚠️ WORDPRESS V2 API NIET BESCHIKBAAR',
      '',
      'De REST API werkt, maar de WordPress v2 namespace is niet beschikbaar.',
      'Dit is ongebruikelijk en kan wijzen op:',
      '  1. Verouderde WordPress versie (< 4.7)',
      '  2. Plugin die de v2 API disabled',
      '',
      'Oplossingen:',
      '  - Update WordPress naar de laatste versie',
      '  - Check welke namespaces beschikbaar zijn op /wp-json/',
    );
  } else if (authHeader && !authWorks) {
    const authTest = tests.find(t => t.name === 'Authentication Test');
    if (authTest?.status === 401) {
      recommendations.push(
        '⚠️ AUTHENTICATIE MISLUKT (401 Unauthorized)',
        '',
        'De credentials zijn incorrect of ongeldig.',
        '',
        'Oplossingen:',
        '  1. Genereer een NIEUW Application Password:',
        '     - WordPress Admin → Gebruikers → Profiel',
        '     - Scroll naar "Application Passwords"',
        '     - Geef een naam (bijv. "Writgo") en klik "Add New"',
        '     - Kopieer het password EXACT (inclusief spaties)',
        '  2. Controleer de gebruikersnaam (let op hoofdletters)',
        '  3. Gebruik NIET je normale WordPress wachtwoord',
      );
    } else if (authTest?.status === 403) {
      recommendations.push(
        '⚠️ TOEGANG GEWEIGERD (403 Forbidden)',
        '',
        'Je bent geauthenticeerd, maar hebt geen toegang.',
        '',
        'Oplossingen:',
        '  1. Controleer of de gebruiker Administrator of Editor rol heeft',
        '  2. Check security plugin settings',
        '  3. Kijk of REST API permissions zijn aangepast',
      );
    }
  }

  // Dutch hosting specific recommendations
  if (isDutchDomain && !siteReachable) {
    recommendations.push(
      '',
      '📍 NEDERLANDSE HOSTING SPECIFIEK',
      '',
      'Veel Nederlandse hosting providers (Antagonist, TransIP, Byte, Vimexx)',
      'blokkeren cloud provider IPs (AWS, GCP, Azure) standaard.',
      '',
      'Als je draait op Render, Vercel, of andere cloud platforms:',
      '  1. Vraag je hosting provider om je server IP te whitelisten',
      '  2. Check je IP: curl https://api.ipify.org',
      '  3. Overweeg een Nederlandse VPS als proxy (TransIP, DigitalOcean AMS)',
    );
  }

  const overallSuccess = tests.every(t => t.success || t.name === 'Authentication Test');

  return {
    wpUrl,
    timestamp: new Date().toISOString(),
    tests,
    overallSuccess,
    recommendations,
  };
}

// Print the diagnostic report
function printReport(result: DiagnosticResult) {
  console.log('\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TEST RESULTATEN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const test of result.tests) {
    console.log(`\n${test.success ? '✅' : '❌'} ${test.name}`);
    console.log(`   ${test.message}`);
    if (test.timing) {
      console.log(`   Timing: ${test.timing}ms`);
    }
  }

  if (result.recommendations.length > 0) {
    console.log('\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  AANBEVELINGEN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n' + result.recommendations.join('\n'));
  }

  console.log('\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(result.overallSuccess ? '  ✅ ALLE TESTS GESLAAGD' : '  ❌ SOMMIGE TESTS MISLUKT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

// Run diagnostics
runDiagnostics()
  .then(result => {
    printReport(result);
    process.exit(result.overallSuccess ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Fatal error during diagnostics:', error);
    process.exit(1);
  });
