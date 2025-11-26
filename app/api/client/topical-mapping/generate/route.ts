
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateTopicalMap } from '@/lib/topical-map-generator';

/**
 * POST /api/client/topical-mapping/generate
 * Genereert een complete topical authority map voor een project
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const {
      projectId,
      mainTopic,
      language = 'NL',
      depth = 3,
      targetArticles = 300,
      commercialRatio = 0.4
    } = body;

    if (!projectId || !mainTopic) {
      return NextResponse.json(
        { error: 'Project ID and main topic are required' },
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

    console.log('[Topical Map API] Generating map for:', {
      project: project.name,
      topic: mainTopic,
      targetArticles
    });

    // Generate topical map using AI
    const mapResult = await generateTopicalMap({
      mainTopic,
      language,
      depth,
      targetArticles,
      includeCommercial: true,
      commercialRatio
    });

    // Save topical map to database
    const topicalMap = await prisma.topicalMap.create({
      data: {
        projectId,
        mainTopic,
        language,
        depth,
        totalArticles: mapResult.totalArticles,
        categories: {
          create: mapResult.categories.map((category) => ({
            name: category.name,
            priority: category.priority,
            articleCount: category.articleCount,
            commercialRatio: category.commercialRatio,
            topics: {
              create: category.subcategories.flatMap((subcategory) =>
                (subcategory.topics || []).map((topic) => ({
                  title: topic.title,
                  type: topic.type,
                  keywords: topic.keywords,
                  searchVolume: topic.searchVolume,
                  difficulty: topic.difficulty,
                  priority: topic.priority
                }))
              )
            }
          }))
        }
      },
      include: {
        categories: {
          include: {
            topics: true
          }
        }
      }
    });

    console.log('[Topical Map API] Saved to database:', {
      id: topicalMap.id,
      categories: topicalMap.categories.length,
      totalTopics: topicalMap.categories.reduce(
        (sum, cat) => sum + cat.topics.length,
        0
      )
    });

    return NextResponse.json({
      success: true,
      topicalMap: {
        id: topicalMap.id,
        mainTopic: topicalMap.mainTopic,
        totalArticles: topicalMap.totalArticles,
        categories: topicalMap.categories.length,
        estimatedMonths: mapResult.estimatedMonths,
        seoOpportunityScore: mapResult.seoOpportunityScore,
        internalLinkingStrategy: mapResult.internalLinkingStrategy
      },
      message: `Topical map gegenereerd met ${topicalMap.totalArticles} artikel ideeën!`
    });

  } catch (error) {
    console.error('[Topical Map API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate topical map',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
