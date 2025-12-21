import { NextRequest, NextResponse } from 'next/server';
import { contentRefresher } from '@/lib/content-refresher';
import { gscClient } from '@/lib/google-search-console';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting automatic content refresh...');

    // Get declining articles from Search Console
    const decliningArticles = await gscClient.getDecliningArticles();
    
    // Get old articles that need refresh
    const oldArticles = await contentRefresher.findArticlesNeedingRefresh();

    const articlesToRefresh = [
      ...decliningArticles.slice(0, 3), // Top 3 declining
      ...oldArticles.slice(0, 2), // Top 2 oldest
    ];

    const results = [];

    for (const article of articlesToRefresh) {
      try {
        console.log(`Refreshing article: ${article.articleTitle || article.title}`);

        // Get keywords for this article
        const keywords = article.keywords?.slice(0, 5).map((k: any) => k.query) || [];

        // Refresh the article
        const refreshed = await contentRefresher.refreshArticle({
          articleId: article.articleId || article.id,
          reason: article.position ? 'declining' : 'outdated',
          currentContent: article.content || '',
          currentTitle: article.articleTitle || article.title,
          keywords,
          position: article.position,
        });

        // Save refreshed content
        await contentRefresher.saveRefreshedArticle(
          article.articleId || article.id,
          refreshed.updatedContent,
          refreshed.updatedTitle,
          refreshed.changes
        );

        results.push({
          articleId: article.articleId || article.id,
          title: article.articleTitle || article.title,
          success: true,
          changes: refreshed.changes,
        });

        console.log(`✅ Refreshed: ${article.articleTitle || article.title}`);
      } catch (error) {
        console.error(`❌ Failed to refresh article:`, error);
        results.push({
          articleId: article.articleId || article.id,
          title: article.articleTitle || article.title,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      refreshed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    });
  } catch (error) {
    console.error('Error in content refresh cron:', error);
    return NextResponse.json(
      { error: 'Content refresh failed' },
      { status: 500 }
    );
  }
}
