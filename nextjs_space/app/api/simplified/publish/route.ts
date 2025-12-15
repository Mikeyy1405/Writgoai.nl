import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { publishToWordPressEnhanced } from '@/lib/wordpress-publisher-enhanced';
import { createPostEnhanced } from '@/lib/getlate-enhanced';

/**
 * POST /api/simplified/publish
 * Publiceer een artikel naar WordPress en/of social media
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { articleId, publishTo } = body; // publishTo: 'wordpress', 'social', or 'both'

    if (!articleId || !publishTo) {
      return NextResponse.json(
        { error: 'Article ID and publish target required' },
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

    // Haal artikel op
    const article = await prisma.savedContent.findFirst({
      where: {
        id: articleId,
        clientId: client.id,
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const results = {
      wordpress: null as any,
      social: null as any,
    };

    // Publiceer naar WordPress
    if (publishTo === 'wordpress' || publishTo === 'both') {
      try {
        // Haal project op
        if (!article.projectId) {
          throw new Error('No project linked to this article');
        }

        const project = await prisma.project.findUnique({
          where: { id: article.projectId },
        });

        if (!project || !project.wordpressUrl || !project.wordpressUsername || !project.wordpressPassword) {
          throw new Error('WordPress credentials not configured');
        }

        // Publiceer
        const wpResult = await publishToWordPressEnhanced(
          {
            siteUrl: project.wordpressUrl,
            username: project.wordpressUsername,
            applicationPassword: project.wordpressPassword,
          },
          {
            title: article.title,
            content: article.contentHtml || article.content,
            excerpt: article.metaDesc || undefined,
            featuredImageUrl: article.thumbnailUrl || undefined,
            categories: [],
            status: 'publish',
          }
        );

        results.wordpress = wpResult;

        // Update artikel status
        await prisma.savedContent.update({
          where: { id: article.id },
          data: {
            publishedAt: new Date(),
            publishedUrl: wpResult.link || undefined,
          },
        });
      } catch (error: any) {
        console.error('WordPress publish error:', error);
        results.wordpress = {
          success: false,
          error: error.message,
        };
      }
    }

    // Publiceer naar Social Media
    if (publishTo === 'social' || publishTo === 'both') {
      try {
        if (!client.lateDevProfileId) {
          throw new Error('GetLate.dev API key not configured');
        }

        // Maak social media post
        const socialPost = `🚀 Nieuw artikel: ${article.title}\n\n${article.metaDesc}\n\nLees meer: ${results.wordpress?.link || article.publishedUrl || ''}`;

        const socialResult = await createPostEnhanced({
          content: socialPost,
          platforms: ['twitter', 'linkedin'], // Kan uitgebreid worden
        });

        results.social = socialResult;
      } catch (error: any) {
        console.error('Social media publish error:', error);
        results.social = {
          success: false,
          error: error.message,
        };
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error publishing:', error);
    return NextResponse.json(
      { error: 'Failed to publish' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/simplified/publish
 * Haal gepubliceerde artikelen op
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

    // Haal published articles op
    const articles = await prisma.savedContent.findMany({
      where: {
        clientId: client.id,
        publishedAt: { not: null },
      },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        publishedUrl: true,
        publishedAt: true,
        thumbnailUrl: true,
      },
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Error fetching published articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
