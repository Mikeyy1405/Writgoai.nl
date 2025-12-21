import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { generateAICompletion } from '@/lib/ai-client';
import { generateFeaturedImage } from '@/lib/ai-image-client';

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
    const { project_id, topic, keywords, tone, length, generate_image = true } = body;

    if (!project_id || !topic) {
      return NextResponse.json(
        { error: 'Project ID and topic are required' },
        { status: 400 }
      );
    }

    // Verify project
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const wordCounts: Record<string, number> = {
      short: 500,
      medium: 1000,
      long: 2000,
    };
    const targetWords = wordCounts[length] || 1000;

    // Generate title
    const startTime = Date.now();
    const title = (await generateAICompletion({
      task: 'content',
      systemPrompt: 'You are an expert at writing catchy, SEO-optimized blog titles in Dutch. Respond with only the title, nothing else.',
      userPrompt: `Create a catchy, SEO-optimized title for an article about: "${topic}"${keywords ? ` (keywords: ${keywords})` : ''}`,
      temperature: 0.8,
      maxTokens: 100,
    })).trim() || topic;

    // Generate content
    const prompt = `Write a comprehensive, SEO-optimized blog article about: "${topic}"

${keywords ? `Focus on these keywords: ${keywords}` : ''}

Requirements:
- Tone: ${tone}
- Length: approximately ${targetWords} words
- Include an engaging introduction
- Use headers (H2, H3) to structure the content
- Include practical tips and actionable advice
- Write in Dutch language
- Make it SEO-friendly with natural keyword usage
- End with a strong conclusion

Format the output as HTML with proper heading tags (<h2>, <h3>, <p>, <ul>, <li>, etc.).`;

    const content = await generateAICompletion({
      task: 'content',
      systemPrompt: 'You are an expert SEO content writer who creates engaging, well-structured blog articles in Dutch. You always format your output as clean HTML.',
      userPrompt: prompt,
      temperature: 0.7,
      maxTokens: 4000,
    });

    const generationTime = Date.now() - startTime;

    // Save article
    const { data: article, error: dbError } = await supabase
      .from('articles')
      .insert({
        project_id,
        title,
        content,
        status: 'draft',
        model_used: 'gemini-3-pro',
        generation_time_ms: generationTime,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to save article' }, { status: 500 });
    }

    // Generate featured image
    let featuredImageUrl = null;
    if (generate_image) {
      try {
        const imageStartTime = Date.now();
        featuredImageUrl = await generateFeaturedImage({
          articleTitle: title,
          articleSummary: content.substring(0, 200),
          style: 'professional',
        });

        // Save media
        const { data: media } = await supabase
          .from('media')
          .insert({
            project_id,
            article_id: article.id,
            type: 'image',
            url: featuredImageUrl,
            prompt: `Featured image for: ${title}`,
            model: 'flux-pro',
            status: 'generated',
          })
          .select()
          .single();

        // Update article with featured image
        if (media) {
          await supabase
            .from('articles')
            .update({ featured_image_id: media.id })
            .eq('id', article.id);
        }

        // Log image generation
        await supabase.from('ai_generation_logs').insert({
          project_id,
          type: 'image',
          model: 'flux-pro',
          prompt: `Featured image for: ${title}`,
          output: featuredImageUrl,
          duration_ms: Date.now() - imageStartTime,
          status: 'success',
        });
      } catch (error) {
        console.error('Failed to generate image:', error);
        // Continue without image
      }
    }

    // Log text generation
    await supabase.from('ai_generation_logs').insert({
      project_id,
      type: 'text',
      model: 'gemini-3-pro',
      prompt: topic,
      output: title,
      duration_ms: generationTime,
      status: 'success',
    });

    const wordCount = content.split(/\s+/).length;

    return NextResponse.json({
      article_id: article.id,
      title,
      content,
      word_count: wordCount,
      featured_image: featuredImageUrl,
      generation_time_ms: generationTime,
    });
  } catch (error: any) {
    console.error('Error generating article:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
