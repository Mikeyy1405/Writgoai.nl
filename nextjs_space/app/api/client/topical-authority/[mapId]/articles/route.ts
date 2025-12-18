/**
 * GET /api/client/topical-authority/[mapId]/articles
 * 
 * Simpele artikel lijst met ALLE data
 * - DataForSEO metrics (search volume, difficulty, CPC, competition)
 * - Intent (informational, commercial, transactional)
 * - Benodigd aantal woorden
 * - Status tracking
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { validateClient } from '@/lib/services/content-plan-service';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { mapId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await validateClient(session);
    const { mapId } = params;

    // Haal map op
    const map = await prisma.topicalAuthorityMap.findUnique({
      where: { id: mapId },
      include: {
        project: true,
      },
    });

    if (!map) {
      return NextResponse.json(
        { success: false, error: 'Map niet gevonden' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (map.clientId !== client.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Haal ALLE planned articles op voor deze map
    const articles = await prisma.plannedArticle.findMany({
      where: {
        mapId,
      },
      include: {
        subtopic: {
          include: {
            pillarTopic: true,
          }
        },
      },
      orderBy: [
        { priority: 'desc' },      // Hoogste priority eerst
        { order: 'asc' },           // Dan op volgorde
      ],
    });

    // Map naar simpel formaat met ALLE data
    const articlesList = articles.map(article => {
      const dataForSEO = article.dataForSEO as any || {};
      
      return {
        id: article.id,
        title: article.title,
        description: article.description || '',
        focusKeyword: article.focusKeyword,
        keywords: article.keywords || [],
        
        // DataForSEO metrics
        searchVolume: dataForSEO.searchVolume || 0,
        difficulty: dataForSEO.difficulty || 0,
        cpc: dataForSEO.cpc || 0,
        competition: dataForSEO.competition || 0,
        
        // Intent
        intent: article.searchIntent || 'informational',
        
        // Artikel type
        articleType: article.articleType || 'blog-post',
        contentType: article.contentType || 'cluster',
        
        // Woord count
        targetWordCount: article.wordCountTarget || 1500,
        
        // Priority
        priority: article.priority || 5,
        
        // Categorie (alleen als beschikbaar)
        pillar: article.subtopic?.pillarTopic?.title || null,
        subtopic: article.subtopic?.title || null,
        
        // Status
        status: article.status || 'planned',
        generatedAt: article.generatedAt,
        publishedAt: article.publishedAt,
        publishedUrl: article.publishedUrl,
        
        // Metadata
        createdAt: article.createdAt,
      };
    });

    // Statistics
    const stats = {
      total: articlesList.length,
      planned: articlesList.filter(a => a.status === 'planned').length,
      generating: articlesList.filter(a => a.status === 'generating').length,
      generated: articlesList.filter(a => a.status === 'generated').length,
      published: articlesList.filter(a => a.status === 'published').length,
      failed: articlesList.filter(a => a.status === 'failed').length,
      withPillar: articlesList.filter(a => a.pillar !== null).length,
      withoutPillar: articlesList.filter(a => a.pillar === null).length,
    };

    return NextResponse.json({
      success: true,
      map: {
        id: map.id,
        niche: map.niche,
        description: map.description,
        projectName: map.project?.name || map.project?.websiteUrl,
        totalArticles: map.totalArticlesTarget,
        status: map.status,
      },
      articles: articlesList,
      stats,
    });
    
  } catch (error: any) {
    console.error('[Articles API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
