
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/aiml-api';

/**
 * Find Linkbuilding Opportunities
 * POST /api/client/linkbuilding/find-opportunities
 * 
 * Vindt relevante content van andere gebruikers voor linkbuilding
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        linkbuildingEnabled: true,
        projects: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            websiteUrl: true,
            niche: true,
            keywords: true,
            savedContent: {
              where: {
                publishedUrl: { not: null },
                isArchived: false,
              },
              select: {
                id: true,
                title: true,
                content: true,
                publishedUrl: true,
                keywords: true,
                category: true,
              },
              take: 10,
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    if (!client.linkbuildingEnabled) {
      return NextResponse.json({ 
        error: 'Linkbuilding is niet ingeschakeld voor jouw account' 
      }, { status: 403 });
    }

    const body = await req.json();
    const { sourceArticleId, projectId, topic, keywords } = body;

    // Haal het bron artikel op
    const sourceArticle = await prisma.savedContent.findFirst({
      where: {
        id: sourceArticleId,
        clientId: client.id,
        ...(projectId && { projectId }),
      },
      select: {
        id: true,
        title: true,
        content: true,
        keywords: true,
        category: true,
        publishedUrl: true,
      },
    });

    if (!sourceArticle) {
      return NextResponse.json({ error: 'Artikel niet gevonden' }, { status: 404 });
    }

    // Vind andere clients die linkbuilding enabled hebben
    const potentialTargets = await prisma.client.findMany({
      where: {
        linkbuildingEnabled: true,
        NOT: { id: client.id },
      },
      select: {
        id: true,
        name: true,
        website: true,
        savedContent: {
          where: {
            publishedUrl: { not: null },
            isArchived: false,
          },
          select: {
            id: true,
            title: true,
            content: true,
            publishedUrl: true,
            keywords: true,
            category: true,
            clientId: true,
          },
          take: 50, // Maximaal 50 artikelen per client bekijken
        },
      },
      take: 20, // Maximaal 20 clients bekijken
    });

    // Flatten alle artikelen
    const allTargetArticles = potentialTargets.flatMap(client => 
      client.savedContent.map(article => ({
        ...article,
        clientName: client.name,
        clientWebsite: client.website,
      }))
    );

    if (allTargetArticles.length === 0) {
      return NextResponse.json({
        success: true,
        opportunities: [],
        message: 'Geen potentiële linkbuilding mogelijkheden gevonden',
      });
    }

    // Gebruik AI om relevante artikelen te vinden
    const prompt = `Je bent een SEO linkbuilding expert. Analyseer het volgende bron artikel en vind de meest relevante target artikelen voor linkbuilding.

Bron artikel:
Titel: ${sourceArticle.title}
Keywords: ${sourceArticle.keywords?.join(', ') || 'Geen'}
Categorie: ${sourceArticle.category || 'Algemeen'}
Content (eerste 500 woorden): ${sourceArticle.content?.substring(0, 2000) || ''}

Target artikelen:
${allTargetArticles.slice(0, 30).map((article, idx) => `
${idx + 1}. ${article.title}
   Keywords: ${article.keywords?.join(', ') || 'Geen'}
   URL: ${article.publishedUrl}
`).join('\n')}

Selecteer de TOP 5 meest relevante target artikelen voor linkbuilding op basis van:
1. Topical relevance (hoe gerelateerd zijn de onderwerpen?)
2. Keyword overlap
3. Content context (past de link natuurlijk?)
4. Domain authority potentieel

Geef een JSON array terug met:
[
  {
    "articleIndex": <index van het artikel (1-based)>,
    "relevanceScore": <score 0-100>,
    "reason": "<waarom is dit een goede match?>",
    "suggestedAnchorText": "<natuurlijke anchor text>",
    "suggestedContext": "<waar in het artikel zou de link passen?>"
  }
]

Geef ALLEEN de JSON array terug, geen extra tekst.`;

    const completion = await chatCompletion({
      messages: [
        { role: 'user', content: prompt }
      ],
      model: 'gpt-4o-mini',
      temperature: 0.3,
    });

    const aiResponse = completion.choices[0]?.message?.content || '[]';
    let recommendations: any[] = [];

    try {
      // Clean markdown code blocks
      let cleaned = aiResponse.trim();
      cleaned = cleaned.replace(/^```json\s*/i, '');
      cleaned = cleaned.replace(/^```\s*/, '');
      cleaned = cleaned.replace(/\s*```$/, '');
      recommendations = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse AI recommendations:', parseError);
      recommendations = [];
    }

    // Map recommendations terug naar volledige artikelen
    const opportunities = recommendations
      .filter(rec => rec.articleIndex > 0 && rec.articleIndex <= allTargetArticles.length)
      .map(rec => {
        const article = allTargetArticles[rec.articleIndex - 1];
        return {
          targetArticleId: article.id,
          targetClientId: article.clientId,
          targetTitle: article.title,
          targetUrl: article.publishedUrl,
          targetKeywords: article.keywords,
          targetClientName: article.clientName,
          targetClientWebsite: article.clientWebsite,
          relevanceScore: rec.relevanceScore,
          reason: rec.reason,
          suggestedAnchorText: rec.suggestedAnchorText,
          suggestedContext: rec.suggestedContext,
        };
      })
      .filter(opp => opp.relevanceScore >= 60); // Alleen hoge relevantie

    return NextResponse.json({
      success: true,
      opportunities,
      sourceArticle: {
        id: sourceArticle.id,
        title: sourceArticle.title,
        url: sourceArticle.publishedUrl,
      },
    });

  } catch (error: any) {
    console.error('Find linkbuilding opportunities error:', error);
    return NextResponse.json({
      error: 'Er is een fout opgetreden',
      details: error.message,
    }, { status: 500 });
  }
}
