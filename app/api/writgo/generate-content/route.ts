import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { generateAICompletion, BEST_MODELS } from '@/lib/ai-client';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    let { keyword, title, outline, topic, keywords } = body;

    // Support both formats: {keyword, title} or {topic, keywords}
    if (topic && keywords && keywords.length > 0) {
      keyword = keywords[0];
      // Auto-generate title from topic
      title = `${topic}: Complete Gids voor ${new Date().getFullYear()}`;
    }

    if (!keyword || !title) {
      return NextResponse.json(
        { error: 'Keyword and title are required (or topic and keywords)' },
        { status: 400 }
      );
    }

    // Generate article content using AI
    const prompt = `Je bent een professionele SEO content writer voor WritGo.nl, een platform voor WordPress SEO automatisering.

Schrijf een uitgebreid, SEO-geoptimaliseerd artikel in het Nederlands over het volgende onderwerp:

**Titel:** ${title}
**Focus Keyword:** ${keyword}

${outline ? `**Outline:**\n${JSON.stringify(outline, null, 2)}` : ''}

**KRITIEKE VEREISTEN:**

1. **HTML Formatting (GEEN MARKDOWN!):**
   - Output PURE HTML, GEEN markdown code blocks
   - NIET: \`\`\`html ... \`\`\`
   - WEL: Direct beginnen met <h2>...
   - Gebruik <h2> voor hoofdsecties
   - Gebruik <h3> voor subsecties
   - Gebruik <p> voor paragrafen
   - Gebruik <ul> en <li> voor lijsten
   - Gebruik <strong> voor belangrijke termen
   - Gebruik <em> voor nadruk

2. **Interne Links (VERPLICHT!):**
   - Link "WritGo" naar <a href="/">WritGo</a>
   - Link "dashboard" naar <a href="/dashboard">dashboard</a>
   - Link "AI content" naar <a href="/blog">AI content</a>
   - Voeg 5-7 interne links toe door het artikel
   - Gebruik descriptieve anchor tekst

3. **Afbeeldingen:**
   - Voeg 2-3 placeholder images toe:
   - <img src="/api/placeholder/800/400" alt="Beschrijvende alt text" class="w-full rounded-lg my-6" />
   - Plaats images na belangrijke secties

4. **Content Structuur:**
   - Intro (150 woorden)
   - 4-6 hoofdsecties met H2
   - Elk met 2-3 subsecties (H3)
   - Minimaal 1500 woorden totaal
   - Korte paragrafen (3-4 zinnen max)
   - Bullet points waar relevant

5. **SEO:**
   - Focus keyword in eerste paragraaf
   - Focus keyword in 2-3 H2 headings
   - Keyword density 2-3%
   - LSI keywords gebruiken

6. **Call-to-Action:**
   - Eindig met CTA sectie
   - Link naar <a href="/dashboard">WritGo proberen</a>

**BELANGRIJK:** Output ALLEEN de HTML content, GEEN markdown code blocks, GEEN extra tekst!

Schrijf nu het volledige artikel:`;

    const content = await generateAICompletion({
      systemPrompt: 'Je bent een professionele SEO content writer voor WritGo.nl.',
      userPrompt: prompt,
      model: BEST_MODELS.CONTENT,
      maxTokens: 8000,
    });

    if (!content) {
      throw new Error('Failed to generate content');
    }

    // Clean up content: remove markdown code blocks if AI added them anyway
    let cleanedContent = content.trim();
    
    // Remove ```html and ``` markers
    if (cleanedContent.startsWith('```html')) {
      cleanedContent = cleanedContent.replace(/^```html\n?/, '').replace(/\n?```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    
    cleanedContent = cleanedContent.trim();

    // Generate excerpt (first 160 characters of plain text)
    const plainText = cleanedContent.replace(/<[^>]*>/g, '');
    const excerpt = plainText.substring(0, 160) + '...';

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Add to content queue with scheduled date (tomorrow at 10:00)
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + 1);
    scheduledFor.setHours(10, 0, 0, 0);

    const { data: article, error: insertError } = await supabase
      .from('writgo_content_queue')
      .insert({
        title,
        content: cleanedContent,
        excerpt,
        focus_keyword: keyword,
        meta_title: title,
        meta_description: excerpt,
        status: 'scheduled',
        scheduled_for: scheduledFor.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Log activity
    await supabase.from('writgo_activity_logs').insert({
      action_type: 'content_generated',
      description: `Artikel gegenereerd en gepland: "${title}"`,
      status: 'success',
      metadata: { 
        article_id: article.id, 
        keyword, 
        scheduled_for: scheduledFor.toISOString(),
        model: 'gemini-2.0-flash-exp' 
      },
    });

    return NextResponse.json({
      success: true,
      article,
    });
  } catch (error: any) {
    console.error('Error generating content:', error);
    
    // Log error
    try {
      const supabase = createClient();
      await supabase.from('writgo_activity_logs').insert({
        action_type: 'content_generation_failed',
        description: `Fout bij content generatie: ${error.message}`,
        status: 'error',
        metadata: { error: error.message },
      });
    } catch (logError) {
      console.error('Error logging activity:', logError);
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}
