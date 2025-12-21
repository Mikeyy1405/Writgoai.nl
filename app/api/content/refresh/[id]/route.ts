import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { contentRefresher } from '@/lib/content-refresher';
import { gscClient } from '@/lib/google-search-console';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = params.id;
    const supabase = createClient();

    // Get article
    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (error || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Get performance data to understand why refresh is needed
    const blogPerformance = await gscClient.getBlogPerformance(28);
    const articlePerf = blogPerformance.find(p => 
      p.page.includes(article.slug)
    );

    // Extract top keywords
    const keywords = articlePerf?.keywords
      ?.slice(0, 5)
      .map(k => k.query) || [];

    // Refresh the article
    const refreshed = await contentRefresher.refreshArticle({
      articleId,
      reason: 'manual',
      currentContent: article.content,
      currentTitle: article.title,
      keywords,
      position: articlePerf?.position,
    });

    // Save refreshed content
    await contentRefresher.saveRefreshedArticle(
      articleId,
      refreshed.updatedContent,
      refreshed.updatedTitle,
      refreshed.changes
    );

    return NextResponse.json({
      success: true,
      changes: refreshed.changes,
      updatedTitle: refreshed.updatedTitle,
      message: 'Article successfully refreshed',
    });
  } catch (error) {
    console.error('Error refreshing article:', error);
    return NextResponse.json(
      { error: 'Failed to refresh article' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if article needs refresh
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = params.id;
    const supabase = createClient();

    const { data: article } = await supabase
      .from('articles')
      .select('id, title, slug, updated_at, published_at')
      .eq('id', articleId)
      .single();

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Check if article is outdated
    const updatedAt = new Date(article.updated_at || article.published_at);
    const now = new Date();
    const monthsSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24 * 30);

    const needsRefresh = monthsSinceUpdate > 6;

    return NextResponse.json({
      needsRefresh,
      monthsSinceUpdate: Math.round(monthsSinceUpdate),
      lastUpdated: article.updated_at || article.published_at,
    });
  } catch (error) {
    console.error('Error checking refresh status:', error);
    return NextResponse.json(
      { error: 'Failed to check refresh status' },
      { status: 500 }
    );
  }
}
