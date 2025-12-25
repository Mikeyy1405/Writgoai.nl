import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { queueId } = await request.json();

    if (!queueId) {
      return NextResponse.json({ error: 'Queue ID required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get queue item
    const { data: queueItem, error: queueError } = await getSupabase()
      .from('writgo_content_queue')
      .select('*')
      .eq('id', queueId)
      .single();

    if (queueError || !queueItem) {
      return NextResponse.json({ error: 'Queue item not found' }, { status: 404 });
    }

    // Check if already published
    const { data: existing } = await getSupabase()
      .from('articles')
      .select('id')
      .eq('title', queueItem.title)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Article already published' }, { status: 400 });
    }

    // Create slug from title
    const slug = queueItem.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Publish to articles table
    const { data: article, error: publishError } = await getSupabase()
      .from('articles')
      .insert({
        title: queueItem.title,
        slug: slug,
        content: queueItem.content,
        excerpt: queueItem.excerpt,
        featured_image: queueItem.featured_image,
        status: 'published',
        published_at: new Date().toISOString(),
        meta_title: queueItem.meta_title || queueItem.title,
        meta_description: queueItem.meta_description || queueItem.excerpt,
        focus_keyword: queueItem.focus_keyword,
        topic_id: queueItem.topic_id,
        content_type: queueItem.content_type || 'supporting',
        metadata: {
          ...queueItem.metadata,
          published_from_queue: true,
          queue_id: queueId,
          published_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (publishError) {
      console.error('Publish error:', publishError);
      return NextResponse.json({ error: publishError.message }, { status: 500 });
    }

    // Delete from queue
    await getSupabase()
      .from('writgo_content_queue')
      .delete()
      .eq('id', queueId);

    // Log activity
    await getSupabase()
      .from('writgo_activity_log')
      .insert({
        action: 'article_published',
        details: {
          article_id: article.id,
          title: article.title,
          from_queue: true,
          queue_id: queueId
        }
      });

    return NextResponse.json({
      success: true,
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        url: `https://writgo.nl/${article.slug}`
      }
    });

  } catch (error: any) {
    console.error('Publish article error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
