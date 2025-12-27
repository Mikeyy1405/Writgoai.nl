import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { generateFeaturedImage, generateArticleImage } from '@/lib/aiml-image-generator';
import { requireCredits, deductCreditsAfterAction } from '@/lib/credit-middleware';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id, article_id, prompt, type = 'featured', style = 'professional' } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user has enough credits BEFORE generating
    const creditCheck = await requireCredits(user.id, 'featured_image');
    if (creditCheck) {
      return creditCheck; // Return error response
    }

    const startTime = Date.now();
    let imageUrl: string | null;

    if (type === 'featured' && article_id) {
      // Get article details
      const { data: article } = await supabase
        .from('articles')
        .select('title, content, focus_keyword')
        .eq('id', article_id)
        .single();

      if (!article) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 });
      }

      // Generate featured image using AIML
      imageUrl = await generateFeaturedImage(
        article.title,
        article.focus_keyword || undefined
      );
    } else {
      // Generate custom image using AIML
      imageUrl = await generateArticleImage(
        prompt || 'Professional blog illustration',
        'photorealistic'
      );
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
    }

    const duration = Date.now() - startTime;

    // Save to media table
    const { data: media, error: mediaError } = await supabase
      .from('media')
      .insert({
        project_id,
        article_id: article_id || null,
        type: 'image',
        url: imageUrl,
        prompt,
        model: 'aiml-flux-schnell',
        status: 'generated',
      })
      .select()
      .single();

    if (mediaError) {
      console.error('Failed to save media:', mediaError);
    }

    // Log generation
    await supabase.from('ai_generation_logs').insert({
      project_id,
      type: 'image',
      model: 'aiml-flux-schnell',
      prompt,
      output: imageUrl,
      duration_ms: duration,
      status: 'success',
      credits_used: 1,
    });

    // Deduct credits AFTER successful generation
    const creditResult = await deductCreditsAfterAction(user.id, 'featured_image');

    return NextResponse.json({
      success: true,
      media_id: media?.id,
      url: imageUrl,
      duration_ms: duration,
      credits_used: 1,
      credits_remaining: creditResult.remaining,
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
