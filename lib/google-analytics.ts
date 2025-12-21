import { BetaAnalyticsDataClient } from '@google-analytics/data';

export interface PageViewData {
  pagePath: string;
  pageTitle: string;
  views: number;
  users: number;
  sessions: number;
  avgEngagementTime: number;
  bounceRate: number;
}

export interface TrafficSource {
  source: string;
  medium: string;
  sessions: number;
  users: number;
  newUsers: number;
}

export class GoogleAnalyticsClient {
  private analyticsDataClient;
  private propertyId: string;

  constructor() {
    this.analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
      },
    });

    this.propertyId = process.env.GA4_PROPERTY_ID || '';
  }

  /**
   * Get page views for blog articles
   */
  async getBlogPageViews(days: number = 28): Promise<PageViewData[]> {
    try {
      const [response] = await this.analyticsDataClient.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: `${days}daysAgo`,
            endDate: 'today',
          },
        ],
        dimensions: [
          { name: 'pagePath' },
          { name: 'pageTitle' },
        ],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'totalUsers' },
          { name: 'sessions' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'pagePath',
            stringFilter: {
              matchType: 'CONTAINS',
              value: '/blog/',
            },
          },
        },
        limit: 1000,
        orderBys: [
          {
            metric: {
              metricName: 'screenPageViews',
            },
            desc: true,
          },
        ],
      });

      return response.rows?.map(row => ({
        pagePath: row.dimensionValues?.[0]?.value || '',
        pageTitle: row.dimensionValues?.[1]?.value || '',
        views: parseInt(row.metricValues?.[0]?.value || '0'),
        users: parseInt(row.metricValues?.[1]?.value || '0'),
        sessions: parseInt(row.metricValues?.[2]?.value || '0'),
        avgEngagementTime: parseFloat(row.metricValues?.[3]?.value || '0'),
        bounceRate: parseFloat(row.metricValues?.[4]?.value || '0'),
      })) || [];
    } catch (error) {
      console.error('Error fetching GA4 data:', error);
      throw error;
    }
  }

  /**
   * Get traffic sources
   */
  async getTrafficSources(days: number = 28): Promise<TrafficSource[]> {
    try {
      const [response] = await this.analyticsDataClient.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: `${days}daysAgo`,
            endDate: 'today',
          },
        ],
        dimensions: [
          { name: 'sessionSource' },
          { name: 'sessionMedium' },
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'newUsers' },
        ],
        limit: 100,
        orderBys: [
          {
            metric: {
              metricName: 'sessions',
            },
            desc: true,
          },
        ],
      });

      return response.rows?.map(row => ({
        source: row.dimensionValues?.[0]?.value || '',
        medium: row.dimensionValues?.[1]?.value || '',
        sessions: parseInt(row.metricValues?.[0]?.value || '0'),
        users: parseInt(row.metricValues?.[1]?.value || '0'),
        newUsers: parseInt(row.metricValues?.[2]?.value || '0'),
      })) || [];
    } catch (error) {
      console.error('Error fetching traffic sources:', error);
      throw error;
    }
  }

  /**
   * Get overall site metrics
   */
  async getSiteMetrics(days: number = 28) {
    try {
      const [response] = await this.analyticsDataClient.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: `${days}daysAgo`,
            endDate: 'today',
          },
        ],
        metrics: [
          { name: 'totalUsers' },
          { name: 'newUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
        ],
      });

      const row = response.rows?.[0];
      if (!row) return null;

      return {
        totalUsers: parseInt(row.metricValues?.[0]?.value || '0'),
        newUsers: parseInt(row.metricValues?.[1]?.value || '0'),
        sessions: parseInt(row.metricValues?.[2]?.value || '0'),
        pageViews: parseInt(row.metricValues?.[3]?.value || '0'),
        avgSessionDuration: parseFloat(row.metricValues?.[4]?.value || '0'),
        bounceRate: parseFloat(row.metricValues?.[5]?.value || '0'),
      };
    } catch (error) {
      console.error('Error fetching site metrics:', error);
      throw error;
    }
  }

  /**
   * Get real-time active users
   */
  async getRealtimeUsers(): Promise<number> {
    try {
      const [response] = await this.analyticsDataClient.runRealtimeReport({
        property: `properties/${this.propertyId}`,
        metrics: [{ name: 'activeUsers' }],
      });

      return parseInt(response.rows?.[0]?.metricValues?.[0]?.value || '0');
    } catch (error) {
      console.error('Error fetching realtime users:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const gaClient = new GoogleAnalyticsClient();
