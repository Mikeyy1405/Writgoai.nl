import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { generateAICompletion, BEST_MODELS } from '@/lib/ai-client';

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
    const { keyword, title, outline } = body;

    if (!keyword || !title) {
      return NextResponse.json(
        { error: 'Keyword and title are required' },
        { status: 400 }
      );
    }

    // Generate article content using AI
    const prompt = `Je bent een professionele SEO content writer voor WritGo.nl, een platform voor WordPress SEO automatisering.

Schrijf een uitgebreid, SEO-geoptimaliseerd artikel in het Nederlands over het volgende onderwerp:

**Titel:** ${title}
**Focus Keyword:** ${keyword}

${outline ? `**Outline:**\n${JSON.stringify(outline, null, 2)}` : ''}

**Vereisten:**
- Schrijf in professionele, toegankelijke Nederlandse taal
- Gebruik de focus keyword natuurlijk door de tekst (2-3% keyword density)
- Maak gebruik van H2 en H3 headers voor structuur
- Voeg praktische tips en voorbeelden toe
- Schrijf minimaal 1500 woorden
- Gebruik korte paragrafen (max 3-4 zinnen)
- Voeg relevante interne links toe naar /blog, /dashboard, etc.
- Eindig met een call-to-action om WritGo te proberen
- Format de output als HTML (gebruik <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags)
- Voeg geen <html>, <head> of <body> tags toe, alleen de content zelf

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

    // Generate excerpt (first 160 characters of plain text)
    const plainText = content.replace(/<[^>]*>/g, '');
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
        content,
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
