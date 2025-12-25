import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get articles scheduled for now or earlier
    const now = new Date().toISOString();
    const { data: scheduledArticles, error: fetchError } = await supabase
      .from('writgo_content_queue')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .order('priority', { ascending: false })
      .order('scheduled_for', { ascending: true })
      .limit(5); // Process max 5 at a time

    if (fetchError) {
      throw new Error(`Failed to fetch scheduled articles: ${fetchError.message}`);
    }

    const results = {
      processed: 0,
      published: 0,
      errors: [] as string[]
    };

    for (const article of scheduledArticles || []) {
      try {
        results.processed++;

        // Generate slug from title
        const slug = article.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .substring(0, 100);

        // Check if slug already exists
        const { data: existingArticle } = await supabase
          .from('articles')
          .select('id')
          .eq('slug', slug)
          .single();

        let finalSlug = slug;
        if (existingArticle) {
          // Add timestamp to make unique
          finalSlug = `${slug}-${Date.now()}`;
        }

        // Publish article
        const { data: publishedArticle, error: publishError } = await supabase
          .from('articles')
          .insert({
            title: article.title,
            slug: finalSlug,
            content: article.content,
            excerpt: article.excerpt,
            featured_image: article.featured_image,
            author_id: '00000000-0000-0000-0000-000000000000', // System user
            status: 'published',
            published_at: new Date().toISOString(),
            meta_title: article.meta_title,
            meta_description: article.meta_description,
            focus_keyword: article.focus_keyword,
            readability_score: 70,
            seo_score: 75
          })
          .select()
          .single();

        if (publishError) {
          results.errors.push(`Failed to publish "${article.title}": ${publishError.message}`);
          
          // Update queue status to error
          await supabase
            .from('writgo_content_queue')
            .update({
              status: 'error',
              error_message: publishError.message
            })
            .eq('id', article.id);
          
          continue;
        }

        // Update queue status to published
        await supabase
          .from('writgo_content_queue')
          .update({
            status: 'published',
            published_at: new Date().toISOString()
          })
          .eq('id', article.id);

        // Log activity
        await supabase
          .from('writgo_activity_logs')
          .insert({
            action: 'article_published',
            details: `Auto-published article: ${article.title}`,
            metadata: {
              article_id: publishedArticle.id,
              queue_id: article.id,
              slug: finalSlug
            }
          });

        results.published++;

      } catch (error: any) {
        results.errors.push(`Error processing "${article.title}": ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      ...results
    });

  } catch (error: any) {
    console.error('Auto-publish error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Allow manual trigger via GET
export async function GET(request: NextRequest) {
  return POST(request);
}
