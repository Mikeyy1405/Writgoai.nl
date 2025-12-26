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

// Helper function to generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { template_id, auto_publish = false } = body;

    // Get template
    let template;
    if (template_id) {
      const { data: templateData } = await getSupabase()
        .from('writgo_self_promotion_templates')
        .select('*')
        .eq('id', template_id)
        .eq('template_type', 'blog')
        .single();
      template = templateData;
    } else {
      // Select random template
      const { data: templates } = await getSupabase()
        .from('writgo_self_promotion_templates')
        .select('*')
        .eq('template_type', 'blog')
        .eq('active', true)
        .order('times_used', { ascending: true })
        .limit(5);

      if (!templates || templates.length === 0) {
        throw new Error('No blog templates found');
      }

      // Pick random from least used
      template = templates[Math.floor(Math.random() * templates.length)];
    }

    console.log('🎯 Selected template:', template.title_template);

    // Generate blog content using AI
    const prompt = `Je bent een expert content writer voor WritGo, een AI-powered content creation platform.

TAAK: Schrijf een uitgebreide, SEO-geoptimaliseerde blog post die WritGo promoot en klanten aantrekt.

TEMPLATE INFO:
- Titel template: ${template.title_template}
- Topic: ${template.topic}
- Beschrijving: ${template.description}
- Focus keywords: ${template.keywords?.join(', ')}
- Doelgroep: ${template.target_audience}
- Categorie: ${template.category}

SCHRIJF EEN BLOG POST MET:
1. Een pakkende titel (gebruik het template als inspiratie, maar maak het natuurlijk)
2. Een boeiende inleiding die het probleem beschrijft (150-200 woorden)
3. 5-7 hoofdsecties met praktische waarde
4. Concrete voorbeelden en use cases van WritGo
5. Data en cijfers waar mogelijk (bijv. "10x sneller", "90% tijdsbesparing")
6. Een conclusie met duidelijke call-to-action
7. Gebruik de focus keywords natuurlijk door de tekst
8. Minimaal 2000 woorden

TONE OF VOICE:
- Professioneel maar toegankelijk
- Behulpzaam en educatief
- Enthousiast over de mogelijkheden
- Focus op voordelen voor de lezer

BELANGRIJK:
- Wees subtiel in de promotie - eerst waarde bieden, dan WritGo noemen
- Gebruik praktische voorbeelden uit de content creation wereld
- Maak het actionable - lezers moeten er iets aan hebben
- SEO-vriendelijk maar niet keyword-stuffing
- Nederlandse taal (professioneel Nederlands)

Geef je antwoord in JSON format:
{
  "title": "De uiteindelijke titel",
  "content": "De volledige blog content in markdown format",
  "excerpt": "Een pakkende samenvatting van 150-200 karakters",
  "meta_title": "SEO-geoptimaliseerde meta title (max 60 karakters)",
  "meta_description": "SEO meta description (max 160 karakters)",
  "focus_keyword": "Het primaire focus keyword"
}`;

    console.log('🤖 Generating AI content...');
    const aiResponse = await generateAICompletion({
      systemPrompt: 'Je bent een expert content writer voor WritGo.',
      userPrompt: prompt,
      model: 'anthropic/claude-sonnet-4.5',
      temperature: 0.8,
    });

    // Parse AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }
    const articleData = JSON.parse(jsonMatch[0]);

    console.log('✅ Generated article:', articleData.title);

    // Generate featured image
    console.log('🎨 Generating featured image...');
    const imagePrompt = `Professional blog header image for: "${articleData.title}".
    Modern, clean design. Tech/AI theme. High quality, professional.
    Color palette: blue, purple, white. No text in image.`;

    const imageUrl = await generateFeaturedImage(imagePrompt);
    console.log('✅ Generated image:', imageUrl);

    // Check if image generation succeeded
    if (!imageUrl) {
      throw new Error('Failed to generate featured image');
    }

    // Save image to storage
    const savedImageUrl = await saveImageFromUrl(
      imageUrl,
      `self-promo-blog-${Date.now()}.png`
    );
    console.log('✅ Saved image:', savedImageUrl);

    // Create article slug
    const slug = generateSlug(articleData.title);

    // Prepare article data
    const articlePayload = {
      title: articleData.title,
      content: articleData.content,
      excerpt: articleData.excerpt,
      slug: slug,
      focus_keyword: articleData.focus_keyword,
      meta_title: articleData.meta_title,
      meta_description: articleData.meta_description,
      featured_image: savedImageUrl,
      status: auto_publish ? 'published' : 'draft',
      is_self_promotion: true,
      promotion_template_id: template.id,
      published_at: auto_publish ? new Date().toISOString() : null,
    };

    // Insert article
    const { data: article, error: articleError } = await getSupabase()
      .from('articles')
      .insert(articlePayload)
      .select()
      .single();

    if (articleError) {
      throw new Error(`Failed to save article: ${articleError.message}`);
    }

    console.log('✅ Saved article:', article.id);

    // Update template usage
    await getSupabase()
      .from('writgo_self_promotion_templates')
      .update({
        times_used: (template.times_used || 0) + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', template.id);

    // Update config stats
    await getSupabase().rpc('increment_self_promo_blog_count');

    return NextResponse.json({
      success: true,
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        status: article.status,
        excerpt: article.excerpt,
        featured_image: article.featured_image,
        template_used: template.title_template,
      },
    });
  } catch (error: any) {
    console.error('❌ Generate self-promotion blog error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate blog'
      },
      { status: 500 }
    );
  }
}
