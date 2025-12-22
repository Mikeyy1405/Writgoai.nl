import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { generateAICompletion } from '@/lib/ai-client';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    const currentMonth = now.toLocaleDateString('nl-NL', { month: 'long' });

    // Generate content with AI
    const prompt = `Huidige datum: ${now.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}

Schrijf een uitgebreid, SEO-geoptimaliseerd blog artikel over: "${topic}"

${keywords ? `Focus keywords: ${keywords}` : ''}

VEREISTEN:
- Toon: ${tone}
- Lengte: minimaal ${targetWords} woorden
- Taal: Nederlands
- Actualiteit: Focus op ${currentYear}-${nextYear} informatie

STRUCTUUR:
1. Pakkende introductie die de lezer direct aanspreekt
2. Duidelijke H2 en H3 headers voor structuur
3. Praktische tips en actionable advies
4. Voorbeelden en concrete use cases
5. FAQ sectie met 3-5 veelgestelde vragen
6. Sterke conclusie met call-to-action

SEO OPTIMALISATIE:
- Gebruik het focus keyword in de eerste 100 woorden
- Verwerk keywords natuurlijk door de tekst
- Gebruik bullet points en genummerde lijsten
- Voeg interne links toe waar relevant

HTML FORMATTING:
- Gebruik <h2> voor hoofdsecties
- Gebruik <h3> voor subsecties
- Gebruik <p> voor paragrafen
- Gebruik <ul>/<ol> en <li> voor lijsten
- Gebruik <strong> voor belangrijke termen
- Gebruik <blockquote> voor quotes

BELANGRIJK:
- Schrijf originele, waardevolle content
- Vermijd fluff en vage statements
- Geef concrete, bruikbare informatie
- Schrijf voor de Nederlandse markt

Genereer ALLEEN de HTML content, geen markdown code blocks.`;

    const content = await generateAICompletion({
      task: 'content',
      systemPrompt: 'Je bent een expert SEO content writer die engaging, goed gestructureerde blog artikelen schrijft in het Nederlands. Je output is altijd clean HTML zonder markdown formatting.',
      userPrompt: prompt,
      temperature: 0.7,
      maxTokens: 4000,
    });

    // Clean up any markdown formatting
    const cleanContent = content
      .replace(/```html\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    if (!cleanContent || cleanContent.length < 100) {
      throw new Error('AI generated insufficient content');
    }
    
    // Generate title with AI
    let title = topic;
    try {
      const titleResponse = await generateAICompletion({
        task: 'quick',
        systemPrompt: 'Je bent een expert in het schrijven van pakkende, SEO-geoptimaliseerde blog titels in het Nederlands. Geef alleen de titel terug, geen extra tekst.',
        userPrompt: `Maak een pakkende, SEO-geoptimaliseerde titel voor een artikel over: "${topic}"${keywords ? ` (keywords: ${keywords})` : ''}. Maximaal 60 karakters.`,
        temperature: 0.8,
        maxTokens: 100,
      });
      
      title = titleResponse.trim().replace(/^["']|["']$/g, '') || topic;
    } catch (titleError) {
      console.warn('Title generation failed, using topic as title:', titleError);
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Calculate word count
    const wordCount = cleanContent.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length;

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
          excerpt: cleanContent.replace(/<[^>]*>/g, '').substring(0, 160),
          status: 'draft',
          meta_title: title,
          meta_description: cleanContent.replace(/<[^>]*>/g, '').substring(0, 160),
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

    return NextResponse.json({
      success: true,
      article_id: articleId,
      title,
      content: cleanContent,
      word_count: wordCount,
    });
  } catch (error: any) {
    console.error('Error generating article:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate article' },
      { status: 500 }
    );
  }
}
