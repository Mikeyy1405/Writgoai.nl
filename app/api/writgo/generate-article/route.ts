import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { discoverTopics } from '@/lib/topic-discovery';
import { generateAdvancedContent } from '@/lib/advanced-content-generator';
import { generateFeaturedImage } from '@/lib/aiml-image-generator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. AI discovers a relevant topic
    const topics = await discoverTopics(1);
    const topic = topics[0];

    // 2. Generate full article with AI
    const content = await generateAdvancedContent({
      title: topic.title,
      metadata: {
        description: topic.description,
        topic: topic.category
      } as any
    });

    // 3. Generate featured image
    const featuredImage = await generateFeaturedImage({
      title: topic.title,
      description: topic.description,
      style: 'photorealistic'
    });

    // 4. Save to content queue (scheduled for tomorrow 10:00)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const { data: queueItem, error: queueError } = await supabase
      .from('writgo_content_queue')
      .insert({
        title: content.title,
        content: content.content,
        excerpt: content.excerpt,
        featured_image: featuredImage,
        status: 'scheduled',
        scheduled_for: tomorrow.toISOString(),
        metadata: {
          topic: topic.category,
          keywords: topic.keywords,
          generated_at: new Date().toISOString(),
          method: 'ai_discovery'
        }
      })
      .select()
      .single();

    if (queueError) {
      throw new Error(`Queue error: ${queueError.message}`);
    }

    // 5. Log activity
    await supabase
      .from('writgo_activity_log')
      .insert({
        action: 'article_generated',
        details: {
          title: content.title,
          topic: topic.category,
          method: 'one_click_ai',
          scheduled_for: tomorrow.toISOString()
        }
      });

    return NextResponse.json({
      success: true,
      article: {
        id: queueItem.id,
        title: content.title,
        topic: topic.category,
        scheduled_for: tomorrow.toISOString(),
        word_count: content.content.split(' ').length
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
