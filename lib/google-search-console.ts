import { google } from 'googleapis';

export interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchAnalyticsResponse {
  rows: SearchAnalyticsRow[];
  responseAggregationType: string;
}

export interface PagePerformance {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  keywords: {
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[];
}

export class GoogleSearchConsoleClient {
  private searchconsole;
  private siteUrl: string;

  constructor() {
    // Initialize with service account credentials
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    this.searchconsole = google.searchconsole({ version: 'v1', auth });
    this.siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://writgo.nl';
  }

  /**
   * Get search analytics data for a date range
   */
  async getSearchAnalytics(
    startDate: string,
    endDate: string,
    dimensions: string[] = ['page', 'query'],
    rowLimit: number = 1000
  ): Promise<SearchAnalyticsResponse> {
    try {
      const response = await this.searchconsole.searchanalytics.query({
        siteUrl: this.siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions,
          rowLimit,
          dataState: 'final',
        },
      });

      return response.data as SearchAnalyticsResponse;
    } catch (error) {
      console.error('Error fetching Search Console data:', error);
      throw error;
    }
  }

  /**
   * Get performance data for all blog articles
   */
  async getBlogPerformance(days: number = 28): Promise<PagePerformance[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const endDateStr = endDate.toISOString().split('T')[0];
    const startDateStr = startDate.toISOString().split('T')[0];

    // Get page-level data
    const pageData = await this.getSearchAnalytics(
      startDateStr,
      endDateStr,
      ['page'],
      1000
    );

    // Filter for blog articles only
    const blogPages = pageData.rows?.filter(row => 
      row.keys[0].includes('/blog/')
    ) || [];

    // Get keyword data for each page
    const pagePerformance: PagePerformance[] = [];

    for (const page of blogPages) {
      const pageUrl = page.keys[0];
      
      // Get keywords for this specific page
      const keywordData = await this.searchconsole.searchanalytics.query({
        siteUrl: this.siteUrl,
        requestBody: {
          startDate: startDateStr,
          endDate: endDateStr,
          dimensions: ['query'],
          dimensionFilterGroups: [{
            filters: [{
              dimension: 'page',
              expression: pageUrl,
              operator: 'equals'
            }]
          }],
          rowLimit: 100,
          dataState: 'final',
        },
      });

      const keywords = keywordData.data.rows?.map(row => ({
        query: row.keys[0],
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      })) || [];

      pagePerformance.push({
        page: pageUrl,
        clicks: page.clicks || 0,
        impressions: page.impressions || 0,
        ctr: page.ctr || 0,
        position: page.position || 0,
        keywords: keywords.sort((a, b) => b.clicks - a.clicks).slice(0, 10), // Top 10 keywords
      });
    }

    // Sort by clicks descending
    return pagePerformance.sort((a, b) => b.clicks - a.clicks);
  }

  /**
   * Get top performing keywords
   */
  async getTopKeywords(days: number = 28, limit: number = 50): Promise<SearchAnalyticsRow[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const endDateStr = endDate.toISOString().split('T')[0];
    const startDateStr = startDate.toISOString().split('T')[0];

    const data = await this.getSearchAnalytics(
      startDateStr,
      endDateStr,
      ['query'],
      limit
    );

    return data.rows?.sort((a, b) => b.clicks - a.clicks) || [];
  }

  /**
   * Get articles that need improvement (low CTR or high position)
   */
  async getArticlesNeedingImprovement(): Promise<PagePerformance[]> {
    const performance = await this.getBlogPerformance(28);

    return performance.filter(page => {
      // Articles in position 5-20 with low CTR (opportunity to improve)
      const hasOpportunity = page.position >= 5 && page.position <= 20 && page.ctr < 0.05;
      
      // Articles with high impressions but low clicks
      const lowCTR = page.impressions > 100 && page.ctr < 0.03;
      
      return hasOpportunity || lowCTR;
    }).sort((a, b) => b.impressions - a.impressions); // Sort by impressions (highest opportunity)
  }

  /**
   * Get articles that are performing well (to learn from)
   */
  async getTopPerformingArticles(limit: number = 10): Promise<PagePerformance[]> {
    const performance = await this.getBlogPerformance(28);

    return performance
      .filter(page => page.clicks > 10) // At least 10 clicks
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, limit);
  }

  /**
   * Get articles that are declining (need refresh)
   */
  async getDecliningArticles(): Promise<PagePerformance[]> {
    // Compare last 28 days vs previous 28 days
    const recent = await this.getBlogPerformance(28);
    const previous = await this.getBlogPerformance(56); // Last 56 days

    const declining: PagePerformance[] = [];

    for (const recentPage of recent) {
      const previousPage = previous.find(p => p.page === recentPage.page);
      
      if (previousPage) {
        // Calculate decline percentage
        const clicksDecline = ((recentPage.clicks - previousPage.clicks) / previousPage.clicks) * 100;
        const positionDecline = recentPage.position - previousPage.position;

        // Article is declining if clicks dropped >20% or position dropped >5
        if (clicksDecline < -20 || positionDecline > 5) {
          declining.push(recentPage);
        }
      }
    }

    return declining.sort((a, b) => b.impressions - a.impressions);
  }
}

// Export singleton instance
export const gscClient = new GoogleSearchConsoleClient();
