import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { generateArticle } from '@/lib/ai-article-generator';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/writgo/generate-article-v2
 * Generate article with topical authority optimization
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
    const {
      opportunityId,
      calendarId,
      title,
      focusKeyword,
      topicId,
      contentType,
      clusterId
    } = body;

    if (!title || !focusKeyword || !topicId) {
      return NextResponse.json(
        { error: 'title, focusKeyword, and topicId are required' },
        { status: 400 }
      );
    }

    // Get topic info
    const { data: topic, error: topicError } = await supabase
      .from('writgo_topics')
      .select('*')
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Get related articles for internal linking
    const { data: relatedArticles } = await supabase
      .from('articles')
      .select('id, title, slug')
      .eq('topic_id', topicId)
      .eq('status', 'published')
      .limit(5);

    const relatedWithUrls = relatedArticles?.map(a => ({
      id: a.id,
      title: a.title,
      url: `/blog/${a.slug}`
    })) || [];

    // Get keywords from cluster if provided
    let keywords: string[] = [];
    if (clusterId) {
      const { data: cluster } = await supabase
        .from('writgo_keyword_clusters')
        .select('keywords')
        .eq('id', clusterId)
        .single();
      
      keywords = cluster?.keywords || [];
    }

    // Generate article
    console.log('Generating article with AI...');
    const article = await generateArticle({
      title,
      focusKeyword,
      topicId,
      topicName: topic.name,
      contentType: contentType || 'supporting',
      clusterId,
      keywords,
      relatedArticles: relatedWithUrls
    });

    console.log(`Article generated: ${article.wordCount} words`);

    // Calculate scheduled time (tomorrow at 9 AM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    // Save to queue
    const { data: queueItem, error: queueError } = await supabase
      .from('writgo_content_queue')
      .insert({
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        focus_keyword: article.focusKeyword,
        topic_id: topicId,
        cluster_id: clusterId,
        content_type: contentType || 'supporting',
        status: 'queued',
        scheduled_for: tomorrow.toISOString(),
        metadata: {
          word_count: article.wordCount,
          ai_overview_optimized: article.aiOverviewOptimized,
          schema_markup: article.schemaMarkup,
          meta_description: article.metaDescription,
          internal_links: article.internalLinks,
          generated_at: new Date().toISOString(),
          opportunity_id: opportunityId,
          calendar_id: calendarId
        }
      })
      .select()
      .single();

    if (queueError) {
      console.error('Error saving to queue:', queueError);
      return NextResponse.json({ error: queueError.message }, { status: 500 });
    }

    // Trigger affiliate opportunity discovery in the background (non-blocking)
    if (queueItem) {
      try {
        console.log('Triggering affiliate opportunity discovery...');
        
        // Get project_id from topic
        const { data: topicWithProject } = await supabase
          .from('writgo_topics')
          .select('id')
          .eq('id', topicId)
          .single();
        
        // For now, we'll use a default project or skip if no project context
        // In a real scenario, you might want to link topics to projects
        if (topicWithProject) {
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '')}/api/affiliate/discover`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              project_id: topic.id, // Using topic id as project for now
              article_id: queueItem.id,
              content: article.content,
              auto_research: true,
            }),
          }).catch(err => {
            console.error('Affiliate discovery failed (non-blocking):', err);
          });
        }
      } catch (discoveryError) {
        // Don't fail the article generation if affiliate discovery fails
        console.error('Affiliate discovery error (non-blocking):', discoveryError);
      }
    }

    // Update opportunity status if provided
    if (opportunityId) {
      await supabase
        .from('writgo_content_opportunities')
        .update({
          status: 'queued',
          article_id: queueItem.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', opportunityId);
    }

    // Update calendar status if provided
    if (calendarId) {
      await supabase
        .from('writgo_content_calendar')
        .update({
          status: 'queued',
          article_id: queueItem.id,
          title: article.title,
          updated_at: new Date().toISOString()
        })
        .eq('id', calendarId);
    }

    // Log activity
    await supabase.from('writgo_activity_logs').insert({
      action_type: 'article_generated',
      description: `Artikel gegenereerd: "${article.title}" (${article.wordCount} woorden)`,
      status: 'success',
      metadata: {
        article_id: queueItem.id,
        topic: topic.name,
        content_type: contentType,
        word_count: article.wordCount,
        ai_overview_optimized: article.aiOverviewOptimized
      }
    });

    return NextResponse.json({
      success: true,
      article: {
        id: queueItem.id,
        title: article.title,
        excerpt: article.excerpt,
        wordCount: article.wordCount,
        scheduledFor: tomorrow.toISOString(),
        aiOverviewOptimized: article.aiOverviewOptimized
      }
    });

  } catch (error: any) {
    console.error('Error generating article:', error);
    
    // Log error
    const supabase = createClient();
    await supabase.from('writgo_activity_logs').insert({
      action_type: 'article_generation_failed',
      description: `Artikel generatie mislukt: ${error.message}`,
      status: 'error',
      metadata: { error: error.message }
    });

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
