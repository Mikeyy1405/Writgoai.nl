import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAICompletion, generateJSONCompletion } from '@/lib/ai-client';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Scrape website content for automatic analysis
async function scrapeWebsiteContent(url: string): Promise<{ content: string; title: string; description: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WritGoBot/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    const description = descMatch ? descMatch[1].trim() : '';
    
    // Extract text content (remove scripts, styles, etc.)
    const cleanHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
    
    // Extract headings
    const headings = [...cleanHtml.matchAll(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi)]
      .map(m => m[1].trim())
      .filter(h => h.length > 0)
      .slice(0, 10);
    
    // Extract main text
    const textContent = cleanHtml
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000);

    return {
      content: `${headings.join('. ')}. ${textContent}`,
      title,
      description,
    };
  } catch (error) {
    console.error('Scrape error:', error);
    return { content: '', title: '', description: '' };
  }
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

// Generate new strategy - FULLY AUTOMATIC
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { project_id } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get project details
    const { data: project } = await supabaseAdmin
      .from('Project')
      .select('*')
      .eq('id', project_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Scrape website for automatic analysis
    let websiteContent = { content: '', title: '', description: '' };
    if (project.websiteUrl) {
      websiteContent = await scrapeWebsiteContent(project.websiteUrl);
    }

    // Generate strategy with Claude via AIML - FULLY AUTOMATIC
    const prompt = `Je bent een social media strategie expert. Analyseer deze website en genereer een COMPLETE social media contentstrategie.

WEBSITE INFORMATIE:
- URL: ${project.websiteUrl || 'Niet beschikbaar'}
- Naam: ${project.name || websiteContent.title || 'Onbekend'}
- Beschrijving: ${project.description || websiteContent.description || 'Niet beschikbaar'}
- Website content: ${websiteContent.content.slice(0, 2000)}

ANALYSEER AUTOMATISCH:
1. Wat is de niche/branche van dit bedrijf?
2. Wie is de doelgroep (leeftijd, interesses, pijnpunten)?
3. Wat is de ideale brand voice (formeel/informeel, humor, expertise)?
4. Wat zijn logische business doelen voor social media?

Genereer een JSON object met PRECIES deze structuur:
{
  "detected_niche": "De gedetecteerde niche/branche",
  "detected_audience": "Beschrijving van de doelgroep",
  "detected_voice": "Beschrijving van de ideale brand voice",
  "detected_goals": ["Doel 1", "Doel 2", "Doel 3"],
  "content_pillars": [
    {
      "name": "Pillar naam",
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
    { "type": "Storytelling", "percentage": 20, "description": "Persoonlijke verhalen en behind-the-scenes" },
    { "type": "Educatief", "percentage": 30, "description": "Tips, how-to's en waardevolle informatie" },
    { "type": "Engagement", "percentage": 20, "description": "Vragen, polls en interactieve content" },
    { "type": "Promotioneel", "percentage": 15, "description": "Product/dienst highlights" },
    { "type": "Behind the Scenes", "percentage": 15, "description": "Kijkje achter de schermen" }
  ],
  "hashtag_strategy": {
    "branded": ["#merknaam", "#merkslogan"],
    "niche": ["#relevante", "#niche", "#hashtags"],
    "trending": ["#trending", "#actueel"],
    "community": ["#community", "#hashtags"]
  },
  "engagement_tactics": [
    "Specifieke tactiek 1 voor deze niche",
    "Specifieke tactiek 2 voor deze niche",
    "Specifieke tactiek 3 voor deze niche",
    "Specifieke tactiek 4 voor deze niche",
    "Specifieke tactiek 5 voor deze niche"
  ],
  "content_ideas": [
    {
      "title": "Concrete post titel",
      "type": "Post type",
      "pillar": "Content pillar",
      "hook": "Aandachttrekkende opening zin",
      "cta": "Specifieke call to action"
    }
  ]
}

BELANGRIJK:
- Genereer 4 relevante content pillars voor deze specifieke niche
- Hashtags moeten Nederlands en relevant zijn voor de branche
- Genereer minimaal 15 concrete, uitvoerbare content ideas
- Engagement tactics moeten specifiek zijn voor deze doelgroep
- Alles in het Nederlands

Antwoord ALLEEN met het JSON object, geen andere tekst.`;

    const strategyData = await generateJSONCompletion<any>({
      task: 'content',
      systemPrompt: 'Je bent een social media strategie expert. Genereer altijd valid JSON.',
      userPrompt: prompt,
      maxTokens: 4000,
      temperature: 0.7,
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
      niche: strategyData.detected_niche,
      target_audience: strategyData.detected_audience,
      brand_voice: strategyData.detected_voice,
      content_pillars: strategyData.content_pillars,
      weekly_schedule: strategyData.weekly_schedule,
      post_types_mix: strategyData.post_types_mix,
      hashtag_strategy: strategyData.hashtag_strategy,
      engagement_tactics: strategyData.engagement_tactics,
      goals: strategyData.detected_goals || [],
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
        niche: strategyData.detected_niche,
        audience: strategyData.detected_audience,
        voice: strategyData.detected_voice,
        goals: strategyData.detected_goals,
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
