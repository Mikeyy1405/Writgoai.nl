import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-utils';

/**
 * POST /api/client/news-articles/generate
 * Generate news article based on topic and sources
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const { topic, sources, projectId, language = 'nl', tone = 'professional' } = await req.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'Onderwerp is verplicht' },
        { status: 400 }
      );
    }

    // Verify project if provided
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          client_id: session.user.id,
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: 'Project niet gevonden' },
          { status: 404 }
        );
      }
    }

    // Generate news article
    const sourcesText = sources && sources.length > 0 
      ? `\n\nBronnen:\n${sources.map((s: any) => `- ${s.title}: ${s.url}`).join('\n')}`
      : '';

    const prompt = `Schrijf een professioneel nieuwsartikel over het volgende onderwerp:

Onderwerp: ${topic}
Taal: ${language === 'nl' ? 'Nederlands' : 'Engels'}
Toon: ${tone}${sourcesText}

Schrijf een compleet nieuwsartikel met:
1. Een pakkende titel
2. Een sterke inleiding (eerste alinea)
3. Gestructureerde hoofdtekst met meerdere paragrafen
4. Relevante quotes (indien van toepassing)
5. Een sterke afsluiting

Format als JSON:
{
  "title": "titel van het artikel",
  "excerpt": "korte samenvatting (max 200 karakters)",
  "content": "volledige artikel tekst in HTML format",
  "keywords": ["keyword1", "keyword2", ...],
  "category": "nieuws categorie"
}`;

    const aiResponse = await chatCompletion([
      {
        role: 'user',
        content: prompt,
      },
    ], {
      model: 'claude-sonnet-4',
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    let article;
    try {
      article = JSON.parse(aiResponse);
    } catch (e) {
      console.error('Failed to parse article response:', e);
      return NextResponse.json(
        { error: 'Fout bij verwerken van artikel' },
        { status: 500 }
      );
    }

    // Save to database if project specified
    let savedArticle = null;
    if (projectId) {
      savedArticle = await prisma.blogPost.create({
        data: {
          client_id: session.user.id,
          project_id: projectId,
          title: article.title,
          content: article.content,
          excerpt: article.excerpt,
          status: 'draft',
          seo_keywords: article.keywords,
          category: article.category || 'Nieuws',
          metadata: {
            type: 'news',
            sources: sources || [],
            generatedAt: new Date().toISOString(),
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      article: savedArticle || article,
      message: 'Nieuwsartikel succesvol gegenereerd',
    });
  } catch (error) {
    console.error('[API] Error generating news article:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het genereren van het nieuwsartikel' },
      { status: 500 }
    );
  }
}
