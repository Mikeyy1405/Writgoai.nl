
/**
 * Google Search Console API Integration
 * Haalt performance data op voor URLs via Google Search Console API
 */

import { prisma } from '@/lib/db';

// Google Search Console API endpoint
const GSC_API_BASE = 'https://www.googleapis.com/webmasters/v3';

export interface GSCPerformanceData {
  url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  averagePosition: number;
  topQueries: {
    query: string;
    clicks: number;
    impressions: number;
    position: number;
  }[];
}

export interface GSCComparisonData extends GSCPerformanceData {
  clicksChange: number;
  impressionsChange: number;
  ctrChange: number;
  positionChange: number;
}

export interface GSCSitemap {
  path: string;
  lastSubmitted: string;
  isPending: boolean;
  isSitemapsIndex: boolean;
  type: string;
  contents?: {
    type: string;
    submitted: number;
    indexed: number;
  }[];
}

export interface GSCUrlInspection {
  url: string;
  indexStatus: 'INDEXED' | 'NOT_INDEXED' | 'PROCESSING';
  coverageState: string;
  lastCrawlTime?: string;
  pageTitle?: string;
}

export interface ExistingPageData {
  url: string;
  title?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  averagePosition: number;
  indexStatus: 'INDEXED' | 'NOT_INDEXED' | 'PROCESSING' | 'UNKNOWN';
  lastCrawlTime?: string;
  topKeywords: string[];
  isDuplicate?: boolean;
  duplicateScore?: number;
}

/**
 * Haalt OAuth access token op
 */
async function getAccessToken(): Promise<string | null> {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const authPath = path.join('/home/ubuntu/.config', 'abacusai_auth_secrets.json');
    
    const authData = JSON.parse(await fs.readFile(authPath, 'utf8'));
    
    // Check for Google Search Console token
    const gscToken = authData?.['google search console']?.secrets?.access_token?.value;
    return gscToken || null;
  } catch (error) {
    console.error('Error reading GSC auth token:', error);
    return null;
  }
}

/**
 * Krijg nieuwe access token via OAuth refresh
 */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const authPath = path.join('/home/ubuntu/.config', 'abacusai_auth_secrets.json');
    
    const authData = JSON.parse(await fs.readFile(authPath, 'utf8'));
    const refreshToken = authData?.['google search console']?.secrets?.refresh_token?.value;
    const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET;
    
    if (!refreshToken || !clientId || !clientSecret) {
      return null;
    }
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Update het access token in de auth file
    authData['google search console'].secrets.access_token.value = data.access_token;
    authData['google search console'].secrets.access_token.expires_at = 
      new Date(Date.now() + data.expires_in * 1000).toISOString();
    
    await fs.writeFile(authPath, JSON.stringify(authData, null, 2), 'utf8');
    
    return data.access_token;
  } catch (error) {
    console.error('Error refreshing GSC access token:', error);
    return null;
  }
}

/**
 * Haalt performance data op voor een specifieke site
 */
export async function fetchSitePerformance(
  siteUrl: string,
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<GSCPerformanceData[]> {
  const response = await fetch(
    `${GSC_API_BASE}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ['page', 'query'],
        rowLimit: 25000, // Max rows per request
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GSC API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  
  // Groepeer data per URL
  const urlMap = new Map<string, GSCPerformanceData>();
  
  data.rows?.forEach((row: any) => {
    const url = row.keys[0];
    const query = row.keys[1];
    
    if (!urlMap.has(url)) {
      urlMap.set(url, {
        url,
        clicks: 0,
        impressions: 0,
        ctr: 0,
        averagePosition: 0,
        topQueries: [],
      });
    }
    
    const urlData = urlMap.get(url)!;
    urlData.clicks += row.clicks;
    urlData.impressions += row.impressions;
    
    // Voeg query toe aan topQueries
    urlData.topQueries.push({
      query,
      clicks: row.clicks,
      impressions: row.impressions,
      position: row.position,
    });
  });
  
  // Bereken CTR en gemiddelde positie per URL
  const results: GSCPerformanceData[] = [];
  
  urlMap.forEach((urlData) => {
    urlData.ctr = urlData.impressions > 0 
      ? (urlData.clicks / urlData.impressions) * 100 
      : 0;
    
    // Sort queries by clicks
    urlData.topQueries.sort((a, b) => b.clicks - a.clicks);
    urlData.topQueries = urlData.topQueries.slice(0, 10); // Top 10 queries
    
    // Gemiddelde positie
    if (urlData.topQueries.length > 0) {
      const totalPosition = urlData.topQueries.reduce((sum, q) => sum + q.position, 0);
      urlData.averagePosition = totalPosition / urlData.topQueries.length;
    }
    
    results.push(urlData);
  });
  
  return results;
}

/**
 * Vergelijkt huidige data met vorige periode
 */
export async function fetchPerformanceWithComparison(
  siteUrl: string,
  accessToken: string,
  days: number = 28
): Promise<GSCComparisonData[]> {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days);
  
  const previousStartDate = new Date(startDate);
  previousStartDate.setDate(startDate.getDate() - days);
  const previousEndDate = new Date(startDate);
  previousEndDate.setDate(startDate.getDate() - 1);
  
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  
  // Haal beide periodes op
  const [currentData, previousData] = await Promise.all([
    fetchSitePerformance(siteUrl, accessToken, formatDate(startDate), formatDate(today)),
    fetchSitePerformance(siteUrl, accessToken, formatDate(previousStartDate), formatDate(previousEndDate)),
  ]);
  
  // Vergelijk data
  const results: GSCComparisonData[] = currentData.map((current) => {
    const previous = previousData.find((p) => p.url === current.url);
    
    if (!previous) {
      return {
        ...current,
        clicksChange: 100, // Nieuwe URL, 100% groei
        impressionsChange: 100,
        ctrChange: 100,
        positionChange: 0,
      };
    }
    
    const clicksChange = previous.clicks > 0
      ? ((current.clicks - previous.clicks) / previous.clicks) * 100
      : 0;
    
    const impressionsChange = previous.impressions > 0
      ? ((current.impressions - previous.impressions) / previous.impressions) * 100
      : 0;
    
    const ctrChange = previous.ctr > 0
      ? ((current.ctr - previous.ctr) / previous.ctr) * 100
      : 0;
    
    const positionChange = current.averagePosition - previous.averagePosition;
    
    return {
      ...current,
      clicksChange,
      impressionsChange,
      ctrChange,
      positionChange,
    };
  });
  
  return results;
}

/**
 * Sync GSC data voor een project
 */
export async function syncProjectGSCData(projectId: string, clientId: string): Promise<void> {
  // Haal project op
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      googleSearchConsoleSiteUrl: true,
      googleSearchConsoleEnabled: true,
    },
  });
  
  if (!project?.googleSearchConsoleEnabled || !project.googleSearchConsoleSiteUrl) {
    throw new Error('Google Search Console is niet ingeschakeld voor dit project');
  }
  
  // Haal access token op
  let accessToken = await getAccessToken();
  if (!accessToken) {
    accessToken = await refreshAccessToken();
    if (!accessToken) {
      throw new Error('Geen Google Search Console toegang. Koppel eerst je Google account.');
    }
  }
  
  // Haal performance data op (laatste 28 dagen + vergelijking)
  const performanceData = await fetchPerformanceWithComparison(
    project.googleSearchConsoleSiteUrl,
    accessToken,
    28
  );
  
  // Opslaan in database
  for (const data of performanceData) {
    // Try to match URL with an article idea
    const articleIdea = await prisma.articleIdea.findFirst({
      where: {
        projectId,
        OR: [
          { 
            savedContent: {
              publishedUrl: {
                contains: data.url,
              }
            }
          },
          // Match op slug in URL
          {
            slug: {
              in: [
                data.url.split('/').filter(Boolean).pop() || '',
                data.url.split('/').filter(Boolean).slice(-2, -1)[0] || '',
              ]
            }
          }
        ],
      },
    });
    
    // Sla performance data op
    await prisma.searchConsolePerformance.upsert({
      where: {
        projectId_url_dataDate: {
          projectId,
          url: data.url,
          dataDate: new Date(),
        },
      },
      create: {
        projectId,
        url: data.url,
        articleIdeaId: articleIdea?.id,
        clicks: data.clicks,
        impressions: data.impressions,
        ctr: data.ctr,
        averagePosition: data.averagePosition,
        clicksChange: data.clicksChange,
        impressionsChange: data.impressionsChange,
        ctrChange: data.ctrChange,
        positionChange: data.positionChange,
        topQueries: data.topQueries,
        periodDays: 28,
      },
      update: {
        clicks: data.clicks,
        impressions: data.impressions,
        ctr: data.ctr,
        averagePosition: data.averagePosition,
        clicksChange: data.clicksChange,
        impressionsChange: data.impressionsChange,
        ctrChange: data.ctrChange,
        positionChange: data.positionChange,
        topQueries: data.topQueries,
        articleIdeaId: articleIdea?.id,
      },
    });
  }
  
  // Update laatste sync tijd
  await prisma.project.update({
    where: { id: projectId },
    data: {
      googleSearchConsoleLastSync: new Date(),
    },
  });
}

/**
 * Haalt performance data op voor een specifiek project uit de database
 */
export async function getProjectPerformance(
  projectId: string,
  sortBy: 'clicks' | 'impressions' | 'ctr' | 'position' = 'clicks',
  order: 'asc' | 'desc' = 'desc'
) {
  const performance = await prisma.searchConsolePerformance.findMany({
    where: {
      projectId,
    },
    include: {
      articleIdea: {
        select: {
          id: true,
          title: true,
          slug: true,
          focusKeyword: true,
        },
      },
    },
    orderBy: {
      [sortBy]: order,
    },
  });
  
  return performance;
}

/**
 * Normaliseer URL voor vergelijking
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Verwijder trailing slash en www
    let normalized = parsed.hostname.replace('www.', '') + parsed.pathname;
    normalized = normalized.replace(/\/$/, '');
    return normalized.toLowerCase();
  } catch {
    return url.toLowerCase().replace(/\/$/, '').replace('www.', '');
  }
}

/**
 * Bereken similarity score tussen twee strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 1.0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  
  // Levenshtein distance
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const costs = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[shorter.length] = lastValue;
  }
  
  const distance = costs[shorter.length];
  return 1 - distance / longer.length;
}

/**
 * Haal alle bestaande pagina's op van een site via Search Console
 */
export async function getAllSitePages(
  siteUrl: string,
  startDate?: string,
  endDate?: string
): Promise<ExistingPageData[]> {
  let accessToken = await getAccessToken();
  
  if (!accessToken) {
    accessToken = await refreshAccessToken();
    if (!accessToken) {
      throw new Error('Geen Google Search Console toegang. Koppel eerst je Google account.');
    }
  }
  
  // Default: laatste 28 dagen
  if (!startDate || !endDate) {
    const today = new Date();
    endDate = today.toISOString().split('T')[0];
    const start = new Date(today);
    start.setDate(today.getDate() - 28);
    startDate = start.toISOString().split('T')[0];
  }
  
  const response = await fetch(
    `${GSC_API_BASE}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ['page', 'query'],
        rowLimit: 25000,
      }),
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GSC API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  
  // Groepeer data per URL
  const urlMap = new Map<string, ExistingPageData>();
  
  data.rows?.forEach((row: any) => {
    const url = row.keys[0];
    const query = row.keys[1];
    
    if (!urlMap.has(url)) {
      urlMap.set(url, {
        url,
        clicks: 0,
        impressions: 0,
        ctr: 0,
        averagePosition: 0,
        indexStatus: 'INDEXED', // Als we data hebben, is het geïndexeerd
        topKeywords: [],
      });
    }
    
    const urlData = urlMap.get(url)!;
    urlData.clicks += row.clicks || 0;
    urlData.impressions += row.impressions || 0;
    
    // Voeg keyword toe
    if (query && !urlData.topKeywords.includes(query)) {
      urlData.topKeywords.push(query);
    }
  });
  
  // Bereken CTR per URL en sorteer keywords
  const results: ExistingPageData[] = [];
  
  urlMap.forEach((urlData) => {
    urlData.ctr = urlData.impressions > 0 
      ? (urlData.clicks / urlData.impressions) * 100 
      : 0;
    
    // Sorteer keywords op relevantie (meeste clicks)
    urlData.topKeywords = urlData.topKeywords.slice(0, 10);
    
    results.push(urlData);
  });
  
  return results.sort((a, b) => b.clicks - a.clicks);
}

/**
 * Check duplicate content tussen topics en bestaande pagina's
 */
export async function checkDuplicateContent(
  siteUrl: string,
  topics: { title: string; keywords?: string[] }[]
): Promise<Map<number, { isDuplicate: boolean; matchedUrl?: string; score: number; existingTitle?: string }>> {
  const existingPages = await getAllSitePages(siteUrl);
  const results = new Map();
  
  topics.forEach((topic, index) => {
    let bestMatch = {
      isDuplicate: false,
      matchedUrl: undefined as string | undefined,
      score: 0,
      existingTitle: undefined as string | undefined,
    };
    
    // Check tegen alle bestaande pagina's
    for (const page of existingPages) {
      // URL matching
      const urlPath = page.url.split('/').filter(Boolean).pop() || '';
      const topicSlug = topic.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      const urlScore = calculateSimilarity(urlPath, topicSlug);
      
      // Keyword matching
      let keywordScore = 0;
      if (topic.keywords && topic.keywords.length > 0) {
        const matchingKeywords = topic.keywords.filter(kw =>
          page.topKeywords.some(pk => 
            pk.toLowerCase().includes(kw.toLowerCase()) ||
            kw.toLowerCase().includes(pk.toLowerCase())
          )
        );
        keywordScore = matchingKeywords.length / topic.keywords.length;
      }
      
      // Title matching (extract from URL if no title)
      const pageTitle = urlPath.replace(/-/g, ' ');
      const titleScore = calculateSimilarity(topic.title, pageTitle);
      
      // Combined score (weighted)
      const combinedScore = (urlScore * 0.4) + (titleScore * 0.4) + (keywordScore * 0.2);
      
      if (combinedScore > bestMatch.score) {
        bestMatch = {
          isDuplicate: combinedScore > 0.7, // 70% threshold
          matchedUrl: page.url,
          score: combinedScore,
          existingTitle: pageTitle,
        };
      }
    }
    
    results.set(index, bestMatch);
  });
  
  return results;
}

/**
 * Haal site sitemaps op
 */
export async function getSiteSitemaps(siteUrl: string): Promise<GSCSitemap[]> {
  let accessToken = await getAccessToken();
  
  if (!accessToken) {
    accessToken = await refreshAccessToken();
    if (!accessToken) {
      throw new Error('Geen Google Search Console toegang.');
    }
  }
  
  const response = await fetch(
    `${GSC_API_BASE}/sites/${encodeURIComponent(siteUrl)}/sitemaps`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemaps: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.sitemap || [];
}

/**
 * Initialiseer OAuth flow (voor gebruik in UI)
 */
export function getOAuthUrl(redirectUri: string): string {
  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
  
  if (!clientId) {
    throw new Error('Google Search Console Client ID niet geconfigureerd');
  }
  
  const scopes = [
    'https://www.googleapis.com/auth/webmasters.readonly',
  ].join(' ');
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent',
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET;
  
  console.log('─────────────────────────────────────────────────');
  console.log('🔑 Starting Token Exchange');
  console.log('─────────────────────────────────────────────────');
  console.log('✓ Client ID:', clientId?.substring(0, 30) + '...');
  console.log('✓ Client Secret:', clientSecret ? '[PRESENT]' : '[MISSING]');
  console.log('✓ Redirect URI:', redirectUri);
  console.log('✓ Code:', code.substring(0, 30) + '... (length: ' + code.length + ')');
  
  if (!clientId || !clientSecret) {
    throw new Error('Google Search Console credentials niet geconfigureerd');
  }
  
  console.log('─────────────────────────────────────────────────');
  console.log('📡 Sending token request to Google...');
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  
  console.log('✓ Token exchange HTTP status:', response.status);
  console.log('✓ Response headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log('─────────────────────────────────────────────────');
    console.error('❌ Token Exchange Failed');
    console.log('─────────────────────────────────────────────────');
    console.error('✗ HTTP Status:', response.status, response.statusText);
    console.error('✗ Error response:', errorText);
    console.log('─────────────────────────────────────────────────');
    throw new Error(`Failed to exchange code: ${response.statusText} - ${errorText}`);
  }
  
  const tokens = await response.json();
  console.log('─────────────────────────────────────────────────');
  console.log('✅ Tokens Retrieved Successfully');
  console.log('─────────────────────────────────────────────────');
  console.log('✓ Access token:', tokens.access_token ? 'PRESENT (length: ' + tokens.access_token.length + ')' : 'MISSING');
  console.log('✓ Refresh token:', tokens.refresh_token ? 'PRESENT (length: ' + tokens.refresh_token.length + ')' : 'MISSING');
  console.log('✓ Expires in:', tokens.expires_in, 'seconds');
  console.log('✓ Token type:', tokens.token_type);
  
  // Save tokens to auth file
  console.log('─────────────────────────────────────────────────');
  console.log('💾 Saving Tokens to Auth File');
  console.log('─────────────────────────────────────────────────');
  
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const configDir = '/home/ubuntu/.config';
    const authPath = path.join(configDir, 'abacusai_auth_secrets.json');
    
    console.log('✓ Config directory:', configDir);
    console.log('✓ Auth file path:', authPath);
    
    // 🔧 FIX: Maak de directory aan als deze niet bestaat
    try {
      await fs.mkdir(configDir, { recursive: true });
      console.log('✓ Config directory exists or created');
    } catch (mkdirError) {
      console.log('⚠ Could not create config directory:', mkdirError);
    }
    
    let authData: any = {};
    try {
      const fileContent = await fs.readFile(authPath, 'utf8');
      authData = JSON.parse(fileContent);
      console.log('✓ Existing auth file loaded');
      console.log('✓ Current GSC keys:', Object.keys(authData['google search console']?.secrets || {}));
    } catch (e) {
      console.log('⚠ No existing auth file, creating new one');
      authData = {}; // Start met leeg object
    }
    
    // 🔧 FIX: Behoud bestaande secrets en voeg alleen tokens toe
    if (!authData['google search console']) {
      authData['google search console'] = { secrets: {} };
      console.log('✓ Created new GSC section');
    }
    if (!authData['google search console'].secrets) {
      authData['google search console'].secrets = {};
      console.log('✓ Created new secrets section');
    }
    
    // 🔧 FIX: Als client credentials niet bestaan in het bestand, haal ze uit env vars
    if (!authData['google search console'].secrets.client_id) {
      authData['google search console'].secrets.client_id = {
        value: clientId
      };
      console.log('✓ Added client_id from environment variables');
    }
    
    if (!authData['google search console'].secrets.client_secret) {
      authData['google search console'].secrets.client_secret = {
        value: clientSecret
      };
      console.log('✓ Added client_secret from environment variables');
    }
    
    // Bewaar bestaande client credentials
    const existingClientId = authData['google search console'].secrets.client_id;
    const existingClientSecret = authData['google search console'].secrets.client_secret;
    
    console.log('✓ Existing client_id:', existingClientId ? 'FOUND' : 'NOT FOUND');
    console.log('✓ Existing client_secret:', existingClientSecret ? 'FOUND' : 'NOT FOUND');
    
    // Voeg tokens toe zonder bestaande client_id en client_secret te overschrijven
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    
    authData['google search console'].secrets.access_token = {
      value: tokens.access_token,
      expires_at: expiresAt,
    };
    authData['google search console'].secrets.refresh_token = {
      value: tokens.refresh_token,
    };
    
    console.log('✓ Token expiry set to:', expiresAt);
    console.log('✓ Final GSC keys:', Object.keys(authData['google search console'].secrets));
    
    await fs.writeFile(authPath, JSON.stringify(authData, null, 2), 'utf8');
    
    // Verify het bestand is geschreven
    const verifyContent = await fs.readFile(authPath, 'utf8');
    const verifyData = JSON.parse(verifyContent);
    const hasAccessToken = !!verifyData['google search console']?.secrets?.access_token?.value;
    const hasRefreshToken = !!verifyData['google search console']?.secrets?.refresh_token?.value;
    
    console.log('─────────────────────────────────────────────────');
    console.log('✅ Auth File Written & Verified');
    console.log('─────────────────────────────────────────────────');
    console.log('✓ Access token saved:', hasAccessToken);
    console.log('✓ Refresh token saved:', hasRefreshToken);
    console.log('─────────────────────────────────────────────────');
    
    if (!hasAccessToken || !hasRefreshToken) {
      throw new Error('Token verification failed - tokens not found in saved file');
    }
  } catch (error) {
    console.log('─────────────────────────────────────────────────');
    console.error('❌ Failed to Save Tokens');
    console.log('─────────────────────────────────────────────────');
    console.error('✗ Error:', error);
    console.log('─────────────────────────────────────────────────');
    throw error;
  }
  
  return tokens;
}

/**
 * Haalt lijst van beschikbare GSC sites op voor de ingelogde gebruiker
 */
export async function listAvailableSites(): Promise<string[]> {
  let accessToken = await getAccessToken();
  
  if (!accessToken) {
    accessToken = await refreshAccessToken();
    if (!accessToken) {
      throw new Error('Geen Google Search Console toegang. Koppel eerst je Google account.');
    }
  }
  
  const response = await fetch(`${GSC_API_BASE}/sites`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GSC API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  
  // Extract site URLs from the response
  const sites = data.siteEntry?.map((site: any) => site.siteUrl) || [];
  
  console.log(`✅ Found ${sites.length} GSC sites:`, sites);
  
  return sites;
}


/**
 * Get performance data for a specific URL or site
 */
export async function getPerformanceData(
  siteUrl: string,
  days: number = 90,
  urlFilter?: string
): Promise<GSCPerformanceData | null> {
  let accessToken = await getAccessToken();
  
  if (!accessToken) {
    accessToken = await refreshAccessToken();
    if (!accessToken) {
      throw new Error('Geen Google Search Console toegang');
    }
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const body: any = {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    dimensions: ['query'],
    rowLimit: 10
  };

  if (urlFilter) {
    body.dimensionFilterGroups = [{
      filters: [{
        dimension: 'page',
        expression: urlFilter
      }]
    }];
  }

  const response = await fetch(
    `${GSC_API_BASE}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    console.error('GSC API error:', response.status, await response.text());
    return null;
  }

  const data = await response.json();
  
  if (!data.rows || data.rows.length === 0) {
    return null;
  }

  // Aggregate data
  const totalClicks = data.rows.reduce((sum: number, row: any) => sum + row.clicks, 0);
  const totalImpressions = data.rows.reduce((sum: number, row: any) => sum + row.impressions, 0);
  const avgCtr = totalClicks / totalImpressions;
  const avgPosition = data.rows.reduce((sum: number, row: any) => sum + row.position, 0) / data.rows.length;

  return {
    url: urlFilter || siteUrl,
    clicks: totalClicks,
    impressions: totalImpressions,
    ctr: avgCtr,
    averagePosition: avgPosition,
    topQueries: data.rows.slice(0, 10).map((row: any) => ({
      query: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      position: row.position
    }))
  };
}

/**
 * Get top performing pages from GSC
 */
export async function getTopPages(
  siteUrl: string,
  days: number = 90,
  limit: number = 100
): Promise<{ url: string; clicks: number; impressions: number; ctr: number; position: number }[]> {
  let accessToken = await getAccessToken();
  
  if (!accessToken) {
    accessToken = await refreshAccessToken();
    if (!accessToken) {
      throw new Error('Geen Google Search Console toegang');
    }
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const body = {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    dimensions: ['page'],
    rowLimit: limit
  };

  const response = await fetch(
    `${GSC_API_BASE}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    console.error('GSC API error:', response.status, await response.text());
    return [];
  }

  const data = await response.json();
  
  if (!data.rows || data.rows.length === 0) {
    return [];
  }

  return data.rows.map((row: any) => ({
    url: row.keys[0],
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position
  }));
}

/**
 * Get URL inspection data (index status, crawl info)
 */
export async function getUrlInspectionData(
  siteUrl: string,
  inspectUrl: string
): Promise<GSCUrlInspection | null> {
  let accessToken = await getAccessToken();
  
  if (!accessToken) {
    accessToken = await refreshAccessToken();
    if (!accessToken) {
      throw new Error('Geen Google Search Console toegang');
    }
  }

  const response = await fetch(
    `${GSC_API_BASE}/urlInspection/index:inspect`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inspectionUrl: inspectUrl,
        siteUrl: siteUrl
      }),
    }
  );

  if (!response.ok) {
    console.error('URL Inspection error:', response.status, await response.text());
    return null;
  }

  const data = await response.json();
  
  if (!data.inspectionResult) {
    return null;
  }

  const result = data.inspectionResult;
  
  return {
    url: inspectUrl,
    indexStatus: result.indexStatusResult?.verdict === 'PASS' ? 'INDEXED' : 'NOT_INDEXED',
    coverageState: result.indexStatusResult?.coverageState || 'UNKNOWN',
    lastCrawlTime: result.indexStatusResult?.lastCrawlTime,
    pageTitle: result.indexStatusResult?.pageFetchState?.pageTitle
  };
}