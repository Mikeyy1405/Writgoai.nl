
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/client/topical-mapping/topics/available
 * Haalt beschikbare topics op uit de topical map van een project
 * Geeft prioriteit aan pending topics voor automatische selectie
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
    const autoSelect = searchParams.get('autoSelect') === 'true';

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

    // Get topical maps for this project
    const topicalMaps = await prisma.topicalMap.findMany({
      where: {
        projectId
      },
      include: {
        categories: {
          include: {
            topics: {
              where: {
                status: { in: ['pending', 'scheduled'] },
                isCompleted: false
              },
              orderBy: [
                { priority: 'desc' },
                { difficulty: 'asc' }
              ]
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (topicalMaps.length === 0) {
      return NextResponse.json({
        success: true,
        hasTopicalMap: false,
        topics: [],
        message: 'Geen topical map gevonden. Maak eerst een topical map aan.'
      });
    }

    // Flatten all topics from all categories
    const allTopics = topicalMaps.flatMap(map =>
      map.categories.flatMap(category =>
        category.topics.map(topic => ({
          id: topic.id,
          title: topic.title,
          type: topic.type,
          keywords: topic.keywords,
          priority: topic.priority,
          difficulty: topic.difficulty,
          searchVolume: topic.searchVolume,
          categoryName: category.name,
          mapMainTopic: map.mainTopic,
          mapId: map.id,
          cpc: topic.cpc,
          competition: topic.competition,
          opportunityScore: topic.opportunityScore
        }))
      )
    );

    // If autoSelect is true, return the highest priority topic
    if (autoSelect && allTopics.length > 0) {
      const selectedTopic = allTopics[0]; // Already sorted by priority desc, difficulty asc
      
      return NextResponse.json({
        success: true,
        hasTopicalMap: true,
        autoSelected: true,
        selectedTopic,
        totalAvailable: allTopics.length,
        message: `Automatisch geselecteerd: "${selectedTopic.title}"`
      });
    }

    // Group topics by map and category for better UI display
    const groupedTopics = topicalMaps.map(map => ({
      mapId: map.id,
      mainTopic: map.mainTopic,
      language: map.language,
      categories: map.categories
        .filter(cat => cat.topics.length > 0)
        .map(category => ({
          categoryId: category.id,
          categoryName: category.name,
          topics: category.topics.map(topic => ({
            id: topic.id,
            title: topic.title,
            type: topic.type,
            keywords: topic.keywords,
            priority: topic.priority,
            difficulty: topic.difficulty,
            searchVolume: topic.searchVolume,
            opportunityScore: topic.opportunityScore
          }))
        }))
    })).filter(map => map.categories.length > 0);

    return NextResponse.json({
      success: true,
      hasTopicalMap: true,
      topics: groupedTopics, // Voor backward compatibility met Content Specialist
      groupedTopics, // Voor nieuwe implementaties
      totalTopics: allTopics.length,
      message: allTopics.length > 0 
        ? `${allTopics.length} beschikbare topics gevonden`
        : 'Alle topics zijn al voltooid'
    });

  } catch (error) {
    console.error('[Topics Available API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch available topics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
