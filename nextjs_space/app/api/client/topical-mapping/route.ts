
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/client/topical-mapping
 * Haalt alle topical maps op voor een project
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const topicalMaps = await prisma.topicalMap.findMany({
      where: {
        projectId
      },
      include: {
        categories: {
          include: {
            topics: {
              select: {
                id: true,
                isCompleted: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Add statistics to each map
    const mapsWithStats = topicalMaps.map(map => {
      const totalTopics = map.categories.reduce(
        (sum, cat) => sum + cat.topics.length,
        0
      );
      const completedTopics = map.categories.reduce(
        (sum, cat) => sum + cat.topics.filter(t => t.isCompleted).length,
        0
      );
      const completionPercentage = totalTopics > 0 
        ? Math.round((completedTopics / totalTopics) * 100)
        : 0;

      return {
        id: map.id,
        mainTopic: map.mainTopic,
        language: map.language,
        totalArticles: map.totalArticles,
        createdAt: map.createdAt,
        statistics: {
          totalTopics,
          completedTopics,
          completionPercentage,
          categoriesCount: map.categories.length
        }
      };
    });

    return NextResponse.json({
      success: true,
      topicalMaps: mapsWithStats
    });

  } catch (error) {
    console.error('[Topical Map API] Error fetching maps:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch topical maps',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
