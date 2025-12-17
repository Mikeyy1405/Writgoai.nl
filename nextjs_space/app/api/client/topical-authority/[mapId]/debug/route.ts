/**
 * DEBUG ROUTE
 * Check wat er wel/niet is opgeslagen in de database
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
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

    const { mapId } = params;
    
    // Haal map op
    const map = await prisma.topicalAuthorityMap.findUnique({
      where: { id: mapId },
    });
    
    // Haal pillars op
    const pillars = await prisma.pillarTopic.findMany({
      where: { mapId },
      orderBy: { order: 'asc' },
    });
    
    // Haal subtopics op
    const subtopics = await prisma.subtopic.findMany({
      where: { 
        pillarTopic: {
          mapId
        }
      },
      orderBy: { order: 'asc' },
    });
    
    // Haal ALL planned articles op (ook die NIET gekoppeld zijn aan pillars)
    const articlesWithPillar = await prisma.plannedArticle.findMany({
      where: {
        mapId,
      },
      orderBy: { order: 'asc' },
      include: {
        subtopic: {
          include: {
            pillarTopic: true,
          }
        },
      },
    });
    
    console.log('[Debug] Map data:', {
      mapId,
      map: map ? {
        id: map.id,
        niche: map.niche,
        status: map.status,
        totalArticlesTarget: map.totalArticlesTarget,
        totalArticlesPlanned: map.totalArticlesPlanned,
        totalArticlesGenerated: map.totalArticlesGenerated,
        totalArticlesPublished: map.totalArticlesPublished,
      } : 'not found',
      counts: {
        pillars: pillars.length,
        subtopics: subtopics.length,
        articles: articlesWithPillar.length,
        articlesWithoutPillar: articlesWithPillar.filter(a => !a.pillarId).length,
        articlesWithoutSubtopic: articlesWithPillar.filter(a => !a.subtopicId).length,
      }
    });
    
    return NextResponse.json({
      success: true,
      map: map ? {
        id: map.id,
        niche: map.niche,
        description: map.description,
        status: map.status,
        totalArticlesTarget: map.totalArticlesTarget,
        totalArticlesPlanned: map.totalArticlesPlanned,
        totalArticlesGenerated: map.totalArticlesGenerated,
        totalArticlesPublished: map.totalArticlesPublished,
        createdAt: map.createdAt,
      } : null,
      pillars: pillars.map(p => ({
        id: p.id,
        title: p.title,
        status: p.status,
        order: p.order,
      })),
      subtopics: subtopics.map(s => ({
        id: s.id,
        title: s.title,
        pillarId: s.pillarId,
        status: s.status,
        order: s.order,
      })),
      articles: articlesWithPillar.map(a => ({
        id: a.id,
        title: a.title,
        focusKeyword: a.focusKeyword,
        status: a.status,
        pillarId: a.pillarId,
        subtopicId: a.subtopicId,
        pillarTitle: a.subtopic?.pillarTopic?.title || null,
        subtopicTitle: a.subtopic?.title || null,
        searchVolume: (a.dataForSEO as any)?.searchVolume || 0,
        difficulty: (a.dataForSEO as any)?.difficulty || 0,
      })),
      counts: {
        pillars: pillars.length,
        subtopics: subtopics.length,
        articles: articlesWithPillar.length,
        articlesWithoutPillar: articlesWithPillar.filter(a => !a.pillarId).length,
        articlesWithoutSubtopic: articlesWithPillar.filter(a => !a.subtopicId).length,
      },
      diagnosis: {
        hasPillars: pillars.length > 0,
        hasSubtopics: subtopics.length > 0,
        hasArticles: articlesWithPillar.length > 0,
        hasOrphanedArticles: articlesWithPillar.filter(a => !a.pillarId || !a.subtopicId).length > 0,
      },
    });
    
  } catch (error: any) {
    console.error('[Debug API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
