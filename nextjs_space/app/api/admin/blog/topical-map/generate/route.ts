import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateTopicalAuthorityMap, TopicalMapConfig } from '@/lib/topical-authority-ai-service';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for large maps

/**
 * POST /api/admin/blog/topical-map/generate
 * 
 * Generates a complete topical authority map structure (without generating content yet)
 * Creates the map and all article records in the database
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      niche,
      targetAudience,
      language = 'nl',
      tone = 'professioneel',
      keywords,
      totalArticles,
      pillarClusterRatio = '1:10',
    } = body;

    // Validation
    if (!name || !niche || !targetAudience || !totalArticles) {
      return NextResponse.json(
        { error: 'Naam, niche, doelgroep en aantal artikelen zijn verplicht' },
        { status: 400 }
      );
    }

    if (totalArticles < 50 || totalArticles > 500) {
      return NextResponse.json(
        { error: 'Aantal artikelen moet tussen 50 en 500 zijn' },
        { status: 400 }
      );
    }

    console.log('[Topical Map API] Generating map structure...');

    // Get client ID (for now, use admin's associated client or create default)
    const adminEmail = session.user?.email;
    let client = await prisma.client.findFirst({
      where: { email: adminEmail },
    });

    if (!client) {
      // Create a default client for admin if not exists
      client = await prisma.client.create({
        data: {
          email: adminEmail,
          name: 'Admin',
          password: '', // Admin uses NextAuth, not password
        },
      });
    }

    // Prepare AI config
    const aiConfig: TopicalMapConfig = {
      niche,
      targetAudience,
      language,
      tone,
      keywords: keywords ? keywords.split(',').map((k: string) => k.trim()).filter(Boolean) : [],
      totalArticles,
      pillarClusterRatio,
    };

    // Generate the map structure with AI
    console.log('[Topical Map API] Calling AI service...');
    const mapStructure = await generateTopicalAuthorityMap(aiConfig);

    console.log(`[Topical Map API] AI generated ${mapStructure.totalArticles} articles`);

    // Create the TopicalAuthorityMap record
    const topicalMap = await prisma.topicalAuthorityMap.create({
      data: {
        clientId: client.id,
        name,
        niche,
        targetAudience,
        language,
        tone,
        keywords: aiConfig.keywords,
        totalArticles: mapStructure.totalArticles,
        pillarCount: mapStructure.pillarCount,
        clusterCount: mapStructure.clusterCount,
        pillarClusterRatio,
        status: 'planning',
        generationProgress: 0,
        articlesGenerated: 0,
        articlesFailed: 0,
      },
    });

    console.log(`[Topical Map API] Created map: ${topicalMap.id}`);

    // Create article records
    const articleRecords = [];
    const pillarArticles: { [index: number]: string } = {}; // Map pillar index to ID

    for (const article of mapStructure.articles) {
      const baseData = {
        mapId: topicalMap.id,
        title: article.title,
        description: article.description,
        type: article.type,
        primaryKeyword: article.primaryKeyword,
        secondaryKeywords: article.secondaryKeywords,
        contentType: article.contentType,
        wordCount: article.wordCount,
        difficultyLevel: article.difficultyLevel,
        status: 'pending',
        priority: article.priority,
        order: article.order,
      };

      if (article.type === 'pillar') {
        const pillarRecord = await prisma.topicalMapArticle.create({
          data: {
            ...baseData,
            parentId: null,
          },
        });
        
        // Store pillar ID for cluster linking
        pillarArticles[article.order] = pillarRecord.id;
        articleRecords.push(pillarRecord);
      } else if (article.type === 'cluster') {
        // Find parent pillar ID
        const parentPillarId = pillarArticles[article.parentPillarIndex] || null;
        
        const clusterRecord = await prisma.topicalMapArticle.create({
          data: {
            ...baseData,
            parentId: parentPillarId,
          },
        });
        
        articleRecords.push(clusterRecord);
      }
    }

    console.log(`[Topical Map API] Created ${articleRecords.length} article records`);

    // Return the generated map with articles
    return NextResponse.json({
      success: true,
      map: {
        id: topicalMap.id,
        name: topicalMap.name,
        niche: topicalMap.niche,
        targetAudience: topicalMap.targetAudience,
        totalArticles: topicalMap.totalArticles,
        pillarCount: topicalMap.pillarCount,
        clusterCount: topicalMap.clusterCount,
        status: topicalMap.status,
        estimatedTimeWeeks: mapStructure.estimatedTimeWeeks,
        keywordCoverage: mapStructure.keywordCoverage.length,
      },
      articles: articleRecords.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        type: a.type,
        primaryKeyword: a.primaryKeyword,
        secondaryKeywords: a.secondaryKeywords,
        contentType: a.contentType,
        wordCount: a.wordCount,
        difficultyLevel: a.difficultyLevel,
        parentId: a.parentId,
        order: a.order,
        status: a.status,
      })),
    });

  } catch (error: any) {
    console.error('[Topical Map API] Error generating map:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error.message,
    }, { status: 500 });
  }
}
