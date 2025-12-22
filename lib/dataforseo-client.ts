/**
 * DataForSEO API Client
 * 
 * Provides keyword research data including:
 * - Search volume
 * - Competition metrics
 * - Related keywords
 * - CPC data
 */

interface KeywordData {
  keyword: string;
  searchVolume: number | null;
  competition: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  competitionIndex: number | null;
  cpc: number | null;
  lowTopOfPageBid: number | null;
  highTopOfPageBid: number | null;
  monthlySearches: Array<{
    year: number;
    month: number;
    searchVolume: number;
  }> | null;
}

interface DataForSEOConfig {
  login: string;
  password: string;
}

interface KeywordsForKeywordsResponse {
  tasks: Array<{
    result: Array<{
      keyword: string;
      search_volume: number | null;
      competition: string | null;
      competition_index: number | null;
      cpc: number | null;
      low_top_of_page_bid: number | null;
      high_top_of_page_bid: number | null;
      monthly_searches: Array<{
        year: number;
        month: number;
        search_volume: number;
      }> | null;
    }>;
  }>;
}

// Get credentials from environment
function getCredentials(): DataForSEOConfig {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  
  if (!login || !password) {
    throw new Error('DataForSEO credentials not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables.');
  }
  
  return { login, password };
}

// Create authorization header
function getAuthHeader(config: DataForSEOConfig): string {
  const credentials = Buffer.from(`${config.login}:${config.password}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Get related keywords with search volume and competition data
 * 
 * @param keywords - Array of seed keywords (max 20)
 * @param locationCode - Location code (default: 2528 for Netherlands)
 * @param languageCode - Language code (default: "nl" for Dutch)
 * @returns Array of keyword data with metrics
 */
export async function getRelatedKeywords(
  keywords: string[],
  locationCode: number = 2528, // Netherlands
  languageCode: string = 'nl'
): Promise<KeywordData[]> {
  const config = getCredentials();
  
  // Limit to 20 keywords per request
  const limitedKeywords = keywords.slice(0, 20);
  
  try {
    const response = await fetch(
      'https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live',
      {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(config),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          keywords: limitedKeywords,
          location_code: locationCode,
          language_code: languageCode,
          sort_by: 'search_volume',
        }]),
      }
    );

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
    }

    const data: KeywordsForKeywordsResponse = await response.json();
    
    if (!data.tasks?.[0]?.result) {
      return [];
    }

    return data.tasks[0].result.map(item => ({
      keyword: item.keyword,
      searchVolume: item.search_volume,
      competition: item.competition as KeywordData['competition'],
      competitionIndex: item.competition_index,
      cpc: item.cpc,
      lowTopOfPageBid: item.low_top_of_page_bid,
      highTopOfPageBid: item.high_top_of_page_bid,
      monthlySearches: item.monthly_searches,
    }));
  } catch (error) {
    console.error('DataForSEO API error:', error);
    throw error;
  }
}

/**
 * Get search volume data for specific keywords
 * 
 * @param keywords - Array of keywords to check (max 1000)
 * @param locationCode - Location code (default: 2528 for Netherlands)
 * @param languageCode - Language code (default: "nl" for Dutch)
 * @returns Array of keyword data with search volume
 */
export async function getSearchVolume(
  keywords: string[],
  locationCode: number = 2528,
  languageCode: string = 'nl'
): Promise<KeywordData[]> {
  const config = getCredentials();
  
  // Limit to 1000 keywords per request
  const limitedKeywords = keywords.slice(0, 1000);
  
  try {
    const response = await fetch(
      'https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live',
      {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(config),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          keywords: limitedKeywords,
          location_code: locationCode,
          language_code: languageCode,
        }]),
      }
    );

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
    }

    const data: KeywordsForKeywordsResponse = await response.json();
    
    if (!data.tasks?.[0]?.result) {
      return [];
    }

    return data.tasks[0].result.map(item => ({
      keyword: item.keyword,
      searchVolume: item.search_volume,
      competition: item.competition as KeywordData['competition'],
      competitionIndex: item.competition_index,
      cpc: item.cpc,
      lowTopOfPageBid: item.low_top_of_page_bid,
      highTopOfPageBid: item.high_top_of_page_bid,
      monthlySearches: item.monthly_searches,
    }));
  } catch (error) {
    console.error('DataForSEO API error:', error);
    throw error;
  }
}

/**
 * Get keywords for a specific website/domain
 * 
 * @param target - Domain or URL to analyze
 * @param locationCode - Location code (default: 2528 for Netherlands)
 * @param languageCode - Language code (default: "nl" for Dutch)
 * @returns Array of keyword data
 */
export async function getKeywordsForSite(
  target: string,
  locationCode: number = 2528,
  languageCode: string = 'nl'
): Promise<KeywordData[]> {
  const config = getCredentials();
  
  try {
    const response = await fetch(
      'https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_site/live',
      {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(config),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          target,
          location_code: locationCode,
          language_code: languageCode,
        }]),
      }
    );

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
    }

    const data: KeywordsForKeywordsResponse = await response.json();
    
    if (!data.tasks?.[0]?.result) {
      return [];
    }

    return data.tasks[0].result.map(item => ({
      keyword: item.keyword,
      searchVolume: item.search_volume,
      competition: item.competition as KeywordData['competition'],
      competitionIndex: item.competition_index,
      cpc: item.cpc,
      lowTopOfPageBid: item.low_top_of_page_bid,
      highTopOfPageBid: item.high_top_of_page_bid,
      monthlySearches: item.monthly_searches,
    }));
  } catch (error) {
    console.error('DataForSEO API error:', error);
    throw error;
  }
}

/**
 * Batch process keywords in chunks to respect API limits
 * 
 * @param seedKeywords - Array of seed keywords
 * @param locationCode - Location code
 * @param languageCode - Language code
 * @param maxResults - Maximum number of results to return
 * @returns Combined array of keyword data
 */
export async function batchGetRelatedKeywords(
  seedKeywords: string[],
  locationCode: number = 2528,
  languageCode: string = 'nl',
  maxResults: number = 1000
): Promise<KeywordData[]> {
  const allKeywords: KeywordData[] = [];
  const seenKeywords = new Set<string>();
  
  // Process in batches of 20 (API limit)
  const batchSize = 20;
  const batches = Math.ceil(seedKeywords.length / batchSize);
  
  for (let i = 0; i < batches && allKeywords.length < maxResults; i++) {
    const batch = seedKeywords.slice(i * batchSize, (i + 1) * batchSize);
    
    try {
      const results = await getRelatedKeywords(batch, locationCode, languageCode);
      
      for (const kw of results) {
        if (!seenKeywords.has(kw.keyword.toLowerCase()) && allKeywords.length < maxResults) {
          seenKeywords.add(kw.keyword.toLowerCase());
          allKeywords.push(kw);
        }
      }
      
      // Rate limiting: max 12 requests per minute
      if (i < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 5500)); // ~11 requests per minute to be safe
      }
    } catch (error) {
      console.error(`Batch ${i + 1} failed:`, error);
      // Continue with next batch
    }
  }
  
  return allKeywords;
}

// Export types
export type { KeywordData, DataForSEOConfig };
