import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create a placeholder queue item immediately
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const { data: queueItem, error: queueError } = await supabase
      .from('writgo_content_queue')
      .insert({
        title: 'AI genereert artikel...',
        content: '',
        excerpt: 'Dit artikel wordt momenteel gegenereerd door AI',
        featured_image: '',
        status: 'generating',
        scheduled_for: tomorrow.toISOString(),
        metadata: {
          method: 'one_click_ai',
          queued_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (queueError) {
      throw new Error(`Queue error: ${queueError.message}`);
    }

    // Log activity
    await supabase
      .from('writgo_activity_log')
      .insert({
        action: 'article_queued',
        details: {
          queue_id: queueItem.id,
          method: 'one_click_ai',
          scheduled_for: tomorrow.toISOString()
        }
      });

    // Start background generation (fire and forget)
    generateArticleInBackground(queueItem.id).catch(err => 
      console.error('Background generation error:', err)
    );

    return NextResponse.json({
      success: true,
      article: {
        id: queueItem.id,
        title: 'Artikel wordt gegenereerd...',
        status: 'generating',
        scheduled_for: tomorrow.toISOString(),
        message: 'AI is bezig met het genereren van een artikel. Dit duurt 1-2 minuten.'
      }
    });

  } catch (error: any) {
    console.error('Generate article error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Background generation function
async function generateArticleInBackground(queueId: string) {
  const { discoverTopics } = await import('@/lib/topic-discovery');
  const { generateAdvancedContent } = await import('@/lib/advanced-content-generator');
  const { generateFeaturedImage } = await import('@/lib/aiml-image-generator');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. AI discovers a relevant topic
    const topics = await discoverTopics(1);
    const topic = topics[0];

    // 2. Generate full article with AI
    const content = await generateAdvancedContent({
      title: topic.title,
      source_url: 'https://writgo.nl',
      metadata: {
        description: topic.description,
        topic: topic.category
      } as any
    });

    // 3. Generate featured image (optional, with fallback)
    let featuredImage = '';
    try {
      const generatedImage = await generateFeaturedImage({
        title: topic.title,
        description: topic.description,
        style: 'photorealistic'
      });
      featuredImage = generatedImage || 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200&h=630&fit=crop';
    } catch (imageError) {
      console.warn('Featured image generation failed, using placeholder:', imageError);
      // Use a placeholder or Unsplash image
      featuredImage = 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200&h=630&fit=crop';
    }

    // 4. Update queue item with generated content
    await supabase
      .from('writgo_content_queue')
      .update({
        title: content.title,
        content: content.content,
        excerpt: content.excerpt,
        featured_image: featuredImage,
        status: 'scheduled',
        metadata: {
          topic: topic.category,
          keywords: topic.keywords,
          generated_at: new Date().toISOString(),
          method: 'one_click_ai'
        }
      })
      .eq('id', queueId);

    // 5. Log completion
    await supabase
      .from('writgo_activity_log')
      .insert({
        action: 'article_generated',
        details: {
          queue_id: queueId,
          title: content.title,
          topic: topic.category,
          word_count: content.content.split(' ').length
        }
      });

    console.log(`✅ Article generated successfully: ${content.title}`);

  } catch (error: any) {
    console.error('Background generation failed:', error);
    
    // Mark as failed
    await supabase
      .from('writgo_content_queue')
      .update({
        status: 'failed',
        metadata: {
          error: error.message,
          failed_at: new Date().toISOString()
        }
      })
      .eq('id', queueId);
  }
}
