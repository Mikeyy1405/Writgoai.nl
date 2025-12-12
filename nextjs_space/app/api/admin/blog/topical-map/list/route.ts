import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/blog/topical-map/list
 * 
 * Returns list of all topical authority maps with statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all maps
    const maps = await prisma.topicalAuthorityMap.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // For each map, get article statistics
    const mapsWithStats = await Promise.all(
      maps.map(async (map: any) => {
        const articles = await prisma.topicalMapArticle.findMany({
          where: { mapId: map.id },
        });

        const stats = {
          total: articles.length,
          pending: articles.filter((a: any) => a.status === 'pending').length,
          generating: articles.filter((a: any) => a.status === 'generating').length,
          generated: articles.filter((a: any) => a.status === 'generated').length,
          published: articles.filter((a: any) => a.status === 'published').length,
          failed: articles.filter((a: any) => a.status === 'failed').length,
          pillars: articles.filter((a: any) => a.type === 'pillar').length,
          clusters: articles.filter((a: any) => a.type === 'cluster').length,
        };

        return {
          id: map.id,
          name: map.name,
          niche: map.niche,
          targetAudience: map.targetAudience,
          language: map.language,
          totalArticles: map.totalArticles,
          pillarCount: map.pillarCount,
          clusterCount: map.clusterCount,
          status: map.status,
          generationProgress: map.generationProgress,
          articlesGenerated: map.articlesGenerated,
          articlesFailed: map.articlesFailed,
          createdAt: map.createdAt,
          updatedAt: map.updatedAt,
          completedAt: map.completedAt,
          stats,
        };
      })
    );

    return NextResponse.json({
      success: true,
      maps: mapsWithStats,
    });

  } catch (error: any) {
    console.error('[Topical Map List API] Error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error.message,
    }, { status: 500 });
  }
}
