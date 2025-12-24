/**
 * WordPress Request Diagnostics Module
 *
 * Provides detailed diagnostics for debugging blocked requests from cloud providers
 * like Render.com to Dutch WordPress hosting providers.
 *
 * Common blocking patterns by Dutch hosters:
 * - Antagonist: ModSecurity with cloud IP blacklists
 * - TransIP: Rate limiting on cloud IPs
 * - Byte: Wordfence/Sucuri integration
 * - Vimexx: CloudFlare with strict rules
 * - Hostnet: Custom WAF rules
 */

export interface RequestDiagnostics {
  timestamp: string;
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  responseStatus?: number;
  responseStatusText?: string;
  responseHeaders?: Record<string, string>;
  errorCode?: string;
  errorMessage?: string;
  errorCause?: string;
  dnsResolution?: {
    success: boolean;
    addresses?: string[];
    error?: string;
  };
  blockingIndicators: BlockingIndicator[];
  suggestedFixes: string[];
  timing: {
    dnsMs?: number;
    connectMs?: number;
    responseMs?: number;
    totalMs: number;
  };
}

export interface BlockingIndicator {
  type: 'WAF' | 'RATE_LIMIT' | 'IP_BLOCK' | 'GEO_BLOCK' | 'BOT_DETECTION' | 'SSL' | 'UNKNOWN';
  confidence: 'high' | 'medium' | 'low';
  evidence: string;
}

/**
 * Common WAF/security product signatures in response headers
 */
const WAF_SIGNATURES: Record<string, string> = {
  'cf-ray': 'Cloudflare',
  'x-sucuri-id': 'Sucuri Firewall',
  'x-sucuri-cache': 'Sucuri Firewall',
  'x-wordfence-blocked': 'Wordfence',
  'x-mod-security': 'ModSecurity',
  'x-waf-status': 'Generic WAF',
  'x-firewall': 'Generic Firewall',
  'x-cdn': 'CDN/Proxy',
  'server': 'Server identification',
  'x-powered-by': 'Technology stack',
};

/**
 * Known Dutch hosting provider IP blocking patterns
 */
const DUTCH_HOSTER_PATTERNS: Record<string, { domains: string[], knownIssues: string[] }> = {
  antagonist: {
    domains: ['antagonist.nl', 'hostingondemand.nl'],
    knownIssues: ['ModSecurity blocks AWS/GCP IPs', 'Strict rate limiting'],
  },
  transip: {
    domains: ['transip.nl', 'transip.eu'],
    knownIssues: ['Rate limiting on cloud IPs', 'Bot detection active'],
  },
  byte: {
    domains: ['byte.nl'],
    knownIssues: ['Sucuri/Wordfence common', 'IP reputation filtering'],
  },
  vimexx: {
    domains: ['vimexx.nl', 'vimexx.eu'],
    knownIssues: ['Cloudflare protection common', 'Challenge pages'],
  },
  hostnet: {
    domains: ['hostnet.nl'],
    knownIssues: ['Custom WAF rules', 'Geographic restrictions'],
  },
  strato: {
    domains: ['strato.nl', 'strato.de'],
    knownIssues: ['Strict bot filtering', 'Rate limiting'],
  },
  one: {
    domains: ['one.com'],
    knownIssues: ['SiteLock protection', 'Geographic filtering'],
  },
};

/**
 * Analyze response headers to detect blocking patterns
 */
export function analyzeBlockingIndicators(
  status: number,
  headers: Record<string, string>,
  errorCode?: string
): BlockingIndicator[] {
  const indicators: BlockingIndicator[] = [];

  // Check for WAF signatures in headers
  for (const [header, product] of Object.entries(WAF_SIGNATURES)) {
    const headerLower = header.toLowerCase();
    for (const [respHeader, value] of Object.entries(headers)) {
      if (respHeader.toLowerCase() === headerLower) {
        indicators.push({
          type: 'WAF',
          confidence: 'high',
          evidence: `${product} detected: ${header}=${value}`,
        });
      }
    }
  }

  // Status code analysis
  if (status === 403) {
    indicators.push({
      type: 'IP_BLOCK',
      confidence: 'high',
      evidence: 'HTTP 403 Forbidden - likely IP or request blocked by firewall',
    });
  }

  if (status === 406) {
    indicators.push({
      type: 'BOT_DETECTION',
      confidence: 'high',
      evidence: 'HTTP 406 Not Acceptable - request rejected, possibly due to User-Agent or Accept headers',
    });
  }

  if (status === 429) {
    indicators.push({
      type: 'RATE_LIMIT',
      confidence: 'high',
      evidence: 'HTTP 429 Too Many Requests - rate limiting active',
    });
  }

  if (status === 451) {
    indicators.push({
      type: 'GEO_BLOCK',
      confidence: 'high',
      evidence: 'HTTP 451 Unavailable For Legal Reasons - geographic/legal blocking',
    });
  }

  if (status === 503) {
    const serverHeader = headers['server']?.toLowerCase() || '';
    if (serverHeader.includes('cloudflare') || headers['cf-ray']) {
      indicators.push({
        type: 'WAF',
        confidence: 'high',
        evidence: 'Cloudflare 503 - challenge page or rate limiting',
      });
    } else {
      indicators.push({
        type: 'RATE_LIMIT',
        confidence: 'medium',
        evidence: 'HTTP 503 Service Unavailable - server overload or blocking',
      });
    }
  }

  // Check for challenge pages (Cloudflare, etc.)
  const contentType = headers['content-type'] || '';
  if (status === 403 || status === 503) {
    if (contentType.includes('text/html')) {
      indicators.push({
        type: 'BOT_DETECTION',
        confidence: 'medium',
        evidence: 'HTML response on API endpoint - possible challenge page',
      });
    }
  }

  // Connection refused usually means firewall
  if (errorCode === 'ECONNREFUSED') {
    indicators.push({
      type: 'IP_BLOCK',
      confidence: 'high',
      evidence: 'Connection refused - firewall blocking incoming connections',
    });
  }

  // Timeout patterns
  if (errorCode === 'ETIMEDOUT' || errorCode === 'UND_ERR_CONNECT_TIMEOUT') {
    indicators.push({
      type: 'IP_BLOCK',
      confidence: 'medium',
      evidence: 'Connection timeout - possible silent drop by firewall',
    });
  }

  return indicators;
}

/**
 * Generate suggested fixes based on blocking indicators
 */
export function generateSuggestedFixes(
  indicators: BlockingIndicator[],
  hostname: string
): string[] {
  const fixes: string[] = [];
  const types = new Set(indicators.map(i => i.type));

  // Always suggest basic checks first
  fixes.push(
    '1. VERIFY: Test the WordPress URL in a browser to confirm it works'
  );

  if (types.has('IP_BLOCK') || types.has('WAF')) {
    fixes.push(
      '2. WHITELIST: Ask the hosting provider to whitelist these Render.com IP ranges:',
      '   - Check current IP: https://api.ipify.org from your Render service',
      '   - Render uses dynamic AWS IPs in us-east-1 and eu-central-1 regions',
      '',
      '3. WORDFENCE: If using Wordfence, add exception for your Render IP:',
      '   - WordPress Admin → Wordfence → Firewall → Blocking → Advanced Blocking',
      '   - Add IP range to whitelist',
      '',
      '4. PROXY: Use a residential proxy service to avoid cloud IP blocks:',
      '   - BrightData (formerly Luminati)',
      '   - Oxylabs',
      '   - Smartproxy',
    );
  }

  if (types.has('BOT_DETECTION')) {
    fixes.push(
      '5. HEADERS: Ensure request uses realistic browser headers (already configured)',
      '6. COOKIES: Some sites require session cookies - consider headless browser',
    );
  }

  if (types.has('RATE_LIMIT')) {
    fixes.push(
      '7. RATE LIMIT: Reduce request frequency or contact hosting for higher limits',
      '8. CACHING: Implement response caching to reduce API calls',
    );
  }

  if (types.has('GEO_BLOCK')) {
    fixes.push(
      '9. GEO: Your Render region may be blocked. Try deploying in EU region (Frankfurt)',
      '10. VPN/PROXY: Use a Netherlands-based proxy',
    );
  }

  // Dutch hosting specific advice
  const dutchHosters = Object.entries(DUTCH_HOSTER_PATTERNS).filter(([_, info]) =>
    info.domains.some(domain => hostname.includes(domain))
  );

  if (dutchHosters.length > 0) {
    const [hosterName, hosterInfo] = dutchHosters[0];
    fixes.push(
      '',
      `KNOWN ISSUES WITH ${hosterName.toUpperCase()}:`,
      ...hosterInfo.knownIssues.map(issue => `   - ${issue}`),
    );
  }

  // General Dutch hosting advice
  if (hostname.endsWith('.nl') || hostname.endsWith('.be')) {
    fixes.push(
      '',
      'DUTCH HOSTING GENERAL ADVICE:',
      '   - Many Dutch hosters block AWS/GCP/Azure IP ranges by default',
      '   - Contact hosting support to whitelist specific IPs',
      '   - Consider using a Dutch VPS as proxy (TransIP VPS, DigitalOcean AMS)',
      '   - Some hosts allow API access only from specific countries',
    );
  }

  return fixes;
}

/**
 * Create a full diagnostic report for a failed request
 */
export function createDiagnosticReport(
  url: string,
  method: string,
  requestHeaders: Record<string, string>,
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
  },
  error?: {
    code?: string;
    message: string;
    cause?: string;
  },
  timing?: {
    dnsMs?: number;
    connectMs?: number;
    responseMs?: number;
    totalMs: number;
  }
): RequestDiagnostics {
  const hostname = new URL(url).hostname;

  const blockingIndicators = analyzeBlockingIndicators(
    response?.status || 0,
    response?.headers || {},
    error?.code
  );

  const suggestedFixes = generateSuggestedFixes(blockingIndicators, hostname);

  return {
    timestamp: new Date().toISOString(),
    url,
    method,
    requestHeaders,
    responseStatus: response?.status,
    responseStatusText: response?.statusText,
    responseHeaders: response?.headers,
    errorCode: error?.code,
    errorMessage: error?.message,
    errorCause: error?.cause,
    blockingIndicators,
    suggestedFixes,
    timing: timing || { totalMs: 0 },
  };
}

/**
 * Format diagnostic report for logging
 */
export function formatDiagnosticReport(report: RequestDiagnostics): string {
  const lines: string[] = [
    '',
    '═══════════════════════════════════════════════════════════════',
    '                 WORDPRESS REQUEST DIAGNOSTICS                  ',
    '═══════════════════════════════════════════════════════════════',
    '',
    `📅 Timestamp: ${report.timestamp}`,
    `🌐 URL: ${report.url}`,
    `📤 Method: ${report.method}`,
    '',
    '─────────────────────────────────────────────────────────────────',
    '                       REQUEST HEADERS                          ',
    '─────────────────────────────────────────────────────────────────',
  ];

  for (const [key, value] of Object.entries(report.requestHeaders)) {
    // Mask authorization header
    const displayValue = key.toLowerCase() === 'authorization'
      ? value.substring(0, 10) + '...[MASKED]'
      : value;
    lines.push(`   ${key}: ${displayValue}`);
  }

  if (report.responseStatus) {
    lines.push(
      '',
      '─────────────────────────────────────────────────────────────────',
      '                       RESPONSE INFO                            ',
      '─────────────────────────────────────────────────────────────────',
      `   Status: ${report.responseStatus} ${report.responseStatusText}`,
    );

    if (report.responseHeaders) {
      lines.push('', '   Response Headers:');
      for (const [key, value] of Object.entries(report.responseHeaders)) {
        lines.push(`      ${key}: ${value}`);
      }
    }
  }

  if (report.errorCode || report.errorMessage) {
    lines.push(
      '',
      '─────────────────────────────────────────────────────────────────',
      '                          ERROR INFO                            ',
      '─────────────────────────────────────────────────────────────────',
      `   Code: ${report.errorCode || 'N/A'}`,
      `   Message: ${report.errorMessage}`,
    );
    if (report.errorCause) {
      lines.push(`   Cause: ${report.errorCause}`);
    }
  }

  lines.push(
    '',
    '─────────────────────────────────────────────────────────────────',
    '                         TIMING INFO                             ',
    '─────────────────────────────────────────────────────────────────',
    `   DNS Resolution: ${report.timing.dnsMs ?? 'N/A'}ms`,
    `   Connection: ${report.timing.connectMs ?? 'N/A'}ms`,
    `   Response: ${report.timing.responseMs ?? 'N/A'}ms`,
    `   Total: ${report.timing.totalMs}ms`,
  );

  if (report.blockingIndicators.length > 0) {
    lines.push(
      '',
      '─────────────────────────────────────────────────────────────────',
      '                    ⚠️  BLOCKING DETECTED                       ',
      '─────────────────────────────────────────────────────────────────',
    );
    for (const indicator of report.blockingIndicators) {
      lines.push(
        `   [${indicator.confidence.toUpperCase()}] ${indicator.type}`,
        `      └─ ${indicator.evidence}`,
      );
    }
  }

  if (report.suggestedFixes.length > 0) {
    lines.push(
      '',
      '─────────────────────────────────────────────────────────────────',
      '                      💡 SUGGESTED FIXES                        ',
      '─────────────────────────────────────────────────────────────────',
      ...report.suggestedFixes.map(fix => `   ${fix}`),
    );
  }

  lines.push(
    '',
    '═══════════════════════════════════════════════════════════════',
    ''
  );

  return lines.join('\n');
}

/**
 * Advanced headers configuration to avoid bot detection
 * These mimic a real Chrome browser request more closely
 */
export function getAdvancedBrowserHeaders(referer?: string): Record<string, string> {
  // Use a realistic, current Chrome User-Agent
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  return {
    // Core browser headers
    'User-Agent': userAgent,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',

    // Security headers that browsers send
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',

    // Optional referer from the same site
    ...(referer ? { 'Referer': referer } : {}),

    // Connection headers
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',

    // DNT (Do Not Track) - makes it look like a real browser
    'DNT': '1',
  };
}

/**
 * Get headers specifically for WordPress REST API requests
 * Combines browser headers with WordPress-specific requirements
 */
export function getWordPressApiHeaders(
  authHeader: string,
  wpUrl: string
): Record<string, string> {
  const browserHeaders = getAdvancedBrowserHeaders(wpUrl);

  return {
    ...browserHeaders,
    'Authorization': authHeader,
    'Content-Type': 'application/json',
    // Override Accept for JSON API
    'Accept': 'application/json',
    // WordPress-specific: indicate we support the REST API
    'X-WP-Nonce': '',  // Empty but present - some security plugins check for this header
  };
}
