
/**
 * 🔍 DATAFORSEO API CLIENT
 * 
 * Integrates with DataForSEO API for real keyword data:
 * - Search volume & trends
 * - Keyword difficulty
 * - CPC (cost per click)
 * - Related keywords & questions
 * - Batch processing for efficiency
 * 
 * Pricing: ~€0.006 per keyword (bulk rate)
 */

export interface KeywordData {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  trend: number[]; // Monthly trend for last 12 months
  relatedKeywords: string[];
  questions: string[];
  seasonalityScore: number; // 0-100
  opportunityScore: number; // Our calculated score
}

export interface BatchKeywordResult {
  success: boolean;
  data: KeywordData[];
  errors: string[];
  totalCost: number;
  processedCount: number;
}

const DATAFORSEO_API_URL = 'https://api.dataforseo.com/v3';

/**
 * Get authentication header for DataForSEO API
 */
function getAuthHeader(): string {
  const username = process.env.DATAFORSEO_USERNAME;
  const password = process.env.DATAFORSEO_PASSWORD;
  
  if (!username || !password) {
    throw new Error('DataForSEO credentials not configured');
  }
  
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
}

/**
 * 📊 BATCH KEYWORD ENRICHMENT
 * 
 * Fetches real SEO data for multiple keywords in one API call
 * Cost: ~€0.006 per keyword
 */
export async function enrichKeywordsBatch(
  keywords: string[],
  location: string = 'Netherlands',
  language: string = 'nl'
): Promise<BatchKeywordResult> {
  console.log('[DataForSEO] Enriching batch of', keywords.length, 'keywords');
  
  try {
    // Limit to 1000 keywords per batch (API limit)
    const batchSize = Math.min(keywords.length, 1000);
    const keywordsBatch = keywords.slice(0, batchSize);
    
    // Step 1: Get search volume, difficulty, CPC
    const keywordMetrics = await getKeywordMetrics(keywordsBatch, location, language);
    
    // Step 2: Get related keywords and questions
    const relatedData = await getRelatedKeywords(keywordsBatch.slice(0, 10), location, language); // Limit to top 10
    
    // Combine all data
    const enrichedData: KeywordData[] = keywordsBatch.map((keyword, index) => {
      const metrics = keywordMetrics[index] || {};
      const related = relatedData[keyword] || { related: [], questions: [] };
      
      // Calculate opportunity score
      const opportunityScore = calculateOpportunityScore(
        metrics.search_volume || 0,
        metrics.keyword_difficulty || 50,
        metrics.cpc || 0,
        metrics.competition || 0.5
      );
      
      // Calculate seasonality
      const seasonalityScore = calculateSeasonality(metrics.monthly_searches || []);
      
      return {
        keyword,
        searchVolume: metrics.search_volume || 0,
        difficulty: metrics.keyword_difficulty || 50,
        cpc: metrics.cpc || 0,
        competition: metrics.competition || 0.5,
        trend: (metrics.monthly_searches || []).map((m: any) => m.search_volume || 0),
        relatedKeywords: related.related.slice(0, 10), // Top 10
        questions: related.questions.slice(0, 5), // Top 5
        seasonalityScore,
        opportunityScore
      };
    });
    
    const totalCost = batchSize * 0.006; // €0.006 per keyword
    
    console.log('[DataForSEO] Enriched', enrichedData.length, 'keywords. Cost: €', totalCost.toFixed(3));
    
    return {
      success: true,
      data: enrichedData,
      errors: [],
      totalCost,
      processedCount: enrichedData.length
    };
    
  } catch (error) {
    console.error('[DataForSEO] Batch enrichment error:', error);
    return {
      success: false,
      data: [],
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      totalCost: 0,
      processedCount: 0
    };
  }
}

/**
 * Get keyword metrics (search volume, difficulty, CPC)
 */
async function getKeywordMetrics(
  keywords: string[],
  location: string,
  language: string
): Promise<any[]> {
  const response = await fetch(`${DATAFORSEO_API_URL}/keywords_data/google_ads/search_volume/live`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([{
      location_name: location,
      language_name: language,
      keywords: keywords,
      search_partners: false,
      date_from: getDateMonthsAgo(12),
      date_to: getToday()
    }])
  });
  
  if (!response.ok) {
    throw new Error(`DataForSEO API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO API error: ${data.status_message}`);
  }
  
  return data.tasks?.[0]?.result?.[0]?.metrics || [];
}

/**
 * Get related keywords and questions
 */
async function getRelatedKeywords(
  keywords: string[],
  location: string,
  language: string
): Promise<Record<string, { related: string[], questions: string[] }>> {
  const results: Record<string, { related: string[], questions: string[] }> = {};
  
  // Process in parallel for speed
  const promises = keywords.map(async (keyword) => {
    try {
      const response = await fetch(`${DATAFORSEO_API_URL}/keywords_data/google_ads/keywords_for_keywords/live`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          location_name: location,
          language_name: language,
          keywords: [keyword],
          sort_by: 'search_volume',
          limit: 20
        }])
      });
      
      if (!response.ok) {
        throw new Error(`API error for ${keyword}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const items = data.tasks?.[0]?.result?.[0]?.items || [];
      
      // Separate related keywords and questions
      const related: string[] = [];
      const questions: string[] = [];
      
      items.forEach((item: any) => {
        const kw = item.keyword || '';
        if (kw.includes('?') || kw.startsWith('wat') || kw.startsWith('hoe') || 
            kw.startsWith('waarom') || kw.startsWith('wie') || kw.startsWith('waar')) {
          questions.push(kw);
        } else {
          related.push(kw);
        }
      });
      
      results[keyword] = { related, questions };
      
    } catch (error) {
      console.error(`[DataForSEO] Error fetching related for ${keyword}:`, error);
      results[keyword] = { related: [], questions: [] };
    }
  });
  
  await Promise.all(promises);
  
  return results;
}

/**
 * Calculate opportunity score (0-100)
 * Higher score = better opportunity (high volume, low difficulty, good CPC)
 */
function calculateOpportunityScore(
  searchVolume: number,
  difficulty: number,
  cpc: number,
  competition: number
): number {
  // Normalize values
  const volumeScore = Math.min(searchVolume / 1000, 10) * 10; // Max 100 at 10k+
  const difficultyScore = (100 - difficulty); // Lower difficulty = better
  const cpcScore = Math.min(cpc * 20, 20); // Max 20 at €1+ CPC
  const competitionScore = (1 - competition) * 10; // Lower competition = better
  
  // Weighted average
  const score = (
    volumeScore * 0.4 +
    difficultyScore * 0.3 +
    cpcScore * 0.2 +
    competitionScore * 0.1
  );
  
  return Math.round(Math.min(score, 100));
}

/**
 * Calculate seasonality score (0-100)
 * Higher score = more seasonal variation
 */
function calculateSeasonality(monthlySearches: any[]): number {
  if (!monthlySearches || monthlySearches.length < 12) return 0;
  
  const volumes = monthlySearches.map(m => m.search_volume || 0);
  const avg = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  
  if (avg === 0) return 0;
  
  // Calculate coefficient of variation
  const variance = volumes.reduce((sum, vol) => sum + Math.pow(vol - avg, 2), 0) / volumes.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / avg;
  
  // Convert to 0-100 scale (cv of 0.5+ = high seasonality)
  return Math.round(Math.min(cv * 200, 100));
}

/**
 * Helper: Get date N months ago in YYYY-MM-DD format
 */
function getDateMonthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().split('T')[0];
}

/**
 * Helper: Get today's date in YYYY-MM-DD format
 */
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * 🎯 SMART KEYWORD PRIORITIZATION
 * 
 * Prioritizes keywords based on opportunity score
 */
export function prioritizeKeywords(
  keywords: KeywordData[],
  strategy: 'quick_wins' | 'long_term' | 'balanced' = 'balanced'
): KeywordData[] {
  return keywords.sort((a, b) => {
    if (strategy === 'quick_wins') {
      // Prioritize high volume + low difficulty
      const scoreA = (a.searchVolume / 100) * (100 - a.difficulty);
      const scoreB = (b.searchVolume / 100) * (100 - b.difficulty);
      return scoreB - scoreA;
    } else if (strategy === 'long_term') {
      // Prioritize high CPC + moderate competition
      const scoreA = a.cpc * (1 - a.competition) * 100;
      const scoreB = b.cpc * (1 - b.competition) * 100;
      return scoreB - scoreA;
    } else {
      // Balanced: use our opportunity score
      return b.opportunityScore - a.opportunityScore;
    }
  });
}

/**
 * 📈 IDENTIFY CONTENT GAPS
 * 
 * Finds high-value keywords not yet covered
 */
export function identifyContentGaps(
  keywords: KeywordData[],
  existingTopics: string[],
  minOpportunity: number = 50
): KeywordData[] {
  const existingLower = existingTopics.map(t => t.toLowerCase());
  
  return keywords.filter(kw => {
    // Check if keyword is already covered
    const isCovered = existingLower.some(topic => 
      topic.includes(kw.keyword.toLowerCase()) || 
      kw.keyword.toLowerCase().includes(topic)
    );
    
    return !isCovered && kw.opportunityScore >= minOpportunity;
  });
}
