import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { discoverTrendingTopics, discoverContentGaps } from '@/lib/ai-discovery';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/writgo/discover/ai-topics
 * Discover trending topics using Perplexity AI
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mode = 'trending', topicId, count = 10 } = body;

    let discoveries = [];

    if (mode === 'trending') {
      // Discover trending topics across all main topics
      const topics = [
        'Google SEO updates',
        'AI SEO tools',
        'WordPress SEO',
        'Content marketing SEO',
        'Local SEO'
      ];
      
      discoveries = await discoverTrendingTopics(topics, count);
    } else if (mode === 'gaps' && topicId) {
      // Discover content gaps for specific topic
      const { data: existingArticles } = await supabase
        .from('articles')
        .select('title')
        .eq('topic_id', topicId)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(50);

      const titles = existingArticles?.map(a => a.title) || [];
      discoveries = await discoverContentGaps(topicId, titles);
    } else {
      return NextResponse.json({ error: 'Invalid mode or missing topicId' }, { status: 400 });
    }

    // Save discoveries as opportunities
    const opportunities = discoveries.map(d => ({
      title: d.title,
      metadata: {
        description: d.description,
        keywords: d.keywords,
        sources: d.sources,
        reasoning: d.reasoning,
        trending: d.trending
      },
      topic_id: d.suggestedTopicId,
      content_type: d.contentType,
      discovery_source: 'ai',
      status: 'detected',
      detected_at: new Date().toISOString()
    }));

    if (opportunities.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('writgo_content_opportunities')
        .insert(opportunities)
        .select();

      if (insertError) {
        console.error('Error inserting opportunities:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      // Log activity
      await supabase.from('writgo_activity_logs').insert({
        action_type: 'ai_discovery',
        description: `AI ontdekte ${discoveries.length} nieuwe content opportunities (${mode})`,
        status: 'success',
        metadata: { mode, topicId, count: discoveries.length }
      });

      return NextResponse.json({
        success: true,
        discoveries,
        opportunities: inserted,
        count: discoveries.length
      });
    }

    return NextResponse.json({
      success: true,
      discoveries: [],
      count: 0,
      message: 'Geen nieuwe opportunities gevonden'
    });

  } catch (error: any) {
    console.error('Error in AI topic discovery:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
