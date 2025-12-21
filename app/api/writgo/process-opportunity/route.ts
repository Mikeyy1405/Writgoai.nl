import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import aimlClient from '@/lib/ai-client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { opportunityId } = await request.json();

    if (!opportunityId) {
      return NextResponse.json(
        { error: 'opportunityId is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get opportunity
    const { data: opportunity, error: oppError } = await supabase
      .from('writgo_content_opportunities')
      .select('*, writgo_content_triggers(*)')
      .eq('id', opportunityId)
      .single();

    if (oppError || !opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    // Update status to generating
    await supabase
      .from('writgo_content_opportunities')
      .update({ status: 'generating' })
      .eq('id', opportunityId);

    // Generate content using AI
    
    const prompt = `Je bent een SEO content writer voor WritGo.nl, een platform voor WordPress SEO automatisering.

BRON ARTIKEL:
Titel: ${opportunity.title}
URL: ${opportunity.source_url}
Beschrijving: ${opportunity.metadata?.description || 'Geen beschrijving beschikbaar'}

TAAK:
Schrijf een Nederlands blog artikel over dit onderwerp voor WritGo.nl. Het artikel moet:

1. **Informatief en actueel** zijn - Leg uit wat dit nieuws betekent
2. **Relevant voor WritGo gebruikers** - Koppel het aan WordPress SEO
3. **SEO-geoptimaliseerd** - Gebruik het hoofdkeyword natuurlijk
4. **Actionable** - Geef praktische tips

STRUCTUUR:
- Intro (150 woorden) - Wat is er gebeurd en waarom is het belangrijk?
- 4-6 H2 secties met diepgaande uitleg
- 2-3 H3 subsecties per H2
- Praktische tips en voorbeelden
- CTA sectie met link naar WritGo dashboard

OPMAAK:
- Gebruik HTML tags: <h2>, <h3>, <p>, <strong>, <ul>, <li>
- Voeg 2-3 placeholder images toe: <img src="/api/placeholder/800/400" alt="beschrijving" />
- Voeg interne links toe naar:
  * Homepage: <a href="/">WritGo</a>
  * Dashboard: <a href="/dashboard">WritGo dashboard</a>
  * Blog: <a href="/blog">WritGo blog</a>
- Gebruik <strong> voor belangrijke termen
- Korte paragrafen (max 3-4 zinnen)

LENGTE: 1500+ woorden

Genereer ALLEEN de HTML content (geen markdown code blocks!). Begin direct met de intro paragraaf.`;

    const completion = await aimlClient.chat.completions.create({
      model: 'claude-4-5-sonnet',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    let content = completion.choices[0]?.message?.content || '';
    
    // Clean up markdown code blocks if AI added them
    content = content.replace(/```html\n?/g, '').replace(/```\n?/g, '');
    content = content.trim();

    // Generate title and meta
    const titleMatch = opportunity.title.match(/^(.+?)[\:\-\|]/);
    const cleanTitle = titleMatch ? titleMatch[1].trim() : opportunity.title;
    
    const articleTitle = `${cleanTitle}: Complete Gids voor 2025`;
    const excerpt = opportunity.metadata?.description?.substring(0, 160) || 
                   `Ontdek alles over ${cleanTitle} en hoe dit jouw WordPress SEO beïnvloedt.`;
    
    // Extract focus keyword from title
    const focusKeyword = cleanTitle.split(' ').slice(0, 3).join(' ').toLowerCase();

    // Schedule for tomorrow 10:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    // Insert into content queue
    const { data: queuedArticle, error: queueError } = await supabase
      .from('writgo_content_queue')
      .insert({
        title: articleTitle,
        content: content,
        excerpt: excerpt,
        focus_keyword: focusKeyword,
        meta_title: articleTitle,
        meta_description: excerpt,
        scheduled_for: tomorrow.toISOString(),
        status: 'scheduled',
        priority: opportunity.priority || 5
      })
      .select()
      .single();

    if (queueError) {
      throw new Error(`Failed to queue article: ${queueError.message}`);
    }

    // Update opportunity status
    await supabase
      .from('writgo_content_opportunities')
      .update({
        status: 'queued',
        article_id: queuedArticle.id
      })
      .eq('id', opportunityId);

    // Log activity
    await supabase
      .from('writgo_activity_logs')
      .insert({
        action: 'content_generated',
        details: `Generated article from opportunity: ${opportunity.title}`,
        metadata: {
          opportunity_id: opportunityId,
          article_id: queuedArticle.id,
          title: articleTitle
        }
      });

    return NextResponse.json({
      success: true,
      article: queuedArticle,
      message: `Article "${articleTitle}" generated and scheduled for ${tomorrow.toLocaleDateString()}`
    });

  } catch (error: any) {
    console.error('Process opportunity error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
