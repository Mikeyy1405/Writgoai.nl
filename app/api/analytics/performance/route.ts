import { NextRequest, NextResponse } from 'next/server';
import { gscClient } from '@/lib/google-search-console';
import { gaClient } from '@/lib/google-analytics';
import { createClient } from '@/lib/supabase-server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '28');

    // Get Search Console data
    const [
      blogPerformance,
      topKeywords,
      needsImprovement,
      topPerforming,
      declining
    ] = await Promise.all([
      gscClient.getBlogPerformance(days),
      gscClient.getTopKeywords(days, 50),
      gscClient.getArticlesNeedingImprovement(),
      gscClient.getTopPerformingArticles(10),
      gscClient.getDecliningArticles(),
    ]);

    // Get Analytics data
    const [
      pageViews,
      trafficSources,
      siteMetrics
    ] = await Promise.all([
      gaClient.getBlogPageViews(days),
      gaClient.getTrafficSources(days),
      gaClient.getSiteMetrics(days),
    ]);

    // Merge GSC and GA data
    const supabase = createClient();
    const { data: articles } = await supabase
      .from('articles')
      .select('id, slug, title, created_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    const enrichedPerformance = blogPerformance.map(gscData => {
      // Find matching article
      const slug = gscData.page.split('/blog/')[1]?.replace('/', '');
      const article = articles?.find(a => a.slug === slug);

      // Find matching GA data
      const gaData = pageViews.find(pv => pv.pagePath === gscData.page);

      return {
        ...gscData,
        articleId: article?.id,
        articleTitle: article?.title,
        publishedAt: article?.published_at,
        // GA metrics
        views: gaData?.views || 0,
        users: gaData?.users || 0,
        sessions: gaData?.sessions || 0,
        avgEngagementTime: gaData?.avgEngagementTime || 0,
        bounceRate: gaData?.bounceRate || 0,
      };
    });

    return NextResponse.json({
      performance: enrichedPerformance,
      topKeywords,
      needsImprovement: needsImprovement.map(item => {
        const slug = item.page.split('/blog/')[1]?.replace('/', '');
        const article = articles?.find(a => a.slug === slug);
        return {
          ...item,
          articleId: article?.id,
          articleTitle: article?.title,
        };
      }),
      topPerforming: topPerforming.map(item => {
        const slug = item.page.split('/blog/')[1]?.replace('/', '');
        const article = articles?.find(a => a.slug === slug);
        return {
          ...item,
          articleId: article?.id,
          articleTitle: article?.title,
        };
      }),
      declining: declining.map(item => {
        const slug = item.page.split('/blog/')[1]?.replace('/', '');
        const article = articles?.find(a => a.slug === slug);
        return {
          ...item,
          articleId: article?.id,
          articleTitle: article?.title,
        };
      }),
      trafficSources,
      siteMetrics,
    });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}
