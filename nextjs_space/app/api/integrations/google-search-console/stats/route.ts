import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { GoogleSearchConsole, getLast30Days, getLast7Days } from '@/lib/google-search-console';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';

/**
 * GET /api/integrations/google-search-console/stats
 * Get Search Console stats for the user's site
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check if Google Search Console is connected
    if (!client.googleSearchConsoleToken) {
      return NextResponse.json(
        { error: 'Google Search Console not connected', connected: false },
        { status: 200 }
      );
    }

    // Decrypt tokens
    const accessToken = decrypt(client.googleSearchConsoleToken);
    const refreshToken = client.googleSearchConsoleRefreshToken
      ? decrypt(client.googleSearchConsoleRefreshToken)
      : undefined;

    // Parse sites
    const sites = client.googleSearchConsoleSites
      ? JSON.parse(client.googleSearchConsoleSites as string)
      : [];

    if (sites.length === 0) {
      return NextResponse.json(
        { error: 'No sites found', connected: true, sites: [] },
        { status: 200 }
      );
    }

    // Use first site (or allow user to select in future)
    const siteUrl = sites[0];

    // Initialize GSC client
    const gsc = new GoogleSearchConsole(accessToken, refreshToken);

    // Get date ranges
    const last30Days = getLast30Days();
    const last7Days = getLast7Days();

    // Fetch data in parallel
    const [overallStats, topQueries, topPages, performanceData] = await Promise.all([
      gsc.getSearchAnalytics(siteUrl, last30Days.startDate, last30Days.endDate),
      gsc.getTopQueries(siteUrl, last30Days.startDate, last30Days.endDate, 10),
      gsc.getTopPages(siteUrl, last30Days.startDate, last30Days.endDate, 10),
      gsc.getPerformanceOverTime(siteUrl, last7Days.startDate, last7Days.endDate),
    ]);

    return NextResponse.json({
      connected: true,
      siteUrl,
      sites,
      stats: overallStats,
      topQueries,
      topPages,
      performanceData,
      dateRange: {
        start: last30Days.startDate,
        end: last30Days.endDate,
      },
    });
  } catch (error) {
    console.error('Error fetching Google Search Console stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
