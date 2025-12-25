#!/usr/bin/env node
/**
 * WordPress Connection Diagnostic Script
 *
 * This script tests WordPress API connectivity and helps diagnose connection issues.
 * Usage: node scripts/test-wordpress-connection.js <wordpress-url> [api-key]
 */

const https = require('https');
const http = require('http');
const dns = require('dns').promises;

const wpUrl = process.argv[2];
const apiKey = process.argv[3];

if (!wpUrl) {
  console.error('Usage: node test-wordpress-connection.js <wordpress-url> [api-key]');
  console.error('Example: node test-wordpress-connection.js https://yogastartgids.nl abc123');
  process.exit(1);
}

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

async function testDNS(hostname) {
  logInfo(`Testing DNS resolution for ${hostname}...`);
  try {
    const addresses = await dns.resolve4(hostname);
    logSuccess(`DNS resolved to: ${addresses.join(', ')}`);
    return { success: true, addresses };
  } catch (error) {
    logError(`DNS resolution failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          data: data,
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout after 30 seconds'));
    });

    req.end();
  });
}

async function testSiteReachability(url) {
  logInfo(`Testing site reachability: ${url}`);
  const startTime = Date.now();

  try {
    const response = await makeRequest(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
      },
    });

    const duration = Date.now() - startTime;

    if (response.statusCode >= 200 && response.statusCode < 400) {
      logSuccess(`Site reachable (HTTP ${response.statusCode}) in ${duration}ms`);
      return { success: true, statusCode: response.statusCode, duration };
    } else {
      logWarning(`Site returned HTTP ${response.statusCode}: ${response.statusMessage}`);
      return { success: false, statusCode: response.statusCode };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(`Site not reachable: ${error.message} (after ${duration}ms)`);
    return { success: false, error: error.message, duration };
  }
}

async function testRestAPI(wpUrl) {
  logInfo(`Testing WordPress REST API: ${wpUrl}/wp-json/`);
  const startTime = Date.now();

  try {
    const response = await makeRequest(`${wpUrl}/wp-json/`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    const duration = Date.now() - startTime;

    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      logSuccess(`REST API is active (${duration}ms)`);

      if (data.namespaces) {
        logInfo(`Available namespaces: ${data.namespaces.join(', ')}`);

        if (data.namespaces.includes('writgo/v1')) {
          logSuccess('WritGo Connector plugin detected!');
        } else {
          logWarning('WritGo Connector plugin NOT found - install it first');
        }
      }

      return { success: true, data };
    } else {
      logError(`REST API returned HTTP ${response.statusCode}`);
      return { success: false };
    }
  } catch (error) {
    logError(`REST API test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testWritgoHealth(wpUrl, apiKey) {
  logInfo(`Testing WritGo Connector health endpoint...`);

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
  };

  if (apiKey) {
    headers['X-Writgo-API-Key'] = apiKey;
    logInfo(`Using API Key: ${apiKey.substring(0, 8)}...`);
  }

  try {
    const response = await makeRequest(`${wpUrl}/wp-json/writgo/v1/health`, {
      method: 'GET',
      headers,
    });

    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      logSuccess(`WritGo health check passed`);
      console.log(JSON.stringify(data, null, 2));

      if (data.plugin_version) {
        logInfo(`Plugin version: ${data.plugin_version}`);
      }

      return { success: true, data };
    } else if (response.statusCode === 404) {
      logError('WritGo Connector plugin not found (404)');
      logInfo('Install the WritGo Connector plugin from WordPress admin');
      return { success: false, error: 'Plugin not found' };
    } else {
      logError(`Health check returned HTTP ${response.statusCode}`);
      console.log('Response:', response.data);
      return { success: false };
    }
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testWritgoPosts(wpUrl, apiKey) {
  if (!apiKey) {
    logWarning('Skipping posts test - no API key provided');
    return { success: false, error: 'No API key' };
  }

  logInfo(`Testing WritGo posts endpoint with authentication...`);

  try {
    const response = await makeRequest(`${wpUrl}/wp-json/writgo/v1/posts?per_page=1`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'X-Writgo-API-Key': apiKey,
      },
    });

    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      logSuccess(`Posts endpoint accessible (${Array.isArray(data) ? data.length : 0} posts)`);
      return { success: true, data };
    } else if (response.statusCode === 401) {
      logError('Authentication failed (401) - check your API key');
      return { success: false, error: 'Invalid API key' };
    } else if (response.statusCode === 403) {
      logError('Access forbidden (403) - check permissions');
      return { success: false, error: 'Forbidden' };
    } else {
      logError(`Posts endpoint returned HTTP ${response.statusCode}`);
      console.log('Response:', response.data.substring(0, 200));
      return { success: false };
    }
  } catch (error) {
    logError(`Posts test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  log('\n═══════════════════════════════════════════════════════════', 'bright');
  log('           WordPress Connection Diagnostic Tool             ', 'bright');
  log('═══════════════════════════════════════════════════════════\n', 'bright');

  const urlObj = new URL(wpUrl);
  logInfo(`Testing connection to: ${wpUrl}`);
  logInfo(`Hostname: ${urlObj.hostname}`);
  logInfo(`Protocol: ${urlObj.protocol}`);
  if (apiKey) {
    logInfo(`API Key provided: ${apiKey.substring(0, 8)}***`);
  } else {
    logWarning('No API key provided - limited testing available');
  }
  console.log('');

  // Test 1: DNS
  log('─────────────────────────────────────────────────────────────', 'bright');
  log('TEST 1: DNS Resolution', 'bright');
  log('─────────────────────────────────────────────────────────────', 'bright');
  const dnsResult = await testDNS(urlObj.hostname);
  console.log('');

  if (!dnsResult.success) {
    logError('DNS resolution failed - cannot proceed with further tests');
    process.exit(1);
  }

  // Test 2: Site Reachability
  log('─────────────────────────────────────────────────────────────', 'bright');
  log('TEST 2: Site Reachability', 'bright');
  log('─────────────────────────────────────────────────────────────', 'bright');
  const siteResult = await testSiteReachability(wpUrl);
  console.log('');

  // Test 3: REST API
  log('─────────────────────────────────────────────────────────────', 'bright');
  log('TEST 3: WordPress REST API', 'bright');
  log('─────────────────────────────────────────────────────────────', 'bright');
  const apiResult = await testRestAPI(wpUrl);
  console.log('');

  // Test 4: WritGo Health
  log('─────────────────────────────────────────────────────────────', 'bright');
  log('TEST 4: WritGo Connector Health', 'bright');
  log('─────────────────────────────────────────────────────────────', 'bright');
  const healthResult = await testWritgoHealth(wpUrl, apiKey);
  console.log('');

  // Test 5: WritGo Posts (only if API key provided)
  if (apiKey) {
    log('─────────────────────────────────────────────────────────────', 'bright');
    log('TEST 5: WritGo Posts Authentication', 'bright');
    log('─────────────────────────────────────────────────────────────', 'bright');
    const postsResult = await testWritgoPosts(wpUrl, apiKey);
    console.log('');
  }

  // Summary
  log('═══════════════════════════════════════════════════════════', 'bright');
  log('                         SUMMARY                             ', 'bright');
  log('═══════════════════════════════════════════════════════════', 'bright');

  const results = {
    'DNS Resolution': dnsResult.success,
    'Site Reachable': siteResult.success,
    'REST API': apiResult.success,
    'WritGo Plugin': healthResult.success,
  };

  for (const [test, passed] of Object.entries(results)) {
    if (passed) {
      logSuccess(`${test.padEnd(25)} PASSED`);
    } else {
      logError(`${test.padEnd(25)} FAILED`);
    }
  }

  console.log('');

  if (Object.values(results).every(v => v)) {
    log('🎉 All tests passed! WordPress connection is working correctly.', 'green');
  } else {
    log('⚠️  Some tests failed. Check the output above for details.', 'yellow');
  }

  console.log('');
}

main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
