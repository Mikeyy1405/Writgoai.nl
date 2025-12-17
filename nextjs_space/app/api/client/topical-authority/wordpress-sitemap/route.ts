/**
 * POST /api/client/topical-authority/wordpress-sitemap
 * 
 * Fetch WordPress posts via REST API and cache for internal linking
 * Falls back to sitemap parsing if REST API fails
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { validateClient, validateProject } from '@/lib/services/content-plan-service';
import { WordPressAPI } from '@/lib/services/wordpress-api-fetcher';
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

    console.log(`[WordPress Content API] Fetching posts from: ${websiteUrl}`);

    // Try WordPress REST API first
    try {
      const posts = await WordPressAPI.fetchAllPosts(websiteUrl);
      
      if (posts.length > 0) {
        console.log(`[WordPress Content API] Successfully fetched ${posts.length} posts from REST API`);
        
        // Cache posts
        await WordPressAPI.cachePosts(projectId, posts);

        return NextResponse.json({
          success: true,
          message: 'WordPress posts fetched and cached via REST API',
          method: 'rest-api',
          data: {
            totalUrls: posts.length,
            articlesCached: posts.length,
            categories: [],
            lastScanned: new Date(),
          },
        });
      }
    } catch (apiError) {
      console.warn(`[WordPress Content API] REST API failed, falling back to sitemap:`, apiError);
    }

    // Fallback to sitemap parsing
    console.log(`[WordPress Content API] Falling back to sitemap parsing`);
    const result = await WordPressSitemapParser.parse(websiteUrl);

    // Cache articles
    await WordPressSitemapParser.cache(projectId, result.articles);

    console.log(`[WordPress Content API] Cached ${result.articles.length} articles from sitemap`);

    return NextResponse.json({
      success: true,
      message: 'WordPress content cached via sitemap (fallback)',
      method: 'sitemap',
      data: {
        totalUrls: result.totalUrls,
        articlesCached: result.articles.length,
        categories: result.categories,
        lastScanned: result.lastScanned,
      },
    });

  } catch (error: any) {
    console.error('[WordPress Content API] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch WordPress content',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
