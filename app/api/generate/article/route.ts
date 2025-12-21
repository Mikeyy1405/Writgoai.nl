import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { generateAICompletion } from '@/lib/ai-client';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id, topic, keywords, tone, length } = body;

    if (!project_id || !topic) {
      return NextResponse.json(
        { error: 'Project ID and topic are required' },
        { status: 400 }
      );
    }

    // Verify project belongs to user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Determine word count based on length
    const wordCounts: Record<string, number> = {
      short: 500,
      medium: 1000,
      long: 2000,
    };
    const targetWords = wordCounts[length] || 1000;

    // Generate content with OpenAI
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
    
    // Generate title with AI
    const title = (await generateAICompletion({
      task: 'content',
      systemPrompt: 'You are an expert at writing catchy, SEO-optimized blog titles in Dutch. Respond with only the title, nothing else.',
      userPrompt: `Create a catchy, SEO-optimized title for an article about: "${topic}"${keywords ? ` (keywords: ${keywords})` : ''}`,
      temperature: 0.8,
      maxTokens: 100,
    })).trim() || topic;

    // Save to database
    const { data: article, error: dbError } = await supabase
      .from('articles')
      .insert({
        project_id,
        title,
        content,
        status: 'draft',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save article' },
        { status: 500 }
      );
    }

    // Count words
    const wordCount = content.split(/\s+/).length;

    return NextResponse.json({
      article_id: article.id,
      title,
      content,
      word_count: wordCount,
    });
  } catch (error: any) {
    console.error('Error generating article:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
