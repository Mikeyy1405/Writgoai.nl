
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { publishArticleToWordPress } from '@/lib/wordpress-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for image generation

/**
 * Publish article to WordPress with images and categories
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { articleId, categories, generateImages } = await request.json();

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID required' },
        { status: 400 }
      );
    }

    // Get article with WordPress config
    const article = await prisma.publishedArticle.findUnique({
      where: { id: articleId },
      include: {
        Client: {
          include: {
            WordPressConfig: true,
          },
        },
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    if (article.clientId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!article.Client.WordPressConfig) {
      return NextResponse.json(
        { error: 'WordPress not configured. Please add your WordPress credentials in settings.' },
        { status: 400 }
      );
    }

    if (!article.Client.WordPressConfig.verified) {
      return NextResponse.json(
        { error: 'WordPress credentials not verified. Please verify your connection first.' },
        { status: 400 }
      );
    }

    // Publish to WordPress
    const result = await publishArticleToWordPress(
      article,
      article.Client.WordPressConfig,
      {
        generateFeaturedImage: generateImages !== false,
        generateContentImages: generateImages !== false,
        categoryNames: categories || [],
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Artikel succesvol gepubliceerd op WordPress!',
      wordpressUrl: result.wordpressUrl,
      wordpressId: result.wordpressId,
    });
  } catch (error) {
    console.error('WordPress publishing error:', error);
    return NextResponse.json(
      {
        error: 'Failed to publish to WordPress',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

