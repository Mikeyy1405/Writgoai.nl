import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin as any;
}

let openaiClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.AIML_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('Missing AI API key. Please set AIML_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY');
    }

    openaiClient = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.aimlapi.com/v1',
    });
  }
  return openaiClient;
}

// Cron job to automatically generate new content ideas every week
// Runs every Monday at 8:00 AM
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Generate Ideas Cron] Starting weekly idea generation...');

    // Get all projects with social strategies
    const { data: strategies, error: fetchError } = await getSupabaseAdmin()
      .from('social_strategies')
      .select(`
        *,
        projects (
          id,
          name,
          website_url,
          niche,
          language,
          user_id
        )
      `)
      .not('projects', 'is', null);

    if (fetchError) {
      console.error('[Generate Ideas Cron] Error fetching strategies:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!strategies || strategies.length === 0) {
      console.log('[Generate Ideas Cron] No strategies found');
      return NextResponse.json({ success: true, message: 'No strategies', processed: 0 });
    }

    console.log(`[Generate Ideas Cron] Found ${strategies.length} strategies to process`);

    const results = [];

    for (const strategy of strategies) {
      try {
        const project = strategy.projects;
        if (!project) continue;

        console.log(`[Generate Ideas Cron] Generating ideas for: ${project.name}`);

        // Generate 7 new content ideas (one for each day)
        const ideas = await generateContentIdeas(project, strategy);

        if (!ideas || ideas.length === 0) {
          console.log(`[Generate Ideas Cron] No ideas generated for ${project.name}`);
          continue;
        }

        // Schedule the ideas for the coming week
        const scheduledItems = await scheduleIdeas(project.id, ideas);

        results.push({
          project_id: project.id,
          project_name: project.name,
          ideas_generated: ideas.length,
          ideas_scheduled: scheduledItems.length,
        });

        console.log(`[Generate Ideas Cron] Scheduled ${scheduledItems.length} ideas for ${project.name}`);
      } catch (error: any) {
        console.error(`[Generate Ideas Cron] Error processing ${strategy.project_id}:`, error);
        results.push({
          project_id: strategy.project_id,
          error: error.message,
        });
      }
    }

    console.log(`[Generate Ideas Cron] Completed. Processed ${results.length} projects.`);

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error('[Generate Ideas Cron] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

interface ContentIdea {
  title: string;
  type: string;
  pillar: string;
  hook: string;
  cta: string;
}

async function generateContentIdeas(
  project: any,
  strategy: any
): Promise<ContentIdea[]> {
  try {
    const pillars = strategy.content_pillars || [];
    const pillarNames = pillars.map((p: any) => p.name).join(', ');

    const prompt = `Je bent een social media strateeg. Genereer 7 unieke content ideeën voor de komende week.

Bedrijf: ${project.name}
Website: ${project.website_url || 'Niet beschikbaar'}
Niche: ${project.niche || strategy.niche || 'algemeen'}
Doelgroep: ${strategy.target_audience || 'algemeen publiek'}
Brand voice: ${strategy.brand_voice || 'professioneel en vriendelijk'}
Content pillars: ${pillarNames || 'geen specifieke pillars'}

Genereer 7 ideeën met een goede mix van:
- Storytelling (persoonlijke verhalen)
- Educational (tips en kennis)
- Engagement (vragen en polls)
- Behind the scenes
- Promotional (subtiel)

Geef voor elk idee:
1. title: Een pakkende titel/onderwerp
2. type: Het type post (storytelling, educational, promotional, engagement, behind_the_scenes)
3. pillar: De content pillar waar het bij hoort
4. hook: Een sterke openingszin
5. cta: Een call-to-action

Antwoord ALLEEN met een JSON array, geen extra tekst:
[
  {
    "title": "...",
    "type": "...",
    "pillar": "...",
    "hook": "...",
    "cta": "..."
  }
]`;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'anthropic/claude-sonnet-4.5',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return [];
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('[generateContentIdeas] Could not parse JSON from response');
      return [];
    }

    const ideas: ContentIdea[] = JSON.parse(jsonMatch[0]);
    return ideas;
  } catch (error) {
    console.error('[generateContentIdeas] Error:', error);
    return [];
  }
}

async function scheduleIdeas(projectId: string, ideas: ContentIdea[]): Promise<any[]> {
  const scheduledItems = [];

  // Start from tomorrow
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);
  startDate.setHours(9, 0, 0, 0); // 9:00 AM

  for (let i = 0; i < ideas.length; i++) {
    const idea = ideas[i];
    const scheduledFor = new Date(startDate);
    scheduledFor.setDate(scheduledFor.getDate() + i);

    try {
      const { data, error } = await getSupabaseAdmin()
        .from('scheduled_content')
        .insert({
          project_id: projectId,
          title: idea.title,
          type: idea.type.toLowerCase().replace(/\s+/g, '_'),
          pillar: idea.pillar,
          hook: idea.hook,
          cta: idea.cta,
          scheduled_for: scheduledFor.toISOString(),
          platforms: ['instagram'],
          auto_generate: true,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) {
        console.error(`[scheduleIdeas] Error scheduling idea: ${error.message}`);
      } else {
        scheduledItems.push(data);
      }
    } catch (error) {
      console.error('[scheduleIdeas] Error:', error);
    }
  }

  return scheduledItems;
}
