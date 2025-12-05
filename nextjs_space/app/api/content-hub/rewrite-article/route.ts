import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { sendChatCompletion } from '@/lib/aiml-chat-client';

/**
 * POST /api/content-hub/rewrite-article
 * Rewrite an existing article with fresh, improved content using Claude 4.5 Sonnet
 */
export async function POST(req: NextRequest) {
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
    const { articleId, maintainUrl = true, previewOnly = false } = body;

    if (!articleId) {
      return NextResponse.json(
        { error: 'Artikel ID is verplicht' },
        { status: 400 }
      );
    }

    // Get article with site info
    const article = await prisma.contentHubArticle.findUnique({
      where: { id: articleId },
      include: {
        site: {
          select: {
            id: true,
            clientId: true,
            wordpressUrl: true,
          },
        },
      },
    });

    if (!article || article.site.clientId !== client.id) {
      return NextResponse.json(
        { error: 'Artikel niet gevonden' },
        { status: 404 }
      );
    }

    // If article doesn't have content yet, just reset it to pending
    if (!article.content) {
      await prisma.contentHubArticle.update({
        where: { id: articleId },
        data: { status: 'pending' },
      });

      return NextResponse.json({
        success: true,
        message: 'Artikel staat klaar om geschreven te worden',
        article: {
          id: article.id,
          title: article.title,
          status: 'pending',
        },
      });
    }

    console.log(`[Content Hub] Rewriting article with Claude 4.5 Sonnet: ${article.title}`);

    // Create rewrite prompt
    const rewritePrompt = `Je bent een expert SEO copywriter. Herschrijf het volgende artikel om het te verbeteren:

ORIGINEEL ARTIKEL:
Titel: ${article.title}
Content: ${article.content}

INSTRUCTIES:
- Behoud de kernboodschap en informatie
- Verbeter de leesbaarheid en structuur
- Optimaliseer voor SEO met betere koppen (H2, H3)
- Maak de tekst engaging en waardevol
- Voeg waar nodig bullet points en lijsten toe
- Zorg voor een sterke introductie en conclusie
- Schrijf in het Nederlands
- Behoud de oorspronkelijke lengte (±10%)

Geef het herschreven artikel terug in JSON formaat:
{
  "content": "Herschreven artikel in HTML formaat",
  "metaTitle": "Verbeterde SEO meta title (max 60 karakters)",
  "metaDescription": "Verbeterde SEO meta description (max 160 karakters)",
  "improvements": "Korte samenvatting van de belangrijkste verbeteringen"
}`;

    // Call Claude 4.5 Sonnet
    const response = await sendChatCompletion({
      model: 'claude-sonnet-4-5-20250514', // Claude 4.5 Sonnet
      messages: [
        {
          role: 'system',
          content: 'Je bent een expert SEO copywriter die artikelen verbetert met focus op leesbaarheid, SEO en gebruikerswaarde.',
        },
        {
          role: 'user',
          content: rewritePrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 8000, // Use snake_case as per API client
    });

    // Parse JSON response with robust error handling
    let rewrittenData;
    try {
      const chatResponse = response as { choices?: Array<{ message?: { content?: string } }> };
      const content = chatResponse.choices?.[0]?.message?.content || '';
      
      if (!content) {
        throw new Error('Geen content ontvangen van AI model');
      }
      
      // Try to extract JSON from markdown code blocks first
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      let jsonText = jsonMatch ? jsonMatch[1] : content;
      
      // Clean up common issues in JSON
      jsonText = jsonText.trim();
      
      // Try parsing
      try {
        rewrittenData = JSON.parse(jsonText);
      } catch (firstParseError) {
        // If parsing fails, try to find JSON object in the text
        const objectMatch = jsonText.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          rewrittenData = JSON.parse(objectMatch[0]);
        } else {
          throw firstParseError;
        }
      }
      
      // Validate required fields
      if (!rewrittenData.content || !rewrittenData.metaTitle || !rewrittenData.metaDescription) {
        throw new Error('Onvolledige response van AI: ontbrekende velden');
      }
    } catch (parseError: any) {
      console.error('[Content Hub] Failed to parse rewrite response:', parseError);
      const chatResponse = response as { choices?: Array<{ message?: { content?: string } }> };
      console.error('[Content Hub] Raw response:', chatResponse.choices?.[0]?.message?.content || response);
      return NextResponse.json(
        { 
          error: 'Kon herschreven content niet verwerken',
          details: parseError.message 
        },
        { status: 500 }
      );
    }

    // If preview only, return the rewritten content without saving
    if (previewOnly) {
      return NextResponse.json({
        success: true,
        preview: true,
        rewrittenArticle: {
          content: rewrittenData.content,
          metaTitle: rewrittenData.metaTitle,
          metaDescription: rewrittenData.metaDescription,
          improvements: rewrittenData.improvements,
          originalContent: article.content,
          originalMetaTitle: article.metaTitle,
          originalMetaDescription: article.metaDescription,
        },
      });
    }

    // Store the old WordPress URL if we need to maintain it
    const oldWordpressUrl = article.wordpressUrl;

    // Update article with rewritten content
    const updatedArticle = await prisma.contentHubArticle.update({
      where: { id: articleId },
      data: {
        content: rewrittenData.content,
        metaTitle: rewrittenData.metaTitle,
        metaDescription: rewrittenData.metaDescription,
        status: 'published',
        // Maintain WordPress URL if requested so it can be updated in place
        wordpressUrl: maintainUrl ? oldWordpressUrl : null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Artikel succesvol herschreven',
      article: {
        id: updatedArticle.id,
        title: updatedArticle.title,
        content: updatedArticle.content,
        metaTitle: updatedArticle.metaTitle,
        metaDescription: updatedArticle.metaDescription,
        status: updatedArticle.status,
        improvements: rewrittenData.improvements,
        wordpressUrl: updatedArticle.wordpressUrl,
      },
    });
  } catch (error: any) {
    console.error('[Content Hub] Rewrite article error:', error);
    return NextResponse.json(
      { error: error.message || 'Kon artikel niet herschrijven' },
      { status: 500 }
    );
  }
}
