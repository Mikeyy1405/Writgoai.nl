import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/blog/pipeline/status
 * Returns the current status of the blog content pipeline
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    // Get the most recent active topical authority map
    const activeMap = await prisma.topicalAuthorityMap.findFirst({
      where: {
        status: {
          in: ['planning', 'generating', 'completed'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    if (!activeMap) {
      // No active plan
      return NextResponse.json({
        hasActivePlan: false,
        plannedArticles: 0,
        generatedArticles: 0,
        publishedArticles: 0,
        generationProgress: 0,
        generationStatus: 'idle',
        autopilotEnabled: false,
      });
    }

    // Count generated articles
    const generatedArticles = await prisma.topicalMapArticle.count({
      where: {
        mapId: activeMap.id,
        status: {
          in: ['generated', 'published'],
        },
      },
    });

    // Count published articles
    const publishedArticles = await prisma.topicalMapArticle.count({
      where: {
        mapId: activeMap.id,
        status: 'published',
      },
    });

    // Check autopilot status
    const autopilotConfig = await prisma.autopilotConfig.findUnique({
      where: {
        type_planId: {
          type: 'blog',
          planId: activeMap.id,
        },
      },
    });

    // Calculate progress
    const totalArticles = activeMap._count.articles || activeMap.totalArticles || 0;
    const progress =
      totalArticles > 0 ? Math.round((generatedArticles / totalArticles) * 100) : 0;

    // Determine generation status
    let generationStatus: 'idle' | 'active' | 'completed' | 'paused' = 'idle';
    if (activeMap.status === 'generating') {
      generationStatus = 'active';
    } else if (activeMap.status === 'completed') {
      generationStatus = 'completed';
    } else if (activeMap.status === 'paused') {
      generationStatus = 'paused';
    }

    return NextResponse.json({
      hasActivePlan: true,
      planId: activeMap.id,
      plannedArticles: totalArticles,
      generatedArticles,
      publishedArticles,
      generationProgress: progress,
      generationStatus,
      autopilotEnabled: autopilotConfig?.enabled || false,
    });
  } catch (error) {
    console.error('Blog pipeline status error:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen pipeline status' },
      { status: 500 }
    );
  }
}
