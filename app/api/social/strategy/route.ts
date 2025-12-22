import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateJSONCompletion, analyzeWithPerplexityJSON } from '@/lib/ai-client';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NicheAnalysis {
  niche: string;
  sub_niche: string;
  target_audience: string;
  audience_demographics: string;
  brand_voice: string;
  unique_selling_points: string[];
  competitors: string[];
  content_themes: string[];
  language: string;
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

// Generate new strategy - FULLY AUTOMATIC with Perplexity
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { project_id } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get project details
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // STEP 1: Use Perplexity Sonar Pro to analyze the website
    const nicheAnalysisPrompt = `Analyseer de website ${project.website_url} en geef een gedetailleerde analyse.

Bezoek de website en analyseer:
1. Wat is de EXACTE niche/branche? (bijv. "Yoga voor beginners", "E-commerce software", "Tandarts praktijk")
2. Wat is de sub-niche of specialisatie?
3. Wie is de doelgroep? (leeftijd, interesses, pijnpunten)
4. Wat zijn de demografische kenmerken van de doelgroep?
5. Wat is de brand voice/tone of voice van de website?
6. Wat zijn de unique selling points?
7. Wie zijn de concurrenten in deze markt?
8. Welke content thema's zijn relevant?
9. In welke taal is de website?

BELANGRIJK: Baseer je analyse op de DAADWERKELIJKE inhoud van de website, niet op aannames.

Antwoord in JSON formaat:
{
  "niche": "De exacte niche (bijv. Yoga, Fitness, Software, etc.)",
  "sub_niche": "Specifieke focus binnen de niche",
  "target_audience": "Beschrijving van de doelgroep",
  "audience_demographics": "Demografische kenmerken",
  "brand_voice": "Tone of voice beschrijving",
  "unique_selling_points": ["USP 1", "USP 2", "USP 3"],
  "competitors": ["Concurrent 1", "Concurrent 2"],
  "content_themes": ["Thema 1", "Thema 2", "Thema 3", "Thema 4"],
  "language": "nl of en"
}`;

    console.log('Analyzing website with Perplexity:', project.website_url);
    
    const nicheAnalysis = await analyzeWithPerplexityJSON<NicheAnalysis>(nicheAnalysisPrompt);
    
    console.log('Niche analysis result:', nicheAnalysis);

    // STEP 2: Generate strategy with Claude based on Perplexity analysis
    const strategyPrompt = `Je bent een social media strategie expert. Genereer een COMPLETE social media contentstrategie gebaseerd op deze website analyse:

WEBSITE ANALYSE (door Perplexity):
- Website: ${project.website_url}
- Naam: ${project.name}
- Niche: ${nicheAnalysis.niche}
- Sub-niche: ${nicheAnalysis.sub_niche}
- Doelgroep: ${nicheAnalysis.target_audience}
- Demographics: ${nicheAnalysis.audience_demographics}
- Brand Voice: ${nicheAnalysis.brand_voice}
- USPs: ${nicheAnalysis.unique_selling_points?.join(', ')}
- Content Thema's: ${nicheAnalysis.content_themes?.join(', ')}
- Taal: ${nicheAnalysis.language}

Genereer een JSON object met PRECIES deze structuur:
{
  "content_pillars": [
    {
      "name": "Pillar naam relevant voor ${nicheAnalysis.niche}",
      "description": "Korte beschrijving",
      "percentage": 25,
      "example_topics": ["topic1", "topic2", "topic3"]
    }
  ],
  "weekly_schedule": {
    "monday": { "post_type": "Educatief", "pillar": "pillar naam", "best_time": "09:00" },
    "tuesday": { "post_type": "Storytelling", "pillar": "pillar naam", "best_time": "12:00" },
    "wednesday": { "post_type": "Engagement", "pillar": "pillar naam", "best_time": "15:00" },
    "thursday": { "post_type": "Behind the Scenes", "pillar": "pillar naam", "best_time": "09:00" },
    "friday": { "post_type": "Educatief", "pillar": "pillar naam", "best_time": "12:00" },
    "saturday": { "post_type": "Promotioneel", "pillar": "pillar naam", "best_time": "10:00" },
    "sunday": { "post_type": "Engagement", "pillar": "pillar naam", "best_time": "11:00" }
  },
  "post_types_mix": [
    { "type": "Storytelling", "percentage": 20, "description": "Persoonlijke verhalen" },
    { "type": "Educatief", "percentage": 30, "description": "Tips en how-to's" },
    { "type": "Engagement", "percentage": 20, "description": "Vragen en polls" },
    { "type": "Promotioneel", "percentage": 15, "description": "Product highlights" },
    { "type": "Behind the Scenes", "percentage": 15, "description": "Achter de schermen" }
  ],
  "hashtag_strategy": {
    "branded": ["#merknaam"],
    "niche": ["#relevante", "#niche", "#hashtags voor ${nicheAnalysis.niche}"],
    "trending": ["#trending"],
    "community": ["#community"]
  },
  "engagement_tactics": [
    "Tactiek 1 specifiek voor ${nicheAnalysis.niche}",
    "Tactiek 2 specifiek voor ${nicheAnalysis.target_audience}",
    "Tactiek 3",
    "Tactiek 4",
    "Tactiek 5"
  ],
  "content_ideas": [
    {
      "title": "Post titel relevant voor ${nicheAnalysis.niche}",
      "type": "Post type",
      "pillar": "Content pillar",
      "hook": "Aandachttrekkende opening",
      "cta": "Call to action"
    }
  ]
}

BELANGRIJK:
- Content pillars MOETEN relevant zijn voor ${nicheAnalysis.niche}, NIET voor "content marketing"
- Genereer 4 content pillars specifiek voor deze niche
- Hashtags moeten ${nicheAnalysis.language === 'nl' ? 'Nederlands' : 'Engels'} zijn en relevant voor ${nicheAnalysis.niche}
- Genereer minimaal 15 content ideas specifiek voor ${nicheAnalysis.niche}
- Alles in het ${nicheAnalysis.language === 'nl' ? 'Nederlands' : 'Engels'}

Antwoord ALLEEN met het JSON object.`;

    const strategyData = await generateJSONCompletion<any>({
      task: 'content',
      systemPrompt: 'Je bent een social media strategie expert. Je antwoordt ALTIJD met pure, valid JSON zonder markdown code blocks.',
      userPrompt: strategyPrompt,
      maxTokens: 4000,
      temperature: 0.6,
    });

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
      niche: nicheAnalysis.niche,
      target_audience: nicheAnalysis.target_audience,
      brand_voice: nicheAnalysis.brand_voice,
      content_pillars: strategyData.content_pillars,
      weekly_schedule: strategyData.weekly_schedule,
      post_types_mix: strategyData.post_types_mix,
      hashtag_strategy: strategyData.hashtag_strategy,
      engagement_tactics: strategyData.engagement_tactics,
      goals: nicheAnalysis.unique_selling_points || [],
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
      content_ideas: strategyData.content_ideas || [],
      detected: {
        niche: nicheAnalysis.niche,
        audience: nicheAnalysis.target_audience,
        voice: nicheAnalysis.brand_voice,
        goals: nicheAnalysis.unique_selling_points,
      }
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
