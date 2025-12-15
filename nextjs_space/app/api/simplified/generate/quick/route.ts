import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// ✅ ONLY SUPABASE - NO PRISMA
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * POST /api/simplified/generate/quick
 * Quick Generate - Genereer een volledig artikel zonder content plan
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword, projectId, tone = 'professional', length = 'medium' } = body;

    if (!keyword?.trim()) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    console.log(`[Quick Generate] Starting for keyword: ${keyword}`);

    // ✅ Haal client op via SUPABASE
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (clientError || !client) {
      console.error('[Quick Generate] Client not found:', clientError);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // ✅ Optioneel: Haal project op via SUPABASE
    let project = null;
    if (projectId) {
      const { data: projectData, error: projectError } = await supabase
        .from('Project')
        .select('*')
        .eq('id', projectId)
        .eq('clientId', client.id)
        .single();
      
      if (projectData && !projectError) {
        project = projectData;
      }
    }

    // Bepaal word count op basis van length
    let targetWords = 1000;
    switch (length) {
      case 'short':
        targetWords = 500;
        break;
      case 'medium':
        targetWords = 1000;
        break;
      case 'long':
        targetWords = 1500;
        break;
    }

    // Stap 1: Keyword Research & Outline
    console.log('[Quick Generate] Step 1: Keyword research & outline');
    const outlinePrompt = `Je bent een SEO expert en content writer.

TAAK: Creëer een SEO-geoptimaliseerde outline voor een artikel over "${keyword}"

TOON VAN HET ARTIKEL: ${tone}
LENGTE: ${length} (~${targetWords} woorden)

Genereer:
1. Een pakkende, SEO-vriendelijke titel
2. Een meta description (150-160 karakters)
3. 5-7 gerelateerde keywords
4. Een gedetailleerde outline met H2 en H3 headings
5. Featured image prompt voor AI image generator

Format je antwoord als JSON:
{
  "title": "...",
  "metaDescription": "...",
  "keywords": ["..."],
  "outline": [
    { "type": "h2", "text": "...", "subsections": ["h3 text 1", "h3 text 2"] }
  ],
  "featuredImagePrompt": "..."
}

BELANGRIJK:
- Titel moet pakkend en SEO-vriendelijk zijn
- Outline moet logisch en compleet zijn
- Keywords moeten relevant zijn
- Image prompt moet beschrijvend zijn voor een AI image generator`;

    const outlineResponse = await chatCompletion({
      model: TEXT_MODELS.GPT5_CHAT,
      messages: [{ role: 'user', content: outlinePrompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    let outline;
    try {
      // ✅ FIX: Extract content from correct response structure
      // AIML API returns: { choices: [{ message: { content: "..." } }] }
      const content = outlineResponse.choices?.[0]?.message?.content || '';
      
      console.log('[Quick Generate] Outline response length:', content.length);
      console.log('[Quick Generate] Outline preview:', content.substring(0, 200));
      
      if (!content) {
        console.error('[Quick Generate] ❌ EMPTY CONTENT! Response structure:', {
          hasChoices: !!outlineResponse.choices,
          choicesLength: outlineResponse.choices?.length || 0,
          responseKeys: Object.keys(outlineResponse)
        });
        throw new Error('Empty AI response');
      }
      
      // Extract JSON from response
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const cleanedContent = codeBlockMatch ? codeBlockMatch[1] : content;
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        outline = JSON.parse(jsonMatch[0]);
      } else {
        outline = JSON.parse(cleanedContent.trim());
      }
      
      console.log('[Quick Generate] ✅ Outline parsed successfully');
      console.log('[Quick Generate] Title:', outline.title);
      
    } catch (error) {
      console.error('[Quick Generate] Error parsing outline:', error);
      console.error('[Quick Generate] Response content preview:', outlineResponse.choices?.[0]?.message?.content?.substring(0, 500));
      return NextResponse.json(
        { 
          error: 'Kon outline niet verwerken',
          details: error instanceof Error ? error.message : 'Unknown parsing error'
        },
        { status: 500 }
      );
    }

    console.log('[Quick Generate] Step 2: Generating article content');
    
    // Stap 2: Genereer het volledige artikel
    const articlePrompt = `Je bent een expert content writer.

TAAK: Schrijf een volledig, SEO-geoptimaliseerd artikel gebaseerd op deze outline.

TITEL: ${outline.title}
TOON: ${tone}
LENGTE: ~${targetWords} woorden
KEYWORDS: ${outline.keywords.join(', ')}

OUTLINE:
${outline.outline.map((section: any) => `
${section.text}
${section.subsections ? section.subsections.map((sub: string) => `  - ${sub}`).join('\n') : ''}
`).join('\n')}

INSTRUCTIES:
- Schrijf in een ${tone} toon
- Gebruik de keywords natuurlijk door het artikel heen
- Maak het boeiend en informatief
- Gebruik korte paragrafen (2-3 zinnen)
- Voeg bullet points toe waar relevant
- Schrijf ongeveer ${targetWords} woorden
- Begin NIET met een inleiding zoals "In dit artikel...", maar duik direct in het onderwerp
- Eindig met een sterke conclusie

FORMAT:
Gebruik HTML formatting:
- <h2> voor hoofdsecties
- <h3> voor subsecties
- <p> voor paragrafen
- <ul><li> voor bullet points
- <strong> voor belangrijke punten

Geef ALLEEN de HTML content terug, geen extra tekst.`;

    const articleResponse = await chatCompletion({
      model: TEXT_MODELS.GPT5_CHAT,
      messages: [{ role: 'user', content: articlePrompt }],
      temperature: 0.7,
      max_tokens: 4000,
    });

    // ✅ FIX: Extract content from correct response structure
    const articleContent = articleResponse.choices?.[0]?.message?.content || '';
    
    if (!articleContent) {
      console.error('[Quick Generate] ❌ Empty article content!');
      return NextResponse.json(
        { error: 'Failed to generate article content' },
        { status: 500 }
      );
    }

    console.log('[Quick Generate] Article generated, length:', articleContent.length);

    // Stap 3: Sla artikel op in database via SUPABASE
    console.log('[Quick Generate] Step 3: Saving article');
    
    const { data: blogPost, error: blogPostError } = await supabase
      .from('BlogPost')
      .insert({
        title: outline.title,
        content: articleContent,
        excerpt: outline.metaDescription,
        seoKeywords: outline.keywords.join(', '),
        status: 'draft',
        clientId: client.id,
        projectId: project?.id || null,
        metadata: {
          generatedBy: 'quick-generate',
          keyword,
          tone,
          length,
          wordCount: articleContent.split(/\s+/).length,
          outline: outline.outline,
          featuredImagePrompt: outline.featuredImagePrompt,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (blogPostError || !blogPost) {
      console.error('[Quick Generate] Failed to save blog post:', blogPostError);
      return NextResponse.json(
        { 
          error: 'Failed to save article',
          details: blogPostError?.message || 'Unknown error'
        },
        { status: 500 }
      );
    }

    console.log(`[Quick Generate] Blog post created: ${blogPost.id}`);

    // Optioneel: Genereer featured image (asynchroon)
    // TODO: Implement image generation with DALL-E or similar

    return NextResponse.json({
      success: true,
      article: {
        id: blogPost.id,
        title: blogPost.title,
        content: blogPost.content,
        excerpt: blogPost.excerpt,
        keywords: outline.keywords,
        wordCount: articleContent.split(/\s+/).length,
        featuredImagePrompt: outline.featuredImagePrompt,
      },
    });
  } catch (error) {
    console.error('[Quick Generate] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate article',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
