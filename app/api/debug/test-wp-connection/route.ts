import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to test WordPress connection and show our IP
 *
 * Usage: GET /api/debug/test-wp-connection?url=https://yogastartgids.nl
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testUrl = searchParams.get('url') || 'https://yogastartgids.nl';

  const result: any = {
    timestamp: new Date().toISOString(),
    renderInfo: {
      region: process.env.RENDER_REGION || 'unknown',
      nodeVersion: process.version,
    },
    ourIP: null,
    tests: {},
  };

  // Get our outbound IP
  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(5000),
    });
    const ipData = await ipResponse.json();
    result.ourIP = ipData.ip;
  } catch (e: any) {
    result.ourIP = `Error: ${e.message}`;
  }

  // Test 1: Basic fetch to homepage
  try {
    const start = Date.now();
    const response = await fetch(testUrl, {
      signal: AbortSignal.timeout(30000),
    });
    const duration = Date.now() - start;

    result.tests.homepage = {
      success: response.ok,
      status: response.status,
      duration: `${duration}ms`,
      server: response.headers.get('server'),
    };
  } catch (e: any) {
    result.tests.homepage = {
      success: false,
      error: e.message,
      cause: e.cause?.message || e.cause,
    };
  }

  // Test 2: WordPress REST API
  const wpJsonUrl = `${testUrl.replace(/\/$/, '')}/wp-json`;
  try {
    const start = Date.now();
    const response = await fetch(wpJsonUrl, {
      signal: AbortSignal.timeout(30000),
    });
    const duration = Date.now() - start;

    result.tests.restAPI = {
      success: response.ok,
      status: response.status,
      duration: `${duration}ms`,
    };
  } catch (e: any) {
    result.tests.restAPI = {
      success: false,
      error: e.message,
      cause: e.cause?.message || e.cause,
    };
  }

  // Diagnosis
  const diagnosis: string[] = [];

  if (result.tests.homepage?.success && result.tests.restAPI?.success) {
    diagnosis.push('✅ WordPress site is BEREIKBAAR vanaf Render!');
    diagnosis.push('Het timeout probleem is opgelost met de retry logic.');
  } else if (!result.tests.homepage?.success && !result.tests.restAPI?.success) {
    diagnosis.push('❌ WordPress site is NIET bereikbaar vanaf Render');
    diagnosis.push(`Our IP: ${result.ourIP}`);
    diagnosis.push('');
    diagnosis.push('OPLOSSING:');
    diagnosis.push('1. Vraag WordPress hosting provider om dit IP te whitelisten');
    diagnosis.push('2. Of: Gebruik Render Static IP add-on');
    diagnosis.push('3. Of: Setup proxy (zie PROXY_SETUP_GUIDE.md)');
  } else if (result.tests.homepage?.success && !result.tests.restAPI?.success) {
    diagnosis.push('⚠️ Site bereikbaar MAAR REST API geblokkeerd');
    diagnosis.push('Dit is vaak een security plugin (Wordfence, etc.)');
    diagnosis.push('');
    diagnosis.push('OPLOSSING:');
    diagnosis.push('1. Disable security plugin tijdelijk om te testen');
    diagnosis.push('2. Whitelist /wp-json/ in security plugin');
  }

  result.diagnosis = diagnosis;

  return NextResponse.json(result, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
