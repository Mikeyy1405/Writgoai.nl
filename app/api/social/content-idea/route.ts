import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get a specific content idea from the social strategy by index
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const ideaIndex = searchParams.get('index');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (ideaIndex === null) {
      return NextResponse.json({ error: 'Idea index is required' }, { status: 400 });
    }

    const index = parseInt(ideaIndex, 10);
    if (isNaN(index) || index < 0) {
      return NextResponse.json({ error: 'Invalid idea index' }, { status: 400 });
    }

    // Get the social strategy
    const { data: strategy, error } = await supabaseAdmin
      .from('social_strategies')
      .select('content_ideas, niche, target_audience, brand_voice, hashtag_strategy')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !strategy) {
      return NextResponse.json({ error: 'No social strategy found for this project' }, { status: 404 });
    }

    const ideas = strategy.content_ideas as any[];
    
    if (!ideas || !Array.isArray(ideas) || ideas.length === 0) {
      return NextResponse.json({ error: 'Social strategy has no content ideas' }, { status: 404 });
    }

    if (index >= ideas.length) {
      return NextResponse.json({ error: 'Idea index out of range' }, { status: 404 });
    }

    const idea = ideas[index];

    return NextResponse.json({ 
      idea: {
        ...idea,
        index,
        niche: strategy.niche,
        target_audience: strategy.target_audience,
        brand_voice: strategy.brand_voice,
        hashtag_strategy: strategy.hashtag_strategy,
      },
      totalIdeas: ideas.length,
    });
  } catch (error: any) {
    console.error('Get content idea error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
