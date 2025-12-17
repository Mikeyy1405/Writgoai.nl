/**
 * POST /api/client/topical-authority/generate-article
 * 
 * Generate an article from the topical authority map
 * Uses the existing content generation system but with topical context
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { validateClient } from '@/lib/services/content-plan-service';
import { TopicalAuthorityService } from '@/lib/services/topical-authority-service';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await validateClient(session);
    const body = await request.json();
    
    const { articleId } = body;

    if (!articleId) {
      return NextResponse.json(
        { error: 'Missing articleId' },
        { status: 400 }
      );
    }

    // Get article with all related data
    const article = await prisma.plannedArticle.findUnique({
      where: { id: articleId },
      include: {
        subtopic: {
          include: {
            pillarTopic: true,
          },
        },
        pillarTopic: true, // Direct pillar reference
        topicalAuthorityMap: true, // Include the map
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Verify map exists and ownership
    if (!article.topicalAuthorityMap) {
      console.error(`[Generate Article] No topical authority map found for article ${articleId}`);
      return NextResponse.json(
        { error: 'Topical authority map not found for this article' },
        { status: 404 }
      );
    }

    if (article.topicalAuthorityMap.clientId !== client.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update article status to generating
    await TopicalAuthorityService.updateArticleStatus(articleId, 'generating');

    // Return article data for frontend to generate
    // The actual generation will be handled by the existing content generation API
    return NextResponse.json({
      success: true,
      message: 'Article ready for generation',
      data: {
        articleId: article.id,
        title: article.title,
        description: article.description,
        keywords: article.keywords,
        focusKeyword: article.focusKeyword,
        contentType: article.contentType,
        articleType: article.articleType,
        wordCountTarget: article.wordCountTarget,
        searchIntent: article.searchIntent,
        pillarTitle: article.pillarTopic?.title || '',
        subtopicTitle: article.subtopic?.title || '',
        niche: article.topicalAuthorityMap.niche,
        internalLinks: article.internalLinks,
        dataForSEO: article.dataForSEO,
      },
    });

  } catch (error: any) {
    console.error('[Topical Authority API] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to prepare article for generation',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
