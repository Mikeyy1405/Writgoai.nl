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

    // Get article first
    const article = await prisma.plannedArticle.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      console.error(`[Generate Article] Article not found: ${articleId}`);
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    console.log(`[Generate Article] Found article: ${article.id}`);
    console.log(`[Generate Article] Article mapId: ${article.mapId}`);
    console.log(`[Generate Article] Article subtopicId: ${article.subtopicId}`);
    console.log(`[Generate Article] Article pillarId: ${article.pillarId}`);

    // Get map separately using mapId
    if (!article.mapId) {
      console.error(`[Generate Article] Article has no mapId`);
      return NextResponse.json(
        { error: 'Article is not associated with a topical authority map. Please regenerate the map.' },
        { status: 500 }
      );
    }

    const map = await prisma.topicalAuthorityMap.findUnique({
      where: { id: article.mapId },
    });

    if (!map) {
      console.error(`[Generate Article] Map not found: ${article.mapId}`);
      return NextResponse.json(
        { error: 'Topical authority map not found. Please regenerate the map.' },
        { status: 404 }
      );
    }

    console.log(`[Generate Article] Found map: ${map.id}`);
    console.log(`[Generate Article] Map clientId: ${map.clientId}`);

    // Verify ownership
    if (map.clientId !== client.id) {
      console.error(`[Generate Article] Unauthorized: client ${client.id} trying to access map ${map.id} owned by ${map.clientId}`);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get subtopic and pillar separately
    let subtopic = null;
    let pillar = null;

    if (article.subtopicId) {
      subtopic = await prisma.subtopic.findUnique({
        where: { id: article.subtopicId },
      });
      console.log(`[Generate Article] Found subtopic: ${subtopic?.title || 'none'}`);
    }

    if (article.pillarId) {
      pillar = await prisma.pillarTopic.findUnique({
        where: { id: article.pillarId },
      });
      console.log(`[Generate Article] Found pillar: ${pillar?.title || 'none'}`);
    } else if (subtopic?.pillarId) {
      pillar = await prisma.pillarTopic.findUnique({
        where: { id: subtopic.pillarId },
      });
      console.log(`[Generate Article] Found pillar via subtopic: ${pillar?.title || 'none'}`);
    }

    // Update article status to generating
    await TopicalAuthorityService.updateArticleStatus(articleId, 'generating');

    console.log(`[Generate Article] ✅ All data validated successfully`);

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
        pillarTitle: pillar?.title || '',
        subtopicTitle: subtopic?.title || '',
        niche: map.niche,
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
