/**
 * GET /api/client/topical-authority/articles
 * 
 * Get articles ready for generation from a map
 * Sorted by priority
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { validateClient } from '@/lib/services/content-plan-service';
import { TopicalAuthorityService } from '@/lib/services/topical-authority-service';
import { WordPressSitemapParser } from '@/lib/wordpress-sitemap-parser';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await validateClient(session);
    const { searchParams } = new URL(request.url);
    const mapId = searchParams.get('mapId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!mapId) {
      return NextResponse.json(
        { error: 'Missing mapId parameter' },
        { status: 400 }
      );
    }

    // Get map to verify ownership
    const map = await TopicalAuthorityService.getMap(mapId);
    
    if (!map) {
      return NextResponse.json(
        { error: 'Map not found' },
        { status: 404 }
      );
    }

    if (map.clientId !== client.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get articles
    const articles = await TopicalAuthorityService.getArticlesForGeneration(mapId, limit);

    // For each article, get internal link suggestions
    const articlesWithLinks = await Promise.all(
      articles.map(async (article) => {
        const internalLinks = await WordPressSitemapParser.findInternalLinks(
          map.projectId,
          article.title,
          article.keywords
        );

        return {
          ...article,
          suggestedInternalLinks: internalLinks,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: articlesWithLinks,
    });

  } catch (error: any) {
    console.error('[Topical Authority API] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get articles',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
