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

// Cron job endpoint to process scheduled content
// Should be called every 15 minutes by Vercel Cron or similar service
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    console.log(`[Content Calendar Cron] Running at ${now.toISOString()}`);

    // Find scheduled content that needs to be processed
    // Get items where scheduled_for is in the past and status is 'scheduled'
    const { data: pendingItems, error: fetchError } = await getSupabaseAdmin()
      .from('scheduled_content')
      .select(`
        *,
        projects (
          id,
          name,
          website_url,
          niche,
          language
        )
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(5); // Process max 5 items per run

    if (fetchError) {
      console.error('[Content Calendar Cron] Error fetching items:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!pendingItems || pendingItems.length === 0) {
      console.log('[Content Calendar Cron] No pending items to process');
      return NextResponse.json({
        success: true,
        message: 'No pending items',
        processed: 0,
      });
    }

    console.log(`[Content Calendar Cron] Found ${pendingItems.length} items to process`);

    const results = [];

    for (const item of pendingItems) {
      try {
        console.log(`[Content Calendar Cron] Processing item: ${item.id} - ${item.title}`);

        // Mark as generating
        await getSupabaseAdmin()
          .from('scheduled_content')
          .update({ status: 'generating' })
          .eq('id', item.id);

        // Get strategy for better content generation
        const { data: strategy } = await getSupabaseAdmin()
          .from('social_strategies')
          .select('*')
          .eq('project_id', item.project_id)
          .single();

        // Generate the post content using Claude
        const postContent = await generatePostContent(item, item.projects, strategy);

        if (!postContent) {
          throw new Error('Failed to generate content');
        }

        // Generate image if needed
        let imageUrl = null;
        if (item.platforms?.includes('instagram') || item.platforms?.includes('facebook')) {
          imageUrl = await generateImage(item.title, item.projects?.niche);
        }

        // Create the social post
        const { data: newPost, error: postError } = await getSupabaseAdmin()
          .from('social_posts')
          .insert({
            project_id: item.project_id,
            content: postContent,
            image_url: imageUrl,
            post_type: item.type,
            platforms: item.platforms?.map((p: string) => ({ platform: p })) || [],
            status: 'ready',
            auto_generated: true,
          })
          .select()
          .single();

        if (postError) {
          throw postError;
        }

        // Update the scheduled content item
        await getSupabaseAdmin()
          .from('scheduled_content')
          .update({
            status: 'generated',
            generated_content: postContent,
            generated_image_url: imageUrl,
            generated_post_id: newPost?.id,
            generated_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        results.push({
          id: item.id,
          title: item.title,
          status: 'success',
          post_id: newPost?.id,
        });

        console.log(`[Content Calendar Cron] Successfully processed: ${item.id}`);
      } catch (error: any) {
        console.error(`[Content Calendar Cron] Error processing ${item.id}:`, error);

        // Mark as failed
        await getSupabaseAdmin()
          .from('scheduled_content')
          .update({
            status: 'failed',
            error_message: error.message || 'Unknown error',
          })
          .eq('id', item.id);

        results.push({
          id: item.id,
          title: item.title,
          status: 'failed',
          error: error.message,
        });
      }
    }

    console.log(`[Content Calendar Cron] Completed. Processed ${results.length} items.`);

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error('[Content Calendar Cron] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generatePostContent(
  item: any,
  project: any,
  strategy: any
): Promise<string | null> {
  try {
    const postTypeDescriptions: Record<string, string> = {
      storytelling: 'een persoonlijk verhaal met een les of inzicht',
      educational: 'educatieve content met tips en waardevolle informatie',
      promotional: 'promotionele content die een product of dienst promoot',
      engagement: 'een vraag of stelling die engagement stimuleert',
      behind_the_scenes: 'een kijkje achter de schermen',
    };

    const prompt = `Je bent een social media expert. Schrijf een social media post in het Nederlands voor ${project?.name || 'een bedrijf'}.

Onderwerp: ${item.title}
Post type: ${postTypeDescriptions[item.type] || item.type}
${item.hook ? `Gebruik deze hook: ${item.hook}` : ''}
${item.cta ? `Sluit af met deze CTA: ${item.cta}` : ''}
${item.pillar ? `Content pillar: ${item.pillar}` : ''}

Context:
- Niche: ${project?.niche || strategy?.niche || 'algemeen'}
- Website: ${project?.website_url || ''}
${strategy?.brand_voice ? `- Brand voice: ${strategy.brand_voice}` : ''}
${strategy?.target_audience ? `- Doelgroep: ${strategy.target_audience}` : ''}

Instructies:
1. Schrijf een engaging post die past bij het post type
2. Gebruik emoji's strategisch
3. Houd de post tussen 100-300 woorden
4. Voeg relevante hashtags toe aan het einde (5-10 hashtags)
5. Maak de eerste zin pakkend om de aandacht te trekken
6. Schrijf in een natuurlijke, authentieke stijl

Schrijf alleen de post tekst, geen extra uitleg.`;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'anthropic/claude-sonnet-4.5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      return content.trim();
    }

    return null;
  } catch (error) {
    console.error('[generatePostContent] Error:', error);
    return null;
  }
}

async function generateImage(title: string, niche?: string): Promise<string | null> {
  try {
    // Use existing image generation endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/social/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Professional social media image for: ${title}. Style: modern, clean, ${niche || 'business'} themed.`,
      }),
    });

    if (!response.ok) {
      console.log('[generateImage] Image generation failed, skipping');
      return null;
    }

    const data = await response.json();
    return data.image_url || null;
  } catch (error) {
    console.error('[generateImage] Error:', error);
    return null;
  }
}
