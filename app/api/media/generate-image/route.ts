import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { generateImage, generateFeaturedImage } from '@/lib/ai-image-client';

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

    const startTime = Date.now();
    let imageUrl: string;

    if (type === 'featured' && article_id) {
      // Get article details
      const { data: article } = await supabase
        .from('articles')
        .select('title, content')
        .eq('id', article_id)
        .single();

      if (!article) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 });
      }

      // Generate featured image
      imageUrl = await generateFeaturedImage({
        articleTitle: article.title,
        articleSummary: article.content.substring(0, 200),
        style,
      });
    } else {
      // Generate custom image
      const images = await generateImage({
        prompt: prompt || 'Professional blog illustration',
        aspectRatio: '16:9',
        numImages: 1,
      });
      imageUrl = images[0];
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
        model: 'flux-pro',
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
      model: 'flux-pro',
      prompt,
      output: imageUrl,
      duration_ms: duration,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      media_id: media?.id,
      url: imageUrl,
      duration_ms: duration,
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
