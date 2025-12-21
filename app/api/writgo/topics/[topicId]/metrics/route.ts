import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/writgo/topics/[topicId]/metrics
 * Get metrics for a specific topic
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topicId } = params;

    // Get article counts
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('content_type')
      .eq('topic_id', topicId)
      .eq('status', 'published');

    if (articlesError) {
      console.error('Error fetching articles:', articlesError);
    }

    const articleCount = articles?.length || 0;
    const pillarCount = articles?.filter(a => a.content_type === 'pillar').length || 0;
    const clusterCount = articles?.filter(a => a.content_type === 'cluster').length || 0;

    // Get total articles for percentage calculation
    const { data: totalArticles } = await supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published');

    const total = totalArticles?.length || 1;
    const currentPercentage = (articleCount / total) * 100;

    // Calculate authority score
    // Simple formula: (pillar * 10) + (cluster * 5) + (articles * 2)
    const authorityScore = Math.min(100, (pillarCount * 10) + (clusterCount * 5) + (articleCount * 2));

    return NextResponse.json({
      success: true,
      metrics: {
        topicId,
        articleCount,
        pillarCount,
        clusterCount,
        authorityScore,
        currentPercentage
      }
    });

  } catch (error: any) {
    console.error('Error fetching topic metrics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
