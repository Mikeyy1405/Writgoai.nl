import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAICompletion } from '@/lib/ai-client';
import { generateFeaturedImage } from '@/lib/aiml-image-generator';
import { saveImageFromUrl } from '@/lib/storage-utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy initialization to prevent build-time errors
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase as any; // Type assertion needed for tables not in generated types
}

const PLATFORM_LIMITS: Record<string, { chars: number; hashtags: number }> = {
  twitter: { chars: 280, hashtags: 2 },
  instagram: { chars: 2200, hashtags: 15 },
  linkedin: { chars: 3000, hashtags: 5 },
  facebook: { chars: 63206, hashtags: 5 },
  tiktok: { chars: 2200, hashtags: 5 },
  threads: { chars: 500, hashtags: 3 },
  bluesky: { chars: 300, hashtags: 2 },
};

const POST_TYPE_INSTRUCTIONS: Record<string, string> = {
  storytelling: `Schrijf een STORYTELLING post:
- Begin met een persoonlijke anekdote of herkenbare situatie
- Neem de lezer mee in een verhaal
- Eindig met een les of inzicht
- Gebruik emotie en beeldspraak
- Wees authentiek en menselijk`,
  educational: `Schrijf een EDUCATIEVE post:
- Deel waardevolle kennis of tips
- Gebruik bullet points of genummerde lijsten
- Maak het praktisch en direct toepasbaar
- Eindig met een call-to-action om te bewaren of delen`,
  promotional: `Schrijf een PROMOTIONELE post:
- Highlight de voordelen, niet de features
- Gebruik social proof of resultaten
- Creëer urgentie of schaarste
- Duidelijke call-to-action`,
  engagement: `Schrijf een ENGAGEMENT post:
- Stel een vraag aan je publiek
- Vraag om meningen of ervaringen
- Maak het makkelijk om te reageren
- Wees nieuwsgierig en open`,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      template_id,
      platforms = ['instagram', 'linkedin'],
      auto_publish = false,
      project_id,
    } = body;

    if (!project_id) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }

    // Get template
    let template;
    if (template_id) {
      const { data: templateData } = await getSupabase()
        .from('writgo_self_promotion_templates')
        .select('*')
        .eq('id', template_id)
        .eq('template_type', 'social')
        .single();
      template = templateData;
    } else {
      // Select random template
      const { data: templates } = await getSupabase()
        .from('writgo_self_promotion_templates')
        .select('*')
        .eq('template_type', 'social')
        .eq('active', true)
        .order('times_used', { ascending: true })
        .limit(5);

      if (!templates || templates.length === 0) {
        throw new Error('No social templates found');
      }

      // Pick random from least used
      template = templates[Math.floor(Math.random() * templates.length)];
    }

    console.log('🎯 Selected template:', template.title_template);

    // Get recent self-promotion posts to avoid repetition
    const { data: recentPosts } = await getSupabase()
      .from('social_posts')
      .select('content')
      .eq('is_self_promotion', true)
      .order('created_at', { ascending: false })
      .limit(5);

    const recentOpenings = recentPosts
      ?.map((p: any) => p.content.split('\n')[0])
      .filter(Boolean) || [];

    // Determine character limit based on platforms
    const minCharLimit = Math.min(
      ...platforms.map((p: string) => PLATFORM_LIMITS[p]?.chars || 2200)
    );

    // Generate post content using AI
    const prompt = `Je bent een expert social media marketeer voor WritGo, een AI-powered content creation platform.

TAAK: Schrijf een sociale media post die WritGo promoot en potentiële klanten aantrekt.

TEMPLATE INFO:
- Template: ${template.title_template}
- Topic: ${template.topic}
- Post type: ${template.post_type}
- Doelgroep: ${template.target_audience}
- Categorie: ${template.category}

${POST_TYPE_INSTRUCTIONS[template.post_type] || ''}

PLATFORMS: ${platforms.join(', ')}
MAX LENGTE: ${minCharLimit} karakters

RECENT GEBRUIKTE OPENINGSZINNEN (VERMIJD DEZE):
${recentOpenings.map((o: any, i: number) => `${i + 1}. ${o}`).join('\n')}

SCHRIJF EEN POST MET:
1. Een pakkende opening (verschillend van recente posts)
2. Waardevolle content voor de doelgroep
3. Subtiele promotie van WritGo
4. Een duidelijke call-to-action
5. 3-5 relevante hashtags voor content creators/marketing

TONE OF VOICE:
- Enthousiast maar niet overdreven
- Professioneel maar toegankelijk
- Focus op de waarde voor de lezer
- Authentiek en herkenbaar

BELANGRIJK:
- Wees subtiel in de promotie
- Focus op het oplossen van problemen
- Gebruik sociale bewijskracht waar mogelijk
- Maak het actionable
- Nederlandse taal

Geef je antwoord in dit EXACTE format (geen extra tekst):
{
  "content": "De volledige social media post tekst",
  "image_prompt": "Een kort, visueel prompt voor een afbeelding (Engels, max 100 karakters)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`;

    console.log('🤖 Generating AI content...');
    const aiResponse = await generateAICompletion({
      systemPrompt: 'Je bent een expert social media marketeer voor WritGo.',
      userPrompt: prompt,
      model: 'gpt-4o',
      temperature: 0.9,
    });

    // Parse AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }
    const postData = JSON.parse(jsonMatch[0]);

    console.log('✅ Generated post content');

    // Add hashtags to content
    let finalContent = postData.content;
    if (postData.hashtags && postData.hashtags.length > 0) {
      const hashtags = postData.hashtags.map((h: string) =>
        h.startsWith('#') ? h : `#${h}`
      ).join(' ');
      finalContent += `\n\n${hashtags}`;
    }

    // Generate image
    console.log('🎨 Generating social media image...');
    const imagePrompt = postData.image_prompt ||
      `Modern, professional social media image for WritGo AI content platform.
      Clean design, tech theme, inspiring. Colors: blue, purple, white.`;

    const imageUrl = await generateFeaturedImage(imagePrompt);
    console.log('✅ Generated image:', imageUrl);

    // Check if image generation succeeded
    if (!imageUrl) {
      throw new Error('Failed to generate social media image');
    }

    // Save image
    const savedImageUrl = await saveImageFromUrl(
      imageUrl,
      `self-promo-social-${Date.now()}.png`
    );
    console.log('✅ Saved image:', savedImageUrl);

    // Create social post
    const postPayload = {
      project_id: project_id,
      content: finalContent,
      image_url: savedImageUrl,
      post_type: template.post_type,
      platforms: platforms,
      status: auto_publish ? 'published' : 'draft',
      is_self_promotion: true,
      promotion_template_id: template.id,
      auto_generated: true,
      variation_seed: `self-promo-${Date.now()}`,
    };

    const { data: post, error: postError } = await getSupabase()
      .from('social_posts')
      .insert(postPayload)
      .select()
      .single();

    if (postError) {
      throw new Error(`Failed to save post: ${postError.message}`);
    }

    console.log('✅ Saved social post:', post.id);

    // Update template usage
    await getSupabase()
      .from('writgo_self_promotion_templates')
      .update({
        times_used: (template.times_used || 0) + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', template.id);

    // Update config stats
    await getSupabase().rpc('increment_self_promo_social_count');

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        content: post.content,
        image_url: post.image_url,
        platforms: post.platforms,
        status: post.status,
        template_used: template.title_template,
      },
    });
  } catch (error: any) {
    console.error('❌ Generate self-promotion social error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate social post'
      },
      { status: 500 }
    );
  }
}
