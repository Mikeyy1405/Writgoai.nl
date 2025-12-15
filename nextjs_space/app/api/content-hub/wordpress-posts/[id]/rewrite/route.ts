import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { sendChatCompletion } from '@/lib/aiml-chat-client';
import { countWords, sanitizeHtml } from '@/lib/wordpress-helpers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/content-hub/wordpress-posts/[id]/rewrite
 * Rewrite a WordPress post using Claude 4.5 Sonnet with specific options
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { 
      siteId, 
      rewriteOption, 
      previewOnly = false,
      customInstructions = ''
    } = body;

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is verplicht' },
        { status: 400 }
      );
    }

    // Get site
    const site = await prisma.contentHubSite.findUnique({
      where: { id: siteId },
    });

    if (!site || site.clientId !== client.id) {
      return NextResponse.json(
        { error: 'Site niet gevonden' },
        { status: 404 }
      );
    }

    if (!site.isConnected || !site.wordpressUsername || !site.wordpressAppPassword) {
      return NextResponse.json(
        { error: 'WordPress niet verbonden' },
        { status: 400 }
      );
    }

    // Fetch the post from WordPress
    const auth = Buffer.from(`${site.wordpressUsername}:${site.wordpressAppPassword}`).toString('base64');
    const wpUrl = site.wordpressUrl.replace(/\/$/, '');
    
    let post: any;
    try {
      const endpoint = `${wpUrl}/wp-json/wp/v2/posts/${params.id}?_embed=1`;
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
        signal: AbortSignal.timeout(15000),
      });

      if (response.status === 404) {
        // Try alternative format
        const altEndpoint = `${wpUrl}/?rest_route=/wp/v2/posts/${params.id}&_embed=1`;
        const altResponse = await fetch(altEndpoint, {
          headers: {
            'Authorization': `Basic ${auth}`,
          },
          signal: AbortSignal.timeout(15000),
        });
        
        if (!altResponse.ok) {
          throw new Error('WordPress post niet gevonden');
        }
        
        post = await altResponse.json();
      } else if (!response.ok) {
        throw new Error(`WordPress API fout: ${response.status}`);
      } else {
        post = await response.json();
      }
    } catch (error: any) {
      console.error('[WordPress Rewrite] Fetch error:', error);
      return NextResponse.json(
        { error: error.message || 'Kon WordPress post niet ophalen' },
        { status: 503 }
      );
    }

    // Build rewrite instructions based on option
    const rewriteInstructions = getRewriteInstructions(rewriteOption, customInstructions);

    console.log(`[WordPress Rewrite] Rewriting post with Claude 4.5 Sonnet: ${post.title.rendered}`);

    // Create rewrite prompt
    const rewritePrompt = `Je bent een expert SEO copywriter. Herschrijf het volgende WordPress artikel:

ORIGINEEL ARTIKEL:
Titel: ${post.title.rendered.replace(/<[^>]*>/g, '')}
Content: ${post.content.rendered}

HERSCHRIJF OPTIE: ${rewriteOption}
${rewriteInstructions}

${customInstructions ? `EXTRA INSTRUCTIES:\n${customInstructions}\n` : ''}

ALGEMENE REGELS:
- Schrijf in het Nederlands
- Behoud de kernboodschap en belangrijke informatie
- Gebruik HTML formatting (h2, h3, p, ul, li, strong, em)
- Maak de tekst engaging en waardevol voor de lezer
- Zorg voor een sterke introductie en conclusie
- Voeg waar nodig bullet points en genummerde lijsten toe

Geef het herschreven artikel terug in JSON formaat:
{
  "content": "Herschreven artikel in HTML formaat",
  "title": "Verbeterde titel (optioneel anders, behoud origineel)",
  "metaDescription": "Verbeterde SEO meta description (max 160 karakters)",
  "improvements": "Korte samenvatting van de belangrijkste verbeteringen die zijn aangebracht"
}`;

    // Call Claude 4.5 Sonnet with task-based routing
    let response;
    try {
      response = await sendChatCompletion({
        model: 'anthropic/claude-sonnet-4.5', // Claude 4.5 Sonnet (correct model ID)
        taskType: 'content_rewrite', // Use intelligent routing with fallback
        messages: [
          {
            role: 'system',
            content: 'Je bent een expert SEO copywriter die WordPress artikelen verbetert met focus op leesbaarheid, SEO en gebruikerswaarde. Je schrijft uitsluitend in het Nederlands.',
          },
          {
            role: 'user',
            content: rewritePrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 12000,
      });
    } catch (error: any) {
      console.error('[WordPress Rewrite] AI error:', error);
      return NextResponse.json(
        { error: 'AI service tijdelijk niet beschikbaar' },
        { status: 503 }
      );
    }

    // Parse JSON response
    let rewrittenData;
    try {
      const chatResponse = response as { choices?: Array<{ message?: { content?: string } }> };
      const content = chatResponse.choices?.[0]?.message?.content || '';
      
      if (!content) {
        throw new Error('Geen content ontvangen van AI model');
      }
      
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      let jsonText = jsonMatch ? jsonMatch[1] : content;
      
      jsonText = jsonText.trim();
      
      try {
        rewrittenData = JSON.parse(jsonText);
      } catch (firstParseError) {
        const objectMatch = jsonText.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          rewrittenData = JSON.parse(objectMatch[0]);
        } else {
          throw firstParseError;
        }
      }
      
      // Validate required fields
      if (!rewrittenData.content || !rewrittenData.metaDescription) {
        throw new Error('Onvolledige response van AI: ontbrekende velden');
      }
    } catch (parseError: any) {
      console.error('[WordPress Rewrite] Parse error:', parseError);
      return NextResponse.json(
        { 
          error: 'Kon herschreven content niet verwerken',
          details: parseError.message 
        },
        { status: 500 }
      );
    }

    // Count words
    const wordCount = countWords(rewrittenData.content);
    const originalWordCount = countWords(post.content.rendered);

    // If preview only, return without saving
    if (previewOnly) {
      return NextResponse.json({
        success: true,
        preview: true,
        rewrittenPost: {
          title: rewrittenData.title || sanitizeHtml(post.title.rendered),
          content: rewrittenData.content,
          metaDescription: rewrittenData.metaDescription,
          improvements: rewrittenData.improvements,
          wordCount,
          originalTitle: sanitizeHtml(post.title.rendered),
          originalContent: post.content.rendered,
          originalWordCount,
        },
      });
    }

    // Update post in WordPress
    try {
      const updateData: any = {
        content: rewrittenData.content,
      };
      
      // Only update title if it changed
      if (rewrittenData.title && rewrittenData.title !== sanitizeHtml(post.title.rendered)) {
        updateData.title = rewrittenData.title;
      }

      const endpoint = `${wpUrl}/wp-json/wp/v2/posts/${params.id}`;
      const updateResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
        signal: AbortSignal.timeout(30000),
      });

      if (updateResponse.status === 404) {
        // Try alternative format
        const altEndpoint = `${wpUrl}/?rest_route=/wp/v2/posts/${params.id}`;
        const altResponse = await fetch(altEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
          signal: AbortSignal.timeout(30000),
        });
        
        if (!altResponse.ok) {
          const errorText = await altResponse.text();
          throw new Error(`WordPress update mislukt: ${errorText}`);
        }
      } else if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`WordPress update mislukt: ${errorText}`);
      }

      return NextResponse.json({
        success: true,
        message: 'Post succesvol herschreven en gepubliceerd naar WordPress',
        rewrittenPost: {
          id: params.id,
          title: rewrittenData.title || sanitizeHtml(post.title.rendered),
          content: rewrittenData.content,
          metaDescription: rewrittenData.metaDescription,
          improvements: rewrittenData.improvements,
          wordCount,
          link: post.link,
        },
      });
    } catch (error: any) {
      console.error('[WordPress Rewrite] Update error:', error);
      return NextResponse.json(
        { error: error.message || 'Kon herschreven post niet publiceren naar WordPress' },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error('[WordPress Rewrite] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}

// Helper function to get rewrite instructions based on option
function getRewriteInstructions(option: string, customInstructions: string): string {
  const instructions: Record<string, string> = {
    'seo-optimize': `
FOCUS: SEO Optimalisatie
- Optimaliseer voor zoekwoorden zonder keyword stuffing
- Verbeter de structuur met duidelijke H2 en H3 koppen
- Voeg semantisch gerelateerde termen toe
- Zorg voor betere internal linking mogelijkheden
- Verbeter meta description voor hogere CTR
- Maak de introductie en conclusie sterker voor betere engagement`,

    'readability': `
FOCUS: Leesbaarheid Verbeteren
- Gebruik kortere, duidelijkere zinnen
- Vervang moeilijke woorden door eenvoudigere alternatieven
- Voeg meer witruimte toe met alinea's en bullet points
- Gebruik actieve zinnen in plaats van passieve constructies
- Maak complexe concepten begrijpelijker met voorbeelden
- Zorg voor een logische flow tussen alinea's`,

    'expand': `
FOCUS: Content Uitbreiden
- Voeg meer diepgang en details toe aan bestaande punten
- Integreer praktische voorbeelden en use cases
- Voeg extra secties toe waar relevant (FAQ, tips, best practices)
- Verrijk met aanvullende context en achtergrondinformatie
- Voeg meer visuele aanwijzingen toe (tabellen, lijsten)
- Streef naar 150-200% van de originele lengte`,

    'shorten': `
FOCUS: Content Inkorten
- Verwijder overbodige informatie en herhalingen
- Maak zinnen compacter zonder betekenis te verliezen
- Focus op de kernboodschap en belangrijkste punten
- Combineer gerelateerde secties
- Gebruik bondiger taalgebruik
- Streef naar 60-70% van de originele lengte`,

    'tone-professional': `
FOCUS: Professionele Toon
- Gebruik formele, zakelijke taal
- Vermijd informele uitdrukkingen en jargon
- Schrijf objectief en feitelijk
- Gebruik correcte grammatica en interpunctie
- Voeg waar mogelijk data en bronnen toe
- Houd een neutrale, gezaghebbende toon aan`,

    'tone-casual': `
FOCUS: Casual/Toegankelijke Toon
- Gebruik een vriendelijke, conversationele stijl
- Spreek de lezer direct aan met "je/jij"
- Voeg persoonlijke voorbeelden en anekdotes toe
- Gebruik eenvoudig, begrijpelijk Nederlands
- Maak de tekst engaging en menselijk
- Voeg waar passend humor of emotie toe`,
  };

  return instructions[option] || customInstructions || `
FOCUS: Algemene Verbetering
- Verbeter de algehele kwaliteit en structuur
- Optimaliseer voor zowel SEO als leesbaarheid
- Maak de content waardevoller voor de lezer
- Behoud de originele lengte (±10%)`;
}
