import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { generateAICompletion } from '@/lib/ai-client';
import { requireCredits, deductCreditsAfterAction } from '@/lib/credit-middleware';
import type { CreditAction } from '@/lib/credit-costs';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper function to clean HTML content from AI response
function cleanHTMLContent(content: string): string {
  let cleaned = content;
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/```html\s*/gi, '');
  cleaned = cleaned.replace(/```\s*/g, '');
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // If content starts with a newline after removing code blocks, trim it
  cleaned = cleaned.replace(/^\n+/, '');
  
  // Remove any "Here is" or similar AI preambles
  cleaned = cleaned.replace(/^(Here is|Here's|Below is|The following)[^<]*</i, '<');
  
  return cleaned;
}

// Helper function to generate slug from keyword
function generateSlug(keyword: string): string {
  return keyword
    .toLowerCase()
    .trim()
    // Replace Dutch characters
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    // Replace spaces and special chars with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length
    .substring(0, 60);
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id, topic, keywords, tone = 'professional', length = 'medium' } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Determine credit cost based on article length
    const creditActions: Record<string, CreditAction> = {
      short: 'article_short',
      medium: 'article_medium',
      long: 'article_long',
    };
    const creditAction = creditActions[length] || 'article_medium';

    // Check if user has enough credits BEFORE generating
    const creditCheck = await requireCredits(user.id, creditAction);
    if (creditCheck) {
      return creditCheck; // Return error response
    }

    // If project_id is provided, verify it belongs to user
    if (project_id) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', project_id)
        .eq('user_id', user.id)
        .single();

      if (projectError || !project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
    }

    // Determine word count based on length
    const wordCounts: Record<string, number> = {
      short: 500,
      medium: 1000,
      long: 2000,
    };
    const targetWords = wordCounts[length] || 1000;

    // Get current date dynamically
    const now = new Date();
    const currentYear = now.getFullYear();
    const nextYear = currentYear + 1;

    // Generate content with AI
    const prompt = `Huidige datum: ${now.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}

Schrijf een uitgebreid, SEO-geoptimaliseerd blog artikel over: "${topic}"

${keywords ? `Focus keyword: ${keywords}` : ''}

VEREISTEN:
- Toon: ${tone}
- Lengte: minimaal ${targetWords} woorden
- Taal: Nederlands
- Actualiteit: Focus op ${currentYear}-${nextYear} informatie

STRUCTUUR:
1. Pakkende introductie die de lezer direct aanspreekt (GEEN 'Inleiding:' heading - begin direct met de tekst)
2. Duidelijke H2 en H3 headers voor hoofdsecties
3. Praktische tips en actionable advies
4. Voorbeelden en concrete use cases
5. FAQ sectie met 3-5 veelgestelde vragen
6. Sterke conclusie met call-to-action

SEO OPTIMALISATIE:
- Gebruik het focus keyword in de eerste 100 woorden
- Verwerk keywords natuurlijk door de tekst
- Gebruik bullet points en genummerde lijsten

HTML FORMATTING - GEBRUIK ALLEEN DEZE TAGS:
- <h2> voor hoofdsecties
- <h3> voor subsecties
- <p> voor paragrafen
- <ul> en <li> voor bullet lists
- <ol> en <li> voor genummerde lijsten
- <strong> voor belangrijke termen
- <em> voor nadruk
- <blockquote> voor quotes

BELANGRIJK:
- Geef ALLEEN de HTML content terug
- GEEN markdown code blocks (\`\`\`html of \`\`\`)
- GEEN uitleg of inleiding
- Begin direct met de introductie tekst in <p> tags (GEEN 'Inleiding:' of 'Introductie:' heading)
- De eerste H2 heading moet over het eerste inhoudelijke onderwerp gaan
- Schrijf originele, waardevolle content in het Nederlands`;

    const content = await generateAICompletion({
      task: 'content',
      systemPrompt: 'Je bent een expert SEO content writer. Je schrijft alleen clean HTML content zonder markdown formatting, code blocks, of uitleg. BELANGRIJK: Begin NOOIT met een "Inleiding:" of "Introductie:" heading. Start direct met de introductie tekst in <p> tags.',
      userPrompt: prompt,
      temperature: 0.7,
      maxTokens: 4000,
    });

    // Clean up any markdown formatting
    const cleanContent = cleanHTMLContent(content);

    if (!cleanContent || cleanContent.length < 100) {
      throw new Error('AI generated insufficient content');
    }
    
    // Generate title with AI
    let title = topic;
    try {
      const titleResponse = await generateAICompletion({
        task: 'quick',
        systemPrompt: 'Je bent een expert in het schrijven van pakkende, SEO-geoptimaliseerde blog titels in het Nederlands. Geef alleen de titel terug, geen extra tekst of aanhalingstekens.',
        userPrompt: `Maak een pakkende, SEO-geoptimaliseerde titel voor een artikel over: "${topic}"${keywords ? ` (focus keyword: ${keywords})` : ''}. Maximaal 60 karakters. Geef alleen de titel.`,
        temperature: 0.8,
        maxTokens: 100,
      });
      
      title = titleResponse.trim().replace(/^["']|["']$/g, '') || topic;
    } catch (titleError) {
      console.warn('Title generation failed, using topic as title:', titleError);
    }

    // Generate slug from keyword (not title!)
    const focusKeyword = keywords || topic;
    const slug = generateSlug(focusKeyword);

    // Calculate word count
    const wordCount = cleanContent.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length;

    // Generate excerpt (plain text, no HTML)
    const excerpt = cleanContent
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 160);

    // Save to database if project_id is provided
    let articleId = null;
    if (project_id) {
      const { data: article, error: dbError } = await supabase
        .from('articles')
        .insert({
          project_id,
          title,
          slug,
          content: cleanContent,
          excerpt,
          status: 'draft',
          meta_title: title,
          meta_description: excerpt,
          focus_keyword: focusKeyword,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        // Don't fail the request, just log the error
      } else {
        articleId = article?.id;
      }
    }

    // Deduct credits AFTER successful generation
    const creditResult = await deductCreditsAfterAction(user.id, creditAction);

    return NextResponse.json({
      success: true,
      article_id: articleId,
      title,
      slug,
      content: cleanContent,
      excerpt,
      focus_keyword: focusKeyword,
      word_count: wordCount,
      credits_used: creditResult.success ? 
        (creditAction === 'article_short' ? 1 : creditAction === 'article_medium' ? 2 : 3) : 0,
      credits_remaining: creditResult.remaining,
    });
  } catch (error: any) {
    console.error('Error generating article:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate article' },
      { status: 500 }
    );
  }
}
