/**
 * Modern Keyword Research Module (2025)
 * Using DataForSEO API for advanced SEO intelligence
 */

export interface KeywordMetrics {
  keyword: string;
  searchVolume: number;
  competition: number; // 0-100
  competitionLevel?: 'low' | 'medium' | 'high';
  cpc?: number;
  trend?: 'rising' | 'stable' | 'declining';
  seasonality?: boolean;
}

export interface SERPResult {
  position: number;
  url: string;
  domain: string;
  title: string;
  description?: string;
  domainAuthority?: number;
  wordCount?: number;
  contentType: 'article' | 'product' | 'video' | 'tool' | 'other';
  hasFeatureSnippet: boolean;
}

export interface PeopleAlsoAsk {
  question: string;
  answer?: string;
  relatedKeywords: string[];
}

export interface KeywordOpportunity {
  keyword: string;
  focusKeyword: string;
  metrics: KeywordMetrics;
  difficulty: number; // 0-100 (calculated)
  rankingPotential: number; // 0-100 (our calculated score)
  serp: {
    avgDomainAuthority: number;
    avgWordCount: number;
    topResultType: string;
    featuredSnippetAvailable: boolean;
  };
  peopleAlsoAsk: string[];
  relatedKeywords: string[];
  semanticKeywords: string[];
  recommendation: 'high-priority' | 'medium-priority' | 'low-priority' | 'skip';
  reason: string;
}

/**
 * DataForSEO API Integration
 */
export class DataForSEOClient {
  private login: string;
  private password: string;
  private baseUrl = 'https://api.dataforseo.com/v3';

  constructor(login?: string, password?: string) {
    this.login = login || process.env.DATAFORSEO_LOGIN || '';
    this.password = password || process.env.DATAFORSEO_PASSWORD || '';
  }

  private async request(endpoint: string, data: any): Promise<any> {
    if (!this.login || !this.password) {
      throw new Error('DataForSEO credentials not configured');
    }

    const credentials = Buffer.from(`${this.login}:${this.password}`).toString('base64');

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('DataForSEO request failed:', error);
      throw error;
    }
  }

  /**
   * Get keyword metrics (volume, competition, CPC)
   */
  async getKeywordMetrics(
    keywords: string[],
    locationCode: number = 2528, // Netherlands
    languageCode: string = 'nl'
  ): Promise<KeywordMetrics[]> {
    const data = await this.request('/keywords_data/google_ads/keywords_for_keywords/live', [{
      keywords: keywords.slice(0, 1000), // Max 1000 per request
      location_code: locationCode,
      language_code: languageCode,
      sort_by: 'search_volume',
    }]);

    const results = data.tasks?.[0]?.result || [];

    return results.map((item: any) => ({
      keyword: item.keyword,
      searchVolume: item.search_volume || 0,
      competition: item.competition_index || 0,
      competitionLevel: this.getCompetitionLevel(item.competition_index || 0),
      cpc: item.cpc || 0,
      trend: item.monthly_searches ? this.analyzeTrend(item.monthly_searches) : 'stable',
      seasonality: this.detectSeasonality(item.monthly_searches),
    }));
  }

  /**
   * Get SERP data (top 10 results analysis)
   */
  async getSERPData(
    keyword: string,
    locationCode: number = 2528,
    languageCode: string = 'nl'
  ): Promise<SERPResult[]> {
    const data = await this.request('/serp/google/organic/live/advanced', [{
      keyword,
      location_code: locationCode,
      language_code: languageCode,
      depth: 10,
      device: 'desktop',
    }]);

    const items = data.tasks?.[0]?.result?.[0]?.items || [];

    return items
      .filter((item: any) => item.type === 'organic')
      .map((item: any, index: number) => ({
        position: item.rank_absolute || index + 1,
        url: item.url || '',
        domain: item.domain || '',
        title: item.title || '',
        description: item.description || '',
        wordCount: this.estimateWordCount(item.description),
        contentType: this.detectContentType(item.url, item.title),
        hasFeatureSnippet: item.featured_snippet !== undefined,
      }));
  }

  /**
   * Get People Also Ask questions
   */
  async getPeopleAlsoAsk(
    keyword: string,
    locationCode: number = 2528,
    languageCode: string = 'nl'
  ): Promise<PeopleAlsoAsk[]> {
    const data = await this.request('/serp/google/organic/live/advanced', [{
      keyword,
      location_code: locationCode,
      language_code: languageCode,
      calculate_rectangles: true,
    }]);

    const items = data.tasks?.[0]?.result?.[0]?.items || [];
    const paaItems = items.filter((item: any) => item.type === 'people_also_ask');

    return paaItems.flatMap((item: any) =>
      (item.items || []).map((q: any) => ({
        question: q.title || q.question || '',
        answer: q.description || q.answer || '',
        relatedKeywords: this.extractKeywords(q.title || ''),
      }))
    );
  }

  /**
   * Get related keywords and suggestions
   */
  async getRelatedKeywords(
    keyword: string,
    locationCode: number = 2528,
    languageCode: string = 'nl',
    limit: number = 50
  ): Promise<string[]> {
    const data = await this.request('/keywords_data/google_ads/keywords_for_keywords/live', [{
      keywords: [keyword],
      location_code: locationCode,
      language_code: languageCode,
      include_seed_keyword: false,
      sort_by: 'relevance',
      limit,
    }]);

    const results = data.tasks?.[0]?.result || [];
    return results.map((item: any) => item.keyword).filter(Boolean);
  }

  /**
   * Get keyword suggestions (autocomplete)
   */
  async getKeywordSuggestions(
    keyword: string,
    locationCode: number = 2528,
    languageCode: string = 'nl'
  ): Promise<string[]> {
    const data = await this.request('/keywords_data/google_ads/search_volume/live', [{
      keywords: [keyword],
      location_code: locationCode,
      language_code: languageCode,
    }]);

    const results = data.tasks?.[0]?.result || [];
    return results.map((item: any) => item.keyword).filter(Boolean);
  }

  // Helper methods
  private getCompetitionLevel(index: number): 'low' | 'medium' | 'high' {
    if (index < 33) return 'low';
    if (index < 66) return 'medium';
    return 'high';
  }

  private analyzeTrend(monthlySearches: any[]): 'rising' | 'stable' | 'declining' {
    if (!monthlySearches || monthlySearches.length < 6) return 'stable';

    const recent = monthlySearches.slice(-3).reduce((sum, m) => sum + (m.search_volume || 0), 0) / 3;
    const older = monthlySearches.slice(-6, -3).reduce((sum, m) => sum + (m.search_volume || 0), 0) / 3;

    const change = ((recent - older) / older) * 100;

    if (change > 20) return 'rising';
    if (change < -20) return 'declining';
    return 'stable';
  }

  private detectSeasonality(monthlySearches: any[]): boolean {
    if (!monthlySearches || monthlySearches.length < 12) return false;

    const volumes = monthlySearches.map(m => m.search_volume || 0);
    const avg = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const maxDeviation = Math.max(...volumes.map(v => Math.abs(v - avg)));

    return maxDeviation > avg * 0.5; // 50% deviation indicates seasonality
  }

  private estimateWordCount(text?: string): number {
    if (!text) return 0;
    return text.split(/\s+/).length * 10; // Rough estimate
  }

  private detectContentType(url: string, title: string): 'article' | 'product' | 'video' | 'tool' | 'other' {
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();

    if (urlLower.includes('/product/') || urlLower.includes('/shop/')) return 'product';
    if (urlLower.includes('youtube.com') || titleLower.includes('video')) return 'video';
    if (urlLower.includes('/tool') || titleLower.includes('calculator')) return 'tool';
    if (urlLower.includes('/blog/') || urlLower.includes('/article/')) return 'article';

    return 'other';
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction from question
    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);

    return [...new Set(words)].slice(0, 5);
  }
}

/**
 * Advanced Keyword Opportunity Analyzer
 */
export class KeywordOpportunityAnalyzer {
  private client: DataForSEOClient;

  constructor(client: DataForSEOClient) {
    this.client = client;
  }

  /**
   * Analyze a keyword and determine ranking opportunity
   */
  async analyzeKeywordOpportunity(
    keyword: string,
    yourDomainAuthority: number = 20, // Default for new sites
    locationCode: number = 2528,
    languageCode: string = 'nl'
  ): Promise<KeywordOpportunity> {
    // Parallel requests for speed
    const [metrics, serp, paa, related] = await Promise.all([
      this.client.getKeywordMetrics([keyword], locationCode, languageCode),
      this.client.getSERPData(keyword, locationCode, languageCode),
      this.client.getPeopleAlsoAsk(keyword, locationCode, languageCode),
      this.client.getRelatedKeywords(keyword, locationCode, languageCode, 20),
    ]);

    const keywordMetric = metrics[0] || {
      keyword,
      searchVolume: 0,
      competition: 50,
      competitionLevel: 'medium' as const,
    };

    // Calculate SERP statistics
    const avgDomainAuthority = this.calculateAvgDA(serp);
    const avgWordCount = serp.reduce((sum, r) => sum + (r.wordCount || 0), 0) / (serp.length || 1);
    const topResultType = serp[0]?.contentType || 'other';
    const featuredSnippetAvailable = serp.some(r => r.hasFeatureSnippet);

    // Calculate difficulty (0-100)
    const difficulty = this.calculateDifficulty(keywordMetric, avgDomainAuthority, serp);

    // Calculate ranking potential (0-100)
    const rankingPotential = this.calculateRankingPotential(
      keywordMetric,
      difficulty,
      yourDomainAuthority,
      avgDomainAuthority
    );

    // Get semantic keywords from PAA
    const semanticKeywords = this.extractSemanticKeywords(paa, related);

    // Determine recommendation
    const { recommendation, reason } = this.getRecommendation(
      keywordMetric,
      difficulty,
      rankingPotential
    );

    return {
      keyword,
      focusKeyword: keyword.toLowerCase(),
      metrics: keywordMetric,
      difficulty,
      rankingPotential,
      serp: {
        avgDomainAuthority,
        avgWordCount: Math.round(avgWordCount),
        topResultType,
        featuredSnippetAvailable,
      },
      peopleAlsoAsk: paa.map(p => p.question),
      relatedKeywords: related,
      semanticKeywords,
      recommendation,
      reason,
    };
  }

  /**
   * Batch analyze multiple keywords
   */
  async analyzeBatch(
    keywords: string[],
    yourDomainAuthority: number = 20,
    locationCode: number = 2528,
    languageCode: string = 'nl'
  ): Promise<KeywordOpportunity[]> {
    const opportunities: KeywordOpportunity[] = [];

    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize);

      const results = await Promise.all(
        batch.map(keyword =>
          this.analyzeKeywordOpportunity(keyword, yourDomainAuthority, locationCode, languageCode)
            .catch(err => {
              console.error(`Failed to analyze keyword: ${keyword}`, err);
              return null;
            })
        )
      );

      opportunities.push(...results.filter(Boolean) as KeywordOpportunity[]);

      // Small delay between batches
      if (i + batchSize < keywords.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return opportunities;
  }

  // Helper methods
  private calculateAvgDA(serp: SERPResult[]): number {
    if (serp.length === 0) return 50;

    // Estimate DA based on position (top positions = higher DA assumption)
    const estimatedDAs = serp.map((result, index) => {
      // Top 3 results typically have high DA
      if (index < 3) return 70 + (Math.random() * 20);
      if (index < 6) return 50 + (Math.random() * 20);
      return 30 + (Math.random() * 20);
    });

    return estimatedDAs.reduce((sum, da) => sum + da, 0) / estimatedDAs.length;
  }

  private calculateDifficulty(
    metrics: KeywordMetrics,
    avgDA: number,
    serp: SERPResult[]
  ): number {
    // Difficulty factors:
    // 1. Competition index (40%)
    // 2. Average DA of ranking pages (30%)
    // 3. SERP features (30%)

    const competitionScore = metrics.competition || 50;
    const daScore = (avgDA / 100) * 100;
    const serpScore = serp.some(r => r.hasFeatureSnippet) ? 70 : 50;

    const difficulty = (
      competitionScore * 0.4 +
      daScore * 0.3 +
      serpScore * 0.3
    );

    return Math.min(100, Math.max(0, Math.round(difficulty)));
  }

  private calculateRankingPotential(
    metrics: KeywordMetrics,
    difficulty: number,
    yourDA: number,
    avgDA: number
  ): number {
    // Factors:
    // 1. Your DA vs competitor DA (40%)
    // 2. Search volume (30%)
    // 3. Inverse difficulty (30%)

    const daAdvantage = Math.max(0, (yourDA - avgDA + 50) / 100 * 100);
    const volumeScore = Math.min(100, (metrics.searchVolume / 1000) * 50);
    const difficultyInverse = 100 - difficulty;

    const potential = (
      daAdvantage * 0.4 +
      volumeScore * 0.3 +
      difficultyInverse * 0.3
    );

    return Math.min(100, Math.max(0, Math.round(potential)));
  }

  private extractSemanticKeywords(paa: PeopleAlsoAsk[], related: string[]): string[] {
    const allKeywords = new Set<string>();

    // Extract from PAA questions
    paa.forEach(p => {
      p.relatedKeywords.forEach(k => allKeywords.add(k));
    });

    // Add related keywords
    related.slice(0, 10).forEach(k => allKeywords.add(k.toLowerCase()));

    return Array.from(allKeywords).slice(0, 20);
  }

  private getRecommendation(
    metrics: KeywordMetrics,
    difficulty: number,
    rankingPotential: number
  ): { recommendation: 'high-priority' | 'medium-priority' | 'low-priority' | 'skip'; reason: string } {
    // High priority: Good potential, reasonable difficulty, decent volume
    if (rankingPotential > 60 && difficulty < 50 && metrics.searchVolume > 100) {
      return {
        recommendation: 'high-priority',
        reason: `Hoge ranking kans (${rankingPotential}%), lage concurrentie (${difficulty}%), ${metrics.searchVolume} zoekvolume`,
      };
    }

    // Medium priority: Moderate potential or volume
    if (rankingPotential > 40 && difficulty < 70 && metrics.searchVolume > 50) {
      return {
        recommendation: 'medium-priority',
        reason: `Gemiddelde ranking kans (${rankingPotential}%), redelijke concurrentie (${difficulty}%)`,
      };
    }

    // Low priority: Low volume but easy
    if (difficulty < 40 && metrics.searchVolume > 10) {
      return {
        recommendation: 'low-priority',
        reason: `Makkelijk te ranken maar laag volume (${metrics.searchVolume})`,
      };
    }

    // Skip: Too difficult or no volume
    return {
      recommendation: 'skip',
      reason: difficulty > 70
        ? `Te moeilijk (${difficulty}%) voor huidige domein autoriteit`
        : `Te weinig zoekvolume (${metrics.searchVolume})`,
    };
  }
}

/**
 * Semantic Keyword Clustering
 * Groups related keywords together for single-article optimization
 */
export class KeywordClusterer {
  /**
   * Cluster keywords by semantic similarity
   */
  async clusterKeywords(keywords: string[]): Promise<Map<string, string[]>> {
    const clusters = new Map<string, string[]>();

    // Simple word-overlap based clustering
    // In production, use AI embeddings for better clustering
    for (const keyword of keywords) {
      let assigned = false;

      for (const [mainKeyword, cluster] of clusters.entries()) {
        if (this.areSimilar(keyword, mainKeyword)) {
          cluster.push(keyword);
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        clusters.set(keyword, [keyword]);
      }
    }

    return clusters;
  }

  private areSimilar(kw1: string, kw2: string): boolean {
    const words1 = new Set(kw1.toLowerCase().split(/\s+/));
    const words2 = new Set(kw2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    // Jaccard similarity > 0.5
    return intersection.size / union.size > 0.5;
  }
}
