import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize OpenAI client lazily to avoid build errors
function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  });
}

// Get strategy for a project
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const { data: strategy, error } = await supabaseAdmin
      .from('social_strategies')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({ strategy: strategy || null });
  } catch (error: any) {
    console.error('Get strategy error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Generate new strategy
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { project_id, website_url, niche, target_audience, brand_voice, goals } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Generate strategy with AI
    const prompt = `Je bent een social media strategie expert. Genereer een complete social media contentstrategie voor het volgende bedrijf:

Website: ${website_url || 'Niet opgegeven'}
Niche: ${niche || 'Niet opgegeven'}
Doelgroep: ${target_audience || 'Niet opgegeven'}
Brand Voice: ${brand_voice || 'Professioneel maar toegankelijk'}
Doelen: ${goals?.join(', ') || 'Meer engagement, merkbekendheid'}

Genereer een JSON object met de volgende structuur:
{
  "content_pillars": [
    {
      "name": "Pillar naam",
      "description": "Beschrijving",
      "percentage": 25,
      "example_topics": ["topic1", "topic2", "topic3"]
    }
  ],
  "weekly_schedule": {
    "monday": { "post_type": "type", "pillar": "pillar naam", "best_time": "09:00" },
    "tuesday": { "post_type": "type", "pillar": "pillar naam", "best_time": "12:00" },
    "wednesday": { "post_type": "type", "pillar": "pillar naam", "best_time": "15:00" },
    "thursday": { "post_type": "type", "pillar": "pillar naam", "best_time": "09:00" },
    "friday": { "post_type": "type", "pillar": "pillar naam", "best_time": "12:00" },
    "saturday": { "post_type": "type", "pillar": "pillar naam", "best_time": "10:00" },
    "sunday": { "post_type": "type", "pillar": "pillar naam", "best_time": "11:00" }
  },
  "post_types_mix": [
    { "type": "Storytelling", "percentage": 20, "description": "Persoonlijke verhalen en behind-the-scenes" },
    { "type": "Educatief", "percentage": 30, "description": "Tips, how-to's en waardevolle informatie" },
    { "type": "Engagement", "percentage": 20, "description": "Vragen, polls en interactieve content" },
    { "type": "Promotioneel", "percentage": 15, "description": "Product/dienst highlights" },
    { "type": "User Generated", "percentage": 15, "description": "Reviews, testimonials, reposts" }
  ],
  "hashtag_strategy": {
    "branded": ["#merkhashtag1", "#merkhashtag2"],
    "niche": ["#niche1", "#niche2", "#niche3"],
    "trending": ["#trending1", "#trending2"],
    "community": ["#community1", "#community2"]
  },
  "engagement_tactics": [
    "Tactiek 1",
    "Tactiek 2",
    "Tactiek 3",
    "Tactiek 4",
    "Tactiek 5"
  ],
  "content_ideas": [
    {
      "title": "Post idee titel",
      "type": "Post type",
      "pillar": "Content pillar",
      "hook": "Aandachttrekkende opening",
      "cta": "Call to action"
    }
  ]
}

Zorg dat:
1. Content pillars relevant zijn voor de niche
2. Weekly schedule gevarieerd is met verschillende post types
3. Hashtags relevant en actueel zijn voor de Nederlandse markt
4. Engagement tactics praktisch en uitvoerbaar zijn
5. Genereer minimaal 10 concrete content ideas

Antwoord ALLEEN met het JSON object, geen andere tekst.`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    
    // Parse JSON from response
    let strategyData;
    try {
      // Remove markdown code blocks if present
      const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      strategyData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Failed to parse strategy JSON:', parseError);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Check if strategy exists for this project
    const { data: existingStrategy } = await supabaseAdmin
      .from('social_strategies')
      .select('id')
      .eq('project_id', project_id)
      .limit(1)
      .single();

    let result;
    const strategyRecord = {
      project_id,
      niche,
      target_audience,
      brand_voice,
      content_pillars: strategyData.content_pillars,
      weekly_schedule: strategyData.weekly_schedule,
      post_types_mix: strategyData.post_types_mix,
      hashtag_strategy: strategyData.hashtag_strategy,
      engagement_tactics: strategyData.engagement_tactics,
      goals: goals || [],
      updated_at: new Date().toISOString(),
    };

    if (existingStrategy) {
      const { data, error } = await supabaseAdmin
        .from('social_strategies')
        .update(strategyRecord)
        .eq('id', existingStrategy.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('social_strategies')
        .insert(strategyRecord)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ 
      success: true, 
      strategy: result,
      content_ideas: strategyData.content_ideas || []
    });
  } catch (error: any) {
    console.error('Generate strategy error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update strategy
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Strategy ID is required' }, { status: 400 });
    }

    const { data: strategy, error } = await supabaseAdmin
      .from('social_strategies')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, strategy });
  } catch (error: any) {
    console.error('Update strategy error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
