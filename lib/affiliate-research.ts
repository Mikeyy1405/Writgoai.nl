/**
 * Affiliate Research Library
 * Uses Perplexity Pro Sonar to find affiliate programs
 */

import { analyzeWithPerplexityJSON, BEST_MODELS } from './ai-client';

export interface AffiliateProgram {
  network: string;
  type: 'affiliate_network' | 'direct_program';
  signup_url: string;
  commission: string;
  cookie_duration: string;
  details: string;
}

export interface AffiliateResearchResult {
  programs: AffiliateProgram[];
  notes: string;
  researched_at: string;
}

// Simple in-memory cache for affiliate research results (24 hour TTL)
interface CacheEntry {
  data: AffiliateResearchResult;
  timestamp: number;
}

const researchCache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Rate limiting: Track API calls per minute
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const MAX_CALLS_PER_MINUTE = 60;

/**
 * Check if rate limit is exceeded
 */
function checkRateLimit(key: string = 'global'): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    // Reset counter
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + 60000, // 1 minute from now
    });
    return false;
  }

  if (entry.count >= MAX_CALLS_PER_MINUTE) {
    return true; // Rate limit exceeded
  }

  entry.count++;
  return false;
}

/**
 * Get cached research result if available and not expired
 */
function getCachedResearch(cacheKey: string): AffiliateResearchResult | null {
  const entry = researchCache.get(cacheKey);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL) {
    // Cache expired
    researchCache.delete(cacheKey);
    return null;
  }

  return entry.data;
}

/**
 * Cache research result
 */
function cacheResearch(cacheKey: string, data: AffiliateResearchResult): void {
  researchCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Research affiliate programs for a product/brand using Perplexity Pro Sonar
 */
export async function researchAffiliatePrograms(
  productName: string,
  brandName?: string
): Promise<AffiliateResearchResult> {
  // Create cache key
  const cacheKey = `${productName.toLowerCase()}_${(brandName || '').toLowerCase()}`;

  // Check cache first
  const cached = getCachedResearch(cacheKey);
  if (cached) {
    console.log(`Using cached affiliate research for: ${productName}`);
    return cached;
  }

  // Check rate limit
  if (checkRateLimit()) {
    throw new Error('Rate limit exceeded. Please try again in a minute.');
  }

  try {
    const searchTerm = brandName ? `${brandName} ${productName}` : productName;
    
    const prompt = `Zoek affiliate marketing programma's voor het product/merk: "${searchTerm}"

Geef ALLEEN informatie over:
1. Affiliate netwerken waar dit programma beschikbaar is (Awin, Tradedoubler, Daisycon, CJ Affiliate, ShareASale, Impact, PartnerStack, etc.)
2. Direct affiliate programma (eigen partnerprogramma)
3. Commissie percentages
4. Cookie duration
5. Aanmeld/signup links

Focus op:
- Nederlandse/Europese affiliate netwerken
- Actuele informatie (2024-2025)
- Betrouwbare bronnen

Output als JSON:
{
  "programs": [
    {
      "network": "Netwerk naam",
      "type": "affiliate_network" of "direct_program",
      "signup_url": "URL om aan te melden",
      "commission": "Commissie info",
      "cookie_duration": "Cookie duration",
      "details": "Extra details"
    }
  ],
  "notes": "Aanvullende notities"
}

Als je geen affiliate programma's vindt, return een lege array voor programs.`;

    console.log(`Researching affiliate programs for: ${searchTerm}`);
    
    const result = await analyzeWithPerplexityJSON<{
      programs: AffiliateProgram[];
      notes: string;
    }>(prompt);

    const researchResult: AffiliateResearchResult = {
      programs: result.programs || [],
      notes: result.notes || 'Geen aanvullende informatie beschikbaar',
      researched_at: new Date().toISOString(),
    };

    // Cache the result
    cacheResearch(cacheKey, researchResult);

    return researchResult;
  } catch (error) {
    console.error('Error researching affiliate programs:', error);
    
    // Return empty result on error
    return {
      programs: [],
      notes: `Fout bij opzoeken: ${error instanceof Error ? error.message : 'Onbekende fout'}`,
      researched_at: new Date().toISOString(),
    };
  }
}

/**
 * Clear the research cache (useful for testing or manual refresh)
 */
export function clearResearchCache(): void {
  researchCache.clear();
  console.log('Affiliate research cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: researchCache.size,
    entries: Array.from(researchCache.keys()),
  };
}
