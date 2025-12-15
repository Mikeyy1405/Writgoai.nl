/**
 * Google Search Console Integration Library
 * 
 * Features:
 * - OAuth 2.0 authentication
 * - Search analytics data fetching
 * - Top queries and pages
 * - Site performance metrics
 */

import { google } from 'googleapis';

export interface SearchConsoleStats {
  totalClicks: number;
  totalImpressions: number;
  averageCTR: number;
  averagePosition: number;
}

export interface TopQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface TopPage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export class GoogleSearchConsole {
  private oauth2Client;

  constructor(accessToken: string, refreshToken?: string) {
    // Support both GOOGLE_SEARCH_CONSOLE_* and GOOGLE_* environment variables
    const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    // Construct redirect URI from NEXTAUTH_URL
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/google-search-console/callback`;

    if (!clientId || !clientSecret) {
      console.error('[Google OAuth] Missing credentials');
      console.error('[Google OAuth] GOOGLE_SEARCH_CONSOLE_CLIENT_ID:', !!process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID);
      console.error('[Google OAuth] GOOGLE_CLIENT_ID:', !!process.env.GOOGLE_CLIENT_ID);
      console.error('[Google OAuth] GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET:', !!process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET);
      console.error('[Google OAuth] GOOGLE_CLIENT_SECRET:', !!process.env.GOOGLE_CLIENT_SECRET);
      throw new Error('Google OAuth credentials not configured');
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  /**
   * Get OAuth URL for user authentication
   */
  static getAuthUrl(): string {
    // Support both GOOGLE_SEARCH_CONSOLE_* and GOOGLE_* environment variables
    const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    // Construct redirect URI from NEXTAUTH_URL
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/google-search-console/callback`;

    if (!clientId || !clientSecret) {
      console.error('[Google OAuth] Missing credentials for auth URL');
      console.error('[Google OAuth] GOOGLE_SEARCH_CONSOLE_CLIENT_ID:', !!process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID);
      console.error('[Google OAuth] GOOGLE_CLIENT_ID:', !!process.env.GOOGLE_CLIENT_ID);
      throw new Error('Google OAuth credentials not configured');
    }

    console.log('[Google OAuth] Auth URL redirect URI:', redirectUri);

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const scopes = [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/webmasters',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  static async getTokensFromCode(code: string) {
    // Support both GOOGLE_SEARCH_CONSOLE_* and GOOGLE_* environment variables
    const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    // Construct redirect URI from NEXTAUTH_URL
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/google-search-console/callback`;

    if (!clientId || !clientSecret) {
      console.error('[Google OAuth] Missing credentials for token exchange');
      console.error('[Google OAuth] GOOGLE_SEARCH_CONSOLE_CLIENT_ID:', !!process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID);
      console.error('[Google OAuth] GOOGLE_CLIENT_ID:', !!process.env.GOOGLE_CLIENT_ID);
      throw new Error('Google OAuth credentials not configured');
    }

    console.log('[Google OAuth] Token exchange redirect URI:', redirectUri);

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }

  /**
   * Get list of sites in Search Console
   */
  async getSites(): Promise<string[]> {
    const webmasters = google.webmasters({ version: 'v3', auth: this.oauth2Client });
    
    try {
      const response = await webmasters.sites.list();
      return response.data.siteEntry?.map(site => site.siteUrl || '') || [];
    } catch (error) {
      console.error('Error fetching sites:', error);
      throw new Error('Failed to fetch Search Console sites');
    }
  }

  /**
   * Get search analytics data
   */
  async getSearchAnalytics(
    siteUrl: string,
    startDate: string,
    endDate: string
  ): Promise<SearchConsoleStats> {
    const searchconsole = google.searchconsole({ version: 'v1', auth: this.oauth2Client });

    try {
      const response = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: [],
        },
      });

      const row = response.data.rows?.[0];
      
      return {
        totalClicks: row?.clicks || 0,
        totalImpressions: row?.impressions || 0,
        averageCTR: row?.ctr || 0,
        averagePosition: row?.position || 0,
      };
    } catch (error) {
      console.error('Error fetching search analytics:', error);
      throw new Error('Failed to fetch search analytics');
    }
  }

  /**
   * Get top queries
   */
  async getTopQueries(
    siteUrl: string,
    startDate: string,
    endDate: string,
    limit: number = 10
  ): Promise<TopQuery[]> {
    const searchconsole = google.searchconsole({ version: 'v1', auth: this.oauth2Client });

    try {
      const response = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['query'],
          rowLimit: limit,
        },
      });

      return (response.data.rows || []).map(row => ({
        query: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      }));
    } catch (error) {
      console.error('Error fetching top queries:', error);
      throw new Error('Failed to fetch top queries');
    }
  }

  /**
   * Get top pages
   */
  async getTopPages(
    siteUrl: string,
    startDate: string,
    endDate: string,
    limit: number = 10
  ): Promise<TopPage[]> {
    const searchconsole = google.searchconsole({ version: 'v1', auth: this.oauth2Client });

    try {
      const response = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['page'],
          rowLimit: limit,
        },
      });

      return (response.data.rows || []).map(row => ({
        page: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      }));
    } catch (error) {
      console.error('Error fetching top pages:', error);
      throw new Error('Failed to fetch top pages');
    }
  }

  /**
   * Get site performance over time (daily data)
   */
  async getPerformanceOverTime(
    siteUrl: string,
    startDate: string,
    endDate: string
  ): Promise<Array<{ date: string; clicks: number; impressions: number; ctr: number; position: number }>> {
    const searchconsole = google.searchconsole({ version: 'v1', auth: this.oauth2Client });

    try {
      const response = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['date'],
        },
      });

      return (response.data.rows || []).map(row => ({
        date: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      }));
    } catch (error) {
      console.error('Error fetching performance over time:', error);
      throw new Error('Failed to fetch performance data');
    }
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const sites = await this.getSites();
      return sites.length >= 0; // Even empty array means connection works
    } catch (error) {
      return false;
    }
  }
}

/**
 * Helper function to format dates for Search Console API
 */
export function formatDateForSearchConsole(date: Date): string {
  return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
}

/**
 * Helper function to get date range (last 30 days)
 */
export function getLast30Days(): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  return {
    startDate: formatDateForSearchConsole(startDate),
    endDate: formatDateForSearchConsole(endDate),
  };
}

/**
 * Helper function to get date range (last 7 days)
 */
export function getLast7Days(): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  return {
    startDate: formatDateForSearchConsole(startDate),
    endDate: formatDateForSearchConsole(endDate),
  };
}
