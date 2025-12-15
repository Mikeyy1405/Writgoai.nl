
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/client/topical-mapping/[id]
 * Haalt een topical map op met volledige details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const topicalMap = await prisma.topicalMap.findFirst({
      where: {
        id: params.id,
        project: {
          clientId: client.id
        }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            websiteUrl: true
          }
        },
        categories: {
          include: {
            topics: {
              include: {
                content: {
                  select: {
                    id: true,
                    title: true,
                    createdAt: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!topicalMap) {
      return NextResponse.json({ error: 'Topical map not found' }, { status: 404 });
    }

    // Calculate progress statistics
    const totalTopics = topicalMap.categories.reduce(
      (sum, cat) => sum + cat.topics.length,
      0
    );
    const completedTopics = topicalMap.categories.reduce(
      (sum, cat) => sum + cat.topics.filter(t => t.isCompleted).length,
      0
    );
    const completionPercentage = totalTopics > 0 
      ? Math.round((completedTopics / totalTopics) * 100)
      : 0;

    // Calculate authority score (0-100)
    const authorityScore = Math.min(
      Math.round(
        (completionPercentage * 0.7) + // 70% based on completion
        (topicalMap.categories.length * 2) + // 2 points per category
        (totalTopics / 10) // 1 point per 10 articles
      ),
      100
    );

    return NextResponse.json({
      success: true,
      topicalMap: {
        id: topicalMap.id,
        mainTopic: topicalMap.mainTopic,
        language: topicalMap.language,
        totalArticles: topicalMap.totalArticles,
        project: topicalMap.project,
        createdAt: topicalMap.createdAt,
        statistics: {
          totalTopics,
          completedTopics,
          completionPercentage,
          authorityScore,
          categoriesCount: topicalMap.categories.length
        },
        categories: topicalMap.categories.map(category => ({
          id: category.id,
          name: category.name,
          priority: category.priority,
          articleCount: category.articleCount,
          commercialRatio: category.commercialRatio,
          completedCount: category.topics.filter(t => t.isCompleted).length,
          topics: category.topics.map(topic => ({
            id: topic.id,
            title: topic.title,
            type: topic.type,
            keywords: topic.keywords,
            searchVolume: topic.searchVolume,
            difficulty: topic.difficulty,
            priority: topic.priority,
            isCompleted: topic.isCompleted,
            content: topic.content,
            createdAt: topic.createdAt
          }))
        }))
      }
    });

  } catch (error) {
    console.error('[Topical Map API] Error fetching map:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch topical map',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/client/topical-mapping/[id]
 * Verwijdert een topical map
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify ownership
    const topicalMap = await prisma.topicalMap.findFirst({
      where: {
        id: params.id,
        project: {
          clientId: client.id
        }
      }
    });

    if (!topicalMap) {
      return NextResponse.json({ error: 'Topical map not found' }, { status: 404 });
    }

    // Delete topical map (cascade will delete categories and topics)
    await prisma.topicalMap.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Topical map verwijderd'
    });

  } catch (error) {
    console.error('[Topical Map API] Error deleting map:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete topical map',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
