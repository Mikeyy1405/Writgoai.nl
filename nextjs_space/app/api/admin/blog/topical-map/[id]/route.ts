import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/blog/topical-map/:id
 * 
 * Returns a specific topical authority map with all articles
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get the map
    const map = await prisma.topicalAuthorityMap.findUnique({
      where: { id },
    });

    if (!map) {
      return NextResponse.json({ error: 'Map not found' }, { status: 404 });
    }

    // Get all articles for this map
    const articles = await prisma.topicalMapArticle.findMany({
      where: { mapId: id },
      orderBy: { order: 'asc' },
    });

    // Get current batch job if any
    let currentBatch = null;
    if (map.currentBatchId) {
      currentBatch = await prisma.batchJob.findUnique({
        where: { id: map.currentBatchId },
      });
    }

    return NextResponse.json({
      success: true,
      map: {
        id: map.id,
        name: map.name,
        niche: map.niche,
        targetAudience: map.targetAudience,
        language: map.language,
        tone: map.tone,
        keywords: map.keywords,
        totalArticles: map.totalArticles,
        pillarCount: map.pillarCount,
        clusterCount: map.clusterCount,
        pillarClusterRatio: map.pillarClusterRatio,
        status: map.status,
        generationProgress: map.generationProgress,
        articlesGenerated: map.articlesGenerated,
        articlesFailed: map.articlesFailed,
        createdAt: map.createdAt,
        updatedAt: map.updatedAt,
        completedAt: map.completedAt,
      },
      articles: articles.map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        type: a.type,
        parentId: a.parentId,
        primaryKeyword: a.primaryKeyword,
        secondaryKeywords: a.secondaryKeywords,
        contentType: a.contentType,
        wordCount: a.wordCount,
        difficultyLevel: a.difficultyLevel,
        status: a.status,
        blogPostId: a.blogPostId,
        scheduledDate: a.scheduledDate,
        priority: a.priority,
        order: a.order,
        errorMessage: a.errorMessage,
        retryCount: a.retryCount,
        createdAt: a.createdAt,
        generatedAt: a.generatedAt,
      })),
      currentBatch,
    });

  } catch (error: any) {
    console.error('[Topical Map Detail API] Error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error.message,
    }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/blog/topical-map/:id
 * 
 * Deletes a topical authority map and all associated articles
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if map exists
    const map = await prisma.topicalAuthorityMap.findUnique({
      where: { id },
    });

    if (!map) {
      return NextResponse.json({ error: 'Map not found' }, { status: 404 });
    }

    // Delete the map (cascade will delete articles and batch jobs)
    await prisma.topicalAuthorityMap.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Map deleted successfully',
    });

  } catch (error: any) {
    console.error('[Topical Map Delete API] Error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error.message,
    }, { status: 500 });
  }
}
