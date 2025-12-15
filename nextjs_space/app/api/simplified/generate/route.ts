import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion, TEXT_MODELS, generateImage } from '@/lib/aiml-api';

/**
 * POST /api/simplified/generate
 * Genereer een volledig artikel op basis van een topic
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { topic, projectId } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Genereer artikel content
    const articlePrompt = `Je bent een professionele content writer. Schrijf een uitgebreid, SEO-geoptimaliseerd artikel over het volgende onderwerp:

**Titel:** ${topic.title || topic}
**Beschrijving:** ${topic.description || 'Geen beschrijving beschikbaar'}
**Keywords:** ${topic.keywords?.join(', ') || 'Geen keywords'}

Het artikel moet:
- 1500-2500 woorden lang zijn
- Beginnen met een pakkende introductie
- Duidelijke H2 en H3 headers hebben
- Praktische tips en voorbeelden bevatten
- Eindigen met een conclusie
- Natuurlijk leesbaar zijn, niet gekunsteld
- Geschreven zijn in het Nederlands

Format je artikel in HTML met alleen deze tags: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>

Geef ALLEEN de HTML content terug, geen extra tekst of markdown.`;

    const articleResponse = await chatCompletion({
      model: TEXT_MODELS.GPT5_CHAT,
      messages: [
        { role: 'user', content: articlePrompt },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    });

    const articleContent = articleResponse.content || '';
    const title = topic.title || topic;

    // Genereer meta description
    const metaPrompt = `Schrijf een pakkende meta description (max 155 karakters) voor dit artikel:

Titel: ${title}

Geef ALLEEN de meta description terug, geen extra tekst.`;

    const metaResponse = await chatCompletion({
      model: TEXT_MODELS.FAST,
      messages: [
        { role: 'user', content: metaPrompt },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const metaDescription = (metaResponse.content || '').substring(0, 155);

    // Genereer featured image
    let featuredImage = '';
    try {
      const imagePrompt = `A professional, high-quality featured image for a blog article about: ${title}. Modern, clean, and visually appealing.`;
      
      const imageResult = await generateImage({
        model: 'FLUX_PRO',
        prompt: imagePrompt,
        width: 1200,
        height: 630,
      });

      if (imageResult.success && imageResult.images && imageResult.images.length > 0) {
        featuredImage = imageResult.images[0];
      }
    } catch (error) {
      console.error('Error generating image:', error);
      // Niet fataal, ga door zonder afbeelding
    }

    // Bereken word count
    const wordCount = articleContent.split(/\s+/).length;

    // Sla artikel op in database
    const savedContent = await prisma.savedContent.create({
      data: {
        clientId: client.id,
        projectId: projectId || null,
        type: 'blog-article',
        title,
        content: articleContent,
        contentHtml: articleContent,
        metaDesc: metaDescription,
        keywords: topic.keywords || [],
        thumbnailUrl: featuredImage,
        wordCount,
        generatorType: 'simplified-app',
      },
    });

    return NextResponse.json({
      success: true,
      article: {
        id: savedContent.id,
        title,
        content: articleContent,
        metaDescription,
        featuredImage,
        wordCount,
      },
    });
  } catch (error) {
    console.error('Error generating article:', error);
    return NextResponse.json(
      { error: 'Failed to generate article' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/simplified/generate
 * Haal gegenereerde artikelen op die nog niet gepubliceerd zijn
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Haal unpublished articles op
    const articles = await prisma.savedContent.findMany({
      where: {
        clientId: client.id,
        publishedAt: null,
        type: 'blog-article',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        metaDesc: true,
        thumbnailUrl: true,
        wordCount: true,
        createdAt: true,
        projectId: true,
      },
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
