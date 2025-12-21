import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAdvancedContent } from '@/lib/advanced-content-generator';
import { generateFeaturedImage } from '@/lib/image-generator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { opportunityId } = await request.json();

    if (!opportunityId) {
      return NextResponse.json(
        { error: 'opportunityId is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get opportunity
    const { data: opportunity, error: oppError } = await supabase
      .from('writgo_content_opportunities')
      .select('*, writgo_content_triggers(*)')
      .eq('id', opportunityId)
      .single();

    if (oppError || !opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    // Update status to generating
    await supabase
      .from('writgo_content_opportunities')
      .update({ status: 'generating' })
      .eq('id', opportunityId);

    // Get related articles for internal linking
    const { data: relatedArticles } = await supabase
      .from('articles')
      .select('title, slug')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(5);

    // Generate advanced content with SEO features
    const generated = await generateAdvancedContent(
      opportunity,
      relatedArticles || []
    );

    // Generate featured image
    const featuredImage = await generateFeaturedImage({
      title: opportunity.title,
      description: opportunity.metadata?.description,
      style: 'photorealistic'
    });

    // Schedule for tomorrow 10:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    // Insert into content queue
    const { data: queuedArticle, error: queueError } = await supabase
      .from('writgo_content_queue')
      .insert({
        title: generated.title,
        content: generated.content,
        excerpt: generated.excerpt,
        focus_keyword: generated.focusKeyword,
        meta_title: generated.metaTitle,
        meta_description: generated.metaDescription,
        featured_image: featuredImage,
        scheduled_for: tomorrow.toISOString(),
        status: 'scheduled',
        priority: opportunity.priority || 5,
        metadata: {
          schema: generated.schema,
          wordCount: generated.wordCount,
          internalLinks: generated.internalLinks
        }
      })
      .select()
      .single();

    if (queueError) {
      throw new Error(`Failed to queue article: ${queueError.message}`);
    }

    // Update opportunity status
    await supabase
      .from('writgo_content_opportunities')
      .update({
        status: 'queued',
        article_id: queuedArticle.id
      })
      .eq('id', opportunityId);

    // Log activity
    await supabase
      .from('writgo_activity_logs')
      .insert({
        action: 'content_generated',
        details: `Generated article from opportunity: ${opportunity.title}`,
        metadata: {
          opportunity_id: opportunityId,
          article_id: queuedArticle.id,
          title: generated.title,
          wordCount: generated.wordCount
        }
      });

    return NextResponse.json({
      success: true,
      article: queuedArticle,
      wordCount: generated.wordCount,
      message: `Article "${generated.title}" generated (${generated.wordCount} words) and scheduled for ${tomorrow.toLocaleDateString()}`
    });

  } catch (error: any) {
    console.error('Process opportunity error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
