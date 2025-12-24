import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { generateAICompletion } from '@/lib/ai-client';
import { requireCredits, deductCreditsAfterAction } from '@/lib/credit-middleware';
import type { CreditAction } from '@/lib/credit-costs';
import { getProjectContext, buildContextPrompt } from '@/lib/project-context';
import { BolClient, createBolClientFromConfig } from '@/lib/bol-client';

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

    // Get project context for backlinks and affiliate links
    let contextPrompt = '';
    let bolAffiliateInstructions = '';

    if (project_id) {
      try {
        const context = await getProjectContext(project_id);
        contextPrompt = buildContextPrompt(context);

        // Add Bol.com product CTA box instructions if affiliate is configured
        if (context.affiliateConfig?.isActive && context.affiliateConfig.siteCode) {
          bolAffiliateInstructions = `

BOL.COM AFFILIATE LINKS (VERPLICHT indien relevant!):
Als je producten noemt, voeg dan een mooie CTA box toe:

<div class="bol-product-cta" style="border: 2px solid #0000a4; border-radius: 12px; padding: 20px; margin: 30px 0; background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);">
  <h4 style="color: #0000a4; margin-top: 0;">📦 [Product Naam]</h4>
  <p><strong>Omschrijving:</strong> [Korte omschrijving]</p>
  <div style="margin: 15px 0;">
    <p><strong>✅ Voordelen:</strong></p>
    <ul><li>[Voordeel 1]</li><li>[Voordeel 2]</li><li>[Voordeel 3]</li></ul>
  </div>
  <div style="margin: 15px 0;">
    <p><strong>❌ Nadelen:</strong></p>
    <ul><li>[Nadeel 1]</li><li>[Nadeel 2]</li></ul>
  </div>
  <a href="https://partner.bol.com/click/click?p=2&t=url&s=${context.affiliateConfig.siteCode}&f=TXL&url=[ENCODED_BOL_URL]&name=[PRODUCT]" target="_blank" rel="noopener sponsored" style="display: inline-block; background: #0000a4; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px;">
    Bekijk meer en bestel →
  </a>
</div>`;
        }
      } catch (error) {
        console.error('Error fetching project context:', error);
      }
    }

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
6. Sterke afsluiting met inhoudelijke heading (NIET "Conclusie", "Tot slot", "Ten slotte" - gebruik een inhoudelijke heading zoals "Aan de slag" of "Jouw volgende stappen")

SEO OPTIMALISATIE & CONTENT VARIATIE (VERPLICHT!):
- Gebruik het focus keyword in de eerste 100 woorden
- Verwerk keywords natuurlijk door de tekst
- ⚠️ VERPLICHT: Gebruik MINIMAAL 4 <ul> of <ol> lijsten
- ⚠️ VERPLICHT: Voeg MINIMAAL 2 tabellen toe met <table> (vergelijkingen, statistieken)
- ⚠️ VERPLICHT: Gebruik MINIMAAL 3 <blockquote> voor belangrijke punten
- Wissel af: paragraaf → lijst → tabel → blockquote (NOOIT meer dan 3 paragrafen achter elkaar!)

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
- Schrijf originele, waardevolle content in het Nederlands

${contextPrompt}
${bolAffiliateInstructions}`;

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
