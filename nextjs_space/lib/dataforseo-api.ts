/**
 * DataForSEO API Integration
 * 
 * Provides comprehensive SEO data including:
 * - Keyword research (search volume, difficulty, CPC)
 * - SERP analysis (top ranking pages, features)
 * - Competition analysis
 * - Related keywords and questions
 * - Trending topics
 * 
 * API Documentation: https://docs.dataforseo.com/v3/
 */

import { prisma } from '@/lib/db';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface DataForSEOKeywordData {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  competitionLevel?: 'low' | 'medium' | 'high';
  trend?: number[];
  relatedKeywords?: string[];
  questions?: string[];
  serpFeatures?: string[];
  location?: string;
  language?: string;
}

export interface DataForSEOSerpData {
  keyword: string;
  topResults: Array<{
    position: number;
    url: string;
    title: string;
    description: string;
    domainRating?: number;
  }>;
  serpFeatures: string[];
  peopleAlsoAsk?: Array<{
    question: string;
    answer?: string;
  }>;
  relatedSearches?: string[];
}

export interface DataForSEOBatchRequest {
  keywords: string[];
  location?: string;
  language?: string;
}

export interface DataForSEOCompetitionData {
  keyword: string;
  topCompetitors: Array<{
    url: string;
    domain: string;
    domainRating: number;
    position: number;
    title: string;
  }>;
  averageDifficulty: number;
  quickWins: boolean; // Low difficulty + high volume
}

// ============================================================================
// Configuration
// ============================================================================

const DATAFORSEO_API_URL = 'https://api.dataforseo.com/v3';
const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN || '';
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD || '';
const CACHE_EXPIRY_DAYS = 30;

// Check if DataForSEO is configured
export function isDataForSEOConfigured(): boolean {
  return !!(DATAFORSEO_LOGIN && DATAFORSEO_PASSWORD);
}

// ============================================================================
// Core API Functions
// ============================================================================

/**
 * Make authenticated request to DataForSEO API
 */
async function makeDataForSEORequest(
  endpoint: string,
  data: any
): Promise<any> {
  if (!isDataForSEOConfigured()) {
    throw new Error('DataForSEO API credentials not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables.');
  }

  const auth = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');
  
  const response = await fetch(`${DATAFORSEO_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DataForSEO API error (${response.status}): ${error}`);
  }

  const result = await response.json();
  
  if (result.status_code !== 20000) {
    throw new Error(`DataForSEO API error: ${result.status_message || 'Unknown error'}`);
  }

  return result;
}

// ============================================================================
// Keyword Research
// ============================================================================

/**
 * Get keyword data with search volume, difficulty, and CPC
 * Uses caching to reduce API calls
 */
export async function getKeywordData(
  keyword: string,
  location: string = 'Netherlands',
  language: string = 'nl'
): Promise<DataForSEOKeywordData | null> {
  try {
    // Check cache first
    const cached = await getCachedKeywordData(keyword, location, language);
    if (cached) {
      console.log(`[DataForSEO] Using cached data for: ${keyword}`);
      return cached;
    }

    console.log(`[DataForSEO] Fetching fresh data for: ${keyword}`);

    // Call DataForSEO API
    const result = await makeDataForSEORequest('/keywords_data/google_ads/search_volume/live', [
      {
        keywords: [keyword],
        location_code: getLocationCode(location),
        language_code: language,
      }
    ]);

    if (!result.tasks || !result.tasks[0] || !result.tasks[0].result) {
      return null;
    }

    const data = result.tasks[0].result[0];
    
    const keywordData: DataForSEOKeywordData = {
      keyword: keyword,
      searchVolume: data.search_volume || 0,
      difficulty: calculateDifficulty(data),
      cpc: data.cpc || 0,
      competition: data.competition || 0,
      competitionLevel: getCompetitionLevel(data.competition || 0),
      location,
      language,
    };

    // Cache the result
    await cacheKeywordData(keywordData);

    return keywordData;
  } catch (error: any) {
    console.error('[DataForSEO] Error fetching keyword data:', error.message);
    return null;
  }
}

/**
 * Get keyword data for multiple keywords in batch
 * More efficient than individual calls
 */
export async function getBatchKeywordData(
  request: DataForSEOBatchRequest
): Promise<DataForSEOKeywordData[]> {
  const { keywords, location = 'Netherlands', language = 'nl' } = request;
  
  try {
    // Check which keywords are already cached
    const results: DataForSEOKeywordData[] = [];
    const uncachedKeywords: string[] = [];

    for (const keyword of keywords) {
      const cached = await getCachedKeywordData(keyword, location, language);
      if (cached) {
        results.push(cached);
      } else {
        uncachedKeywords.push(keyword);
      }
    }

    // If all keywords are cached, return immediately
    if (uncachedKeywords.length === 0) {
      console.log(`[DataForSEO] All ${keywords.length} keywords found in cache`);
      return results;
    }

    console.log(`[DataForSEO] Fetching ${uncachedKeywords.length} uncached keywords`);

    // Fetch uncached keywords in batches of 100 (API limit)
    const batchSize = 100;
    for (let i = 0; i < uncachedKeywords.length; i += batchSize) {
      const batch = uncachedKeywords.slice(i, i + batchSize);
      
      const result = await makeDataForSEORequest('/keywords_data/google_ads/search_volume/live', [
        {
          keywords: batch,
          location_code: getLocationCode(location),
          language_code: language,
        }
      ]);

      if (result.tasks && result.tasks[0] && result.tasks[0].result) {
        for (const data of result.tasks[0].result) {
          const keywordData: DataForSEOKeywordData = {
            keyword: data.keyword,
            searchVolume: data.search_volume || 0,
            difficulty: calculateDifficulty(data),
            cpc: data.cpc || 0,
            competition: data.competition || 0,
            competitionLevel: getCompetitionLevel(data.competition || 0),
            location,
            language,
          };

          results.push(keywordData);
          await cacheKeywordData(keywordData);
        }
      }
    }

    return results;
  } catch (error: any) {
    console.error('[DataForSEO] Error in batch keyword fetch:', error.message);
    return [];
  }
}

/**
 * Get related keywords and questions for a keyword
 */
export async function getRelatedKeywords(
  keyword: string,
  location: string = 'Netherlands',
  language: string = 'nl',
  limit: number = 50
): Promise<{
  relatedKeywords: string[];
  questions: string[];
}> {
  try {
    const result = await makeDataForSEORequest('/keywords_data/google_ads/keywords_for_keywords/live', [
      {
        keywords: [keyword],
        location_code: getLocationCode(location),
        language_code: language,
        include_seed_keyword: false,
        limit: limit,
      }
    ]);

    const relatedKeywords: string[] = [];
    const questions: string[] = [];

    if (result.tasks && result.tasks[0] && result.tasks[0].result) {
      for (const item of result.tasks[0].result) {
        const kw = item.keyword;
        if (kw.includes('?') || kw.startsWith('hoe') || kw.startsWith('wat') || 
            kw.startsWith('waar') || kw.startsWith('wie') || kw.startsWith('waarom')) {
          questions.push(kw);
        } else {
          relatedKeywords.push(kw);
        }
      }
    }

    return { relatedKeywords, questions };
  } catch (error: any) {
    console.error('[DataForSEO] Error fetching related keywords:', error.message);
    return { relatedKeywords: [], questions: [] };
  }
}

// ============================================================================
// SERP Analysis
// ============================================================================

/**
 * Get SERP data including top ranking pages and SERP features
 */
export async function getSerpData(
  keyword: string,
  location: string = 'Netherlands',
  language: string = 'nl'
): Promise<DataForSEOSerpData | null> {
  try {
    const result = await makeDataForSEORequest('/serp/google/organic/live/advanced', [
      {
        keyword: keyword,
        location_code: getLocationCode(location),
        language_code: language,
        device: 'desktop',
        os: 'windows',
        depth: 20, // Get top 20 results
      }
    ]);

    if (!result.tasks || !result.tasks[0] || !result.tasks[0].result) {
      return null;
    }

    const data = result.tasks[0].result[0];
    const items = data.items || [];

    const serpData: DataForSEOSerpData = {
      keyword,
      topResults: items
        .filter((item: any) => item.type === 'organic')
        .slice(0, 10)
        .map((item: any, index: number) => ({
          position: index + 1,
          url: item.url,
          title: item.title,
          description: item.description || '',
          domainRating: item.rank_group, // Rough estimate
        })),
      serpFeatures: items
        .filter((item: any) => item.type !== 'organic')
        .map((item: any) => item.type),
      peopleAlsoAsk: items
        .filter((item: any) => item.type === 'people_also_ask')
        .flatMap((item: any) => item.items || [])
        .map((q: any) => ({
          question: q.title || q.question,
          answer: q.snippet || q.answer,
        })),
      relatedSearches: items
        .filter((item: any) => item.type === 'related_searches')
        .flatMap((item: any) => item.items || [])
        .map((s: any) => s.title),
    };

    return serpData;
  } catch (error: any) {
    console.error('[DataForSEO] Error fetching SERP data:', error.message);
    return null;
  }
}

// ============================================================================
// Competition Analysis
// ============================================================================

/**
 * Analyze competition for a keyword
 */
export async function getCompetitionAnalysis(
  keyword: string,
  location: string = 'Netherlands',
  language: string = 'nl'
): Promise<DataForSEOCompetitionData | null> {
  try {
    const [keywordData, serpData] = await Promise.all([
      getKeywordData(keyword, location, language),
      getSerpData(keyword, location, language),
    ]);

    if (!keywordData || !serpData) {
      return null;
    }

    const topCompetitors = serpData.topResults.slice(0, 5).map(result => ({
      url: result.url,
      domain: new URL(result.url).hostname,
      domainRating: result.domainRating || 0,
      position: result.position,
      title: result.title,
    }));

    const averageDifficulty = keywordData.difficulty;
    const quickWins = keywordData.difficulty < 30 && keywordData.searchVolume > 100;

    return {
      keyword,
      topCompetitors,
      averageDifficulty,
      quickWins,
    };
  } catch (error: any) {
    console.error('[DataForSEO] Error in competition analysis:', error.message);
    return null;
  }
}

/**
 * Find quick wins: low difficulty + high volume keywords
 */
export async function findQuickWins(
  keywords: string[],
  location: string = 'Netherlands',
  language: string = 'nl'
): Promise<DataForSEOKeywordData[]> {
  const batchData = await getBatchKeywordData({ keywords, location, language });
  
  return batchData
    .filter(kw => kw.difficulty < 30 && kw.searchVolume > 100)
    .sort((a, b) => {
      // Score: higher volume and lower difficulty is better
      const scoreA = a.searchVolume / (a.difficulty + 1);
      const scoreB = b.searchVolume / (b.difficulty + 1);
      return scoreB - scoreA;
    });
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Get cached keyword data
 */
async function getCachedKeywordData(
  keyword: string,
  location: string,
  language: string
): Promise<DataForSEOKeywordData | null> {
  try {
    const cached = await prisma.dataForSEOCache.findUnique({
      where: {
        unique_dataforseo_keyword: {
          keyword,
          location,
          language,
        },
      },
    });

    if (!cached) {
      return null;
    }

    // Check if expired
    if (cached.expiresAt < new Date()) {
      await prisma.dataForSEOCache.delete({
        where: { id: cached.id },
      });
      return null;
    }

    return cached.data as any as DataForSEOKeywordData;
  } catch (error) {
    console.error('[DataForSEO] Error reading cache:', error);
    return null;
  }
}

/**
 * Cache keyword data
 */
async function cacheKeywordData(data: DataForSEOKeywordData): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CACHE_EXPIRY_DAYS);

    await prisma.dataForSEOCache.upsert({
      where: {
        unique_dataforseo_keyword: {
          keyword: data.keyword,
          location: data.location || 'Netherlands',
          language: data.language || 'nl',
        },
      },
      create: {
        keyword: data.keyword,
        location: data.location || 'Netherlands',
        language: data.language || 'nl',
        data: data as any,
        searchVolume: data.searchVolume,
        difficulty: data.difficulty,
        cpc: data.cpc,
        competition: data.competition,
        expiresAt,
      },
      update: {
        data: data as any,
        searchVolume: data.searchVolume,
        difficulty: data.difficulty,
        cpc: data.cpc,
        competition: data.competition,
        expiresAt,
      },
    });
  } catch (error) {
    console.error('[DataForSEO] Error caching data:', error);
  }
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<number> {
  try {
    const result = await prisma.dataForSEOCache.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  } catch (error) {
    console.error('[DataForSEO] Error clearing cache:', error);
    return 0;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get DataForSEO location code
 */
function getLocationCode(location: string): number {
  const locationCodes: Record<string, number> = {
    'Netherlands': 2528,
    'Belgium': 2056,
    'Germany': 2276,
    'United Kingdom': 2826,
    'United States': 2840,
    'France': 2250,
    'Spain': 2724,
    'Italy': 2380,
  };
  
  return locationCodes[location] || locationCodes['Netherlands'];
}

/**
 * Calculate keyword difficulty (0-100)
 * Based on competition and other factors
 */
function calculateDifficulty(data: any): number {
  const competition = data.competition || 0;
  const cpc = data.cpc || 0;
  
  // Higher competition and CPC = higher difficulty
  let difficulty = competition * 100;
  
  // Adjust based on CPC (high CPC often means competitive)
  if (cpc > 2) {
    difficulty = Math.min(100, difficulty * 1.2);
  }
  
  return Math.round(difficulty);
}

/**
 * Get competition level label
 */
function getCompetitionLevel(competition: number): 'low' | 'medium' | 'high' {
  if (competition < 0.3) return 'low';
  if (competition < 0.7) return 'medium';
  return 'high';
}

// ============================================================================
// Keyword Enrichment & Prioritization
// ============================================================================

/**
 * Enrich keywords in batch with cost tracking
 * Returns enriched data with cost information
 */
export async function enrichKeywordsBatch(
  keywords: string[],
  location: string = 'Netherlands',
  language: string = 'nl'
): Promise<{
  success: boolean;
  data: Array<DataForSEOKeywordData & {
    seasonalityScore?: number;
    opportunityScore?: number;
  }>;
  totalCost: number;
  errors?: string[];
}> {
  try {
    console.log(`[DataForSEO] Enriching ${keywords.length} keywords...`);
    
    // Get batch keyword data
    const batchData = await getBatchKeywordData({ keywords, location, language });
    
    // Calculate opportunity scores and add trend analysis
    const enrichedData = batchData.map(kw => {
      // Opportunity score (0-100): high volume + low difficulty = high opportunity
      const volumeScore = Math.min(100, (kw.searchVolume / 1000) * 10);
      const difficultyScore = 100 - kw.difficulty;
      const opportunityScore = Math.round((volumeScore * 0.6 + difficultyScore * 0.4));
      
      // Seasonality score (placeholder - would require trend data)
      const seasonalityScore = 50; // Neutral by default
      
      return {
        ...kw,
        opportunityScore,
        seasonalityScore,
      };
    });
    
    // Calculate cost (DataForSEO charges ~€0.006 per keyword)
    const costPerKeyword = 0.006;
    const totalCost = keywords.length * costPerKeyword;
    
    console.log(`[DataForSEO] Enrichment complete. Cost: €${totalCost.toFixed(2)}`);
    
    return {
      success: true,
      data: enrichedData,
      totalCost,
    };
  } catch (error: any) {
    console.error('[DataForSEO] Enrichment error:', error.message);
    return {
      success: false,
      data: [],
      totalCost: 0,
      errors: [error.message],
    };
  }
}

/**
 * Prioritize keywords based on different strategies
 */
export function prioritizeKeywords(
  keywords: Array<DataForSEOKeywordData & { opportunityScore?: number }>,
  strategy: 'quick-wins' | 'high-volume' | 'low-competition' | 'balanced' = 'balanced'
): Array<DataForSEOKeywordData & { opportunityScore?: number; priorityScore: number }> {
  console.log(`[DataForSEO] Prioritizing ${keywords.length} keywords with strategy: ${strategy}`);
  
  const prioritized = keywords.map(kw => {
    let priorityScore = 0;
    
    switch (strategy) {
      case 'quick-wins':
        // Low difficulty + decent volume
        priorityScore = (100 - kw.difficulty) * 0.7 + (kw.searchVolume / 100) * 0.3;
        break;
        
      case 'high-volume':
        // Prioritize high search volume
        priorityScore = kw.searchVolume / 10;
        break;
        
      case 'low-competition':
        // Prioritize low difficulty
        priorityScore = 100 - kw.difficulty;
        break;
        
      case 'balanced':
      default:
        // Use opportunity score or calculate balanced score
        if (kw.opportunityScore) {
          priorityScore = kw.opportunityScore;
        } else {
          const volumeScore = Math.min(100, (kw.searchVolume / 1000) * 10);
          const difficultyScore = 100 - kw.difficulty;
          const cpcScore = Math.min(100, kw.cpc * 10);
          priorityScore = volumeScore * 0.5 + difficultyScore * 0.3 + cpcScore * 0.2;
        }
        break;
    }
    
    return {
      ...kw,
      priorityScore: Math.round(priorityScore),
    };
  });
  
  // Sort by priority score (highest first)
  prioritized.sort((a, b) => b.priorityScore - a.priorityScore);
  
  console.log(`[DataForSEO] Top 5 prioritized keywords:`, 
    prioritized.slice(0, 5).map(k => `${k.keyword} (score: ${k.priorityScore})`)
  );
  
  return prioritized;
}

// ============================================================================
// Exports
// ============================================================================

export const DataForSEO = {
  isConfigured: isDataForSEOConfigured,
  getKeywordData,
  getBatchKeywordData,
  getRelatedKeywords,
  getSerpData,
  getCompetitionAnalysis,
  findQuickWins,
  clearExpiredCache,
  enrichKeywordsBatch,
  prioritizeKeywords,
};
