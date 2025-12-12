import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/blog/topical-map/:id/progress
 * 
 * Returns current progress of map generation
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

    // Get current batch job
    let batchJob = null;
    if (map.currentBatchId) {
      batchJob = await prisma.batchJob.findUnique({
        where: { id: map.currentBatchId },
      });
    }

    // Get article counts
    const articles = await prisma.topicalMapArticle.findMany({
      where: { mapId: id },
    });

    const articleStats = {
      total: articles.length,
      pending: articles.filter((a: any) => a.status === 'pending').length,
      generating: articles.filter((a: any) => a.status === 'generating').length,
      generated: articles.filter((a: any) => a.status === 'generated').length,
      published: articles.filter((a: any) => a.status === 'published').length,
      failed: articles.filter((a: any) => a.status === 'failed').length,
    };

    // Calculate estimated time remaining
    let etaMinutes = 0;
    if (batchJob && batchJob.status === 'processing') {
      const remaining = batchJob.totalItems - batchJob.completedItems - batchJob.failedItems;
      etaMinutes = Math.ceil((remaining / (batchJob.batchSize || 20)) * 2); // 2 min per batch
    }

    return NextResponse.json({
      success: true,
      mapStatus: map.status,
      progress: {
        percentage: map.generationProgress,
        articlesGenerated: map.articlesGenerated,
        articlesFailed: map.articlesFailed,
        totalArticles: map.totalArticles,
        etaMinutes,
      },
      articleStats,
      batchJob: batchJob ? {
        id: batchJob.id,
        status: batchJob.status,
        totalItems: batchJob.totalItems,
        completedItems: batchJob.completedItems,
        failedItems: batchJob.failedItems,
        progressPercentage: batchJob.progressPercentage,
        currentBatch: batchJob.currentBatch,
        totalBatches: batchJob.totalBatches,
        batchSize: batchJob.batchSize,
        etaMinutes: batchJob.etaMinutes,
        startedAt: batchJob.startedAt,
        errorLog: batchJob.errorLog,
      } : null,
      isGenerating: map.status === 'generating',
      canResume: map.status === 'paused' && articleStats.pending > 0,
      canStart: map.status === 'planning' || (map.status === 'completed' && articleStats.pending > 0),
    });

  } catch (error: any) {
    console.error('[Progress API] Error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error.message,
    }, { status: 500 });
  }
}
