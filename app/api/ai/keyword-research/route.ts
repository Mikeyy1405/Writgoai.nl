import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { generateAICompletion, generateJSONCompletion } from '@/lib/ai-client';
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
    const { project_id, count = 30 } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Get project with niche
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.niche) {
      return NextResponse.json(
        { error: 'Run niche detection first' },
        { status: 400 }
      );
    }

    // Check if user has enough credits BEFORE research
    const creditCheck = await requireCredits(user.id, 'keyword_research');
    if (creditCheck) {
      return creditCheck; // Return error response
    }

    await supabase.from('activity_logs').insert({
      project_id,
      action: 'scan',
      message: 'Starting keyword research...',
    });

    // Get existing articles to avoid duplicates
    const { data: existingArticles } = await supabase
      .from('articles')
      .select('title')
      .eq('project_id', project_id);

    const existingTopics = existingArticles?.map(a => a.title.toLowerCase()) || [];

    // AI-powered keyword research
    const researchPrompt = `Generate ${count} high-value keyword opportunities for a ${project.niche} website.

Website: ${project.name} (${project.website_url})
Niche: ${project.niche}
${project.niche_analysis?.sub_niches ? `Sub-niches: ${project.niche_analysis.sub_niches.join(', ')}` : ''}

Requirements:
1. Focus on long-tail keywords (3-5 words)
2. Mix of informational and commercial intent
3. Realistic ranking opportunities (not ultra-competitive)
4. Diverse topics within the niche
5. Keywords that can become comprehensive articles
6. Consider seasonal and trending topics

Avoid these existing topics:
${existingTopics.slice(0, 20).join(', ')}

For each keyword, provide:
- keyword: the actual keyword phrase
- search_intent: informational/commercial/transactional
- difficulty: easy/medium/hard (estimated)
- opportunity_score: 1-10 (higher = better opportunity)
- article_angle: suggested article title/angle
- target_word_count: recommended article length

Respond in JSON format:
{
  "keywords": [
    {
      "keyword": "example keyword",
      "search_intent": "informational",
      "difficulty": "medium",
      "opportunity_score": 8,
      "article_angle": "The Complete Guide to...",
      "target_word_count": 1500
    }
  ]
}`;

    const research = await generateJSONCompletion<{
      keywords: Array<{
        keyword: string;
        search_intent: string;
        difficulty: string;
        opportunity_score: number;
        article_angle: string;
        target_word_count: number;
      }>;
    }>({
      task: 'content',
      systemPrompt: 'You are an expert SEO keyword researcher with deep knowledge of search trends and ranking opportunities. Always respond with valid JSON.',
      userPrompt: researchPrompt,
      temperature: 0.7,
    });

    // Sort by opportunity score
    const keywords = research.keywords.sort((a: any, b: any) => b.opportunity_score - a.opportunity_score);

    // Save keywords to database (we'll create a keywords table)
    const keywordRecords = keywords.map((kw: any) => ({
      project_id,
      keyword: kw.keyword,
      search_intent: kw.search_intent,
      difficulty: kw.difficulty,
      opportunity_score: kw.opportunity_score,
      article_angle: kw.article_angle,
      target_word_count: kw.target_word_count,
      status: 'pending',
    }));

    // Insert keywords (we'll handle the table creation in migration)
    try {
      await supabase.from('keywords').insert(keywordRecords);
    } catch (e) {
      // Table might not exist yet, that's okay for now
      console.log('Keywords table not ready yet');
    }

    await supabase.from('activity_logs').insert({
      project_id,
      action: 'plan',
      message: `Found ${keywords.length} keyword opportunities`,
      details: { top_keywords: keywords.slice(0, 5) },
    });

    // Deduct credits AFTER successful research
    const creditResult = await deductCreditsAfterAction(user.id, 'keyword_research');

    return NextResponse.json({
      success: true,
      keywords,
      count: keywords.length,
      credits_used: 1,
      credits_remaining: creditResult.remaining,
    });
  } catch (error: any) {
    console.error('Error in keyword research:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
