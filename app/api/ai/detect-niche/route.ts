import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Get project
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch WordPress posts to analyze
    const wpResponse = await fetch(`${project.wp_url}/posts?per_page=10`, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${project.wp_username}:${project.wp_password}`).toString('base64'),
      },
    });

    if (!wpResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch WordPress posts' }, { status: 500 });
    }

    const posts = await wpResponse.json();

    // Analyze site with AI
    const analysisPrompt = `Analyze this WordPress website and determine:

Website: ${project.website_url}
Name: ${project.name}

Recent Posts:
${posts.map((p: any) => `- ${p.title.rendered}`).join('\n')}

Post Content Samples:
${posts.slice(0, 3).map((p: any) => {
  const content = p.content.rendered.replace(/<[^>]*>/g, '').substring(0, 300);
  return `"${p.title.rendered}": ${content}...`;
}).join('\n\n')}

Based on this information, provide:

1. **Primary Niche** (one clear category, e.g., "Technology", "Fitness", "Food & Recipes")
2. **Sub-Niches** (2-3 specific topics within the niche)
3. **Target Audience** (who reads this site?)
4. **Content Style** (professional, casual, technical, etc.)
5. **Current Strengths** (what's working well?)
6. **Opportunities** (what's missing or could be improved?)

Respond in JSON format:
{
  "niche": "Primary Niche",
  "sub_niches": ["sub1", "sub2", "sub3"],
  "target_audience": "description",
  "content_style": "style",
  "strengths": ["strength1", "strength2"],
  "opportunities": ["opp1", "opp2", "opp3"]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert SEO analyst who understands website niches and content strategies. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');

    // Save analysis to project
    await supabase
      .from('projects')
      .update({
        niche: analysis.niche,
        niche_analysis: analysis,
      })
      .eq('id', project_id);

    // Log activity
    await supabase.from('activity_logs').insert({
      project_id,
      action: 'scan',
      message: `Niche detected: ${analysis.niche}`,
      details: analysis,
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Error detecting niche:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
