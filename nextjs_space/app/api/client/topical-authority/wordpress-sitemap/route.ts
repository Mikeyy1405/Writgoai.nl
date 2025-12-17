/**
 * POST /api/client/topical-authority/wordpress-sitemap
 * 
 * Parse WordPress sitemap and cache articles for internal linking
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { validateClient, validateProject } from '@/lib/services/content-plan-service';
import { WordPressSitemapParser } from '@/lib/wordpress-sitemap-parser';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await validateClient(session);
    const body = await request.json();
    
    const { projectId, websiteUrl } = body;

    if (!projectId || !websiteUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate project ownership
    await validateProject(projectId, client.id);

    console.log(`[Sitemap API] Parsing sitemap for: ${websiteUrl}`);

    // Parse sitemap
    const result = await WordPressSitemapParser.parse(websiteUrl);

    // Cache articles
    await WordPressSitemapParser.cache(projectId, result.articles);

    console.log(`[Sitemap API] Cached ${result.articles.length} articles`);

    return NextResponse.json({
      success: true,
      message: 'WordPress sitemap parsed and cached',
      data: {
        totalUrls: result.totalUrls,
        articlesCached: result.articles.length,
        categories: result.categories,
        lastScanned: result.lastScanned,
      },
    });

  } catch (error: any) {
    console.error('[Sitemap API] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to parse WordPress sitemap',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
