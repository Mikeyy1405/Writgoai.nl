import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { generateAICompletion, generateJSONCompletion } from '@/lib/ai-client';


export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id, days = 30 } = body;

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

    await supabase.from('activity_logs').insert({
      project_id,
      action: 'plan',
      message: `Creating ${days}-day content plan...`,
    });

    // Get keywords (from our keyword research)
    let keywords: any[] = [];
    try {
      const { data: kwData } = await supabase
        .from('keywords')
        .select('*')
        .eq('project_id', project_id)
        .eq('status', 'pending')
        .order('opportunity_score', { ascending: false })
        .limit(days);
      
      keywords = kwData || [];
    } catch (e) {
      // If no keywords table or no keywords, generate some inline
      console.log('No keywords found, will generate content topics directly');
    }

    // Create strategic content plan
    const planPrompt = `Create a strategic ${days}-day content publishing plan for a ${project.niche} website.

Website: ${project.name}
Niche: ${project.niche}

${keywords.length > 0 ? `Available Keywords (prioritized by opportunity):
${keywords.slice(0, 20).map((kw, i) => `${i + 1}. "${kw.keyword}" (Score: ${kw.opportunity_score}/10, ${kw.difficulty})`).join('\n')}` : ''}

Create a plan that:
1. Publishes ${Math.ceil(days / 7)} articles per week
2. Mixes content types (guides, how-tos, listicles, comparisons)
3. Builds topical authority progressively
4. Starts with foundational content, then goes deeper
5. Strategic timing (publish on optimal days)

For each article, provide:
- day: which day to publish (1-${days})
- title: compelling article title
- keyword: target keyword
- word_count: recommended length
- content_type: guide/how-to/listicle/comparison/review
- priority: high/medium/low
- rationale: why this article on this day

Respond in JSON:
{
  "plan": [
    {
      "day": 1,
      "title": "...",
      "keyword": "...",
      "word_count": 1500,
      "content_type": "guide",
      "priority": "high",
      "rationale": "..."
    }
  ],
  "strategy_summary": "Overall strategy explanation"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content strategist who creates data-driven publishing plans. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: planPrompt,
        },
      ],
      temperature: 0.6,
      response_format: { type: 'json_object' },
    });

    const planData = JSON.parse(completion.choices[0].message.content || '{"plan":[]}');

    // Save content plan
    const now = new Date();
    const planRecords = planData.plan.map((item: any) => {
      const publishDate = new Date(now);
      publishDate.setDate(publishDate.getDate() + item.day);
      
      return {
        project_id,
        title: item.title,
        keyword: item.keyword,
        target_word_count: item.word_count,
        content_type: item.content_type,
        priority: item.priority,
        scheduled_date: publishDate.toISOString(),
        status: 'scheduled',
        rationale: item.rationale,
      };
    });

    // Save to content_plan table
    try {
      await supabase.from('content_plan').insert(planRecords);
    } catch (e) {
      console.log('Content plan table not ready yet');
    }

    await supabase.from('activity_logs').insert({
      project_id,
      action: 'plan',
      message: `Created ${planData.plan.length}-article content plan`,
      details: { strategy: planData.strategy_summary },
    });

    return NextResponse.json({
      success: true,
      plan: planData.plan,
      strategy: planData.strategy_summary,
      total_articles: planData.plan.length,
    });
  } catch (error: any) {
    console.error('Error creating content plan:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
