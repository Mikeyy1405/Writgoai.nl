import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/simplified/content
 * 
 * OPTIMIZED: Fast database-only queries, no external API calls
 * 
 * Returns:
 * - Generated content (SavedContent table)
 * - Cached WordPress posts (WordPressSitemapCache table)
 * 
 * Performance: <500ms (was 5-10 seconds)
 */
export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    console.log('[Content API] ========== START ==========');
    console.log('[Content API] Request URL:', request.url);
    console.log('[Content API] Timestamp:', new Date().toISOString());
    
    // Check authenticatie
    console.log('[Content API] Checking session...');
    const session = await getServerSession(authOptions);
    console.log('[Content API] Session:', session?.user?.email || 'NO SESSION');
    console.log('[Content API] Session user:', session?.user ? JSON.stringify(session.user) : 'NULL');
    
    if (!session?.user?.email) {
      console.log('[Content API] ❌ Unauthorized - no session');
      return NextResponse.json(
        { 
          success: false,
          error: 'Niet geautoriseerd - geen sessie' 
        },
        { status: 401 }
      );
    }

    // Vind client
    console.log('[Content API] Looking up client by email:', session.user.email);
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });
    console.log('[Content API] Client:', client ? `Found (ID: ${client.id})` : 'NOT FOUND');

    if (!client) {
      console.log('[Content API] ❌ Client not found for email:', session.user.email);
      return NextResponse.json(
        { 
          success: false,
          error: 'Client niet gevonden' 
        },
        { status: 404 }
      );
    }

    console.log(`[Content API] Fetching content for client ${client.id}...`);

    // FAST: Only database queries, NO external API calls
    console.log('[Content API] Starting parallel database queries...');
    const [generatedContent, cachedWordPressPosts] = await Promise.all([
      // Generated content
      prisma.savedContent.findMany({
        where: {
          project: {
            clientId: client.id,
          },
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              websiteUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      
      // Cached WordPress posts
      prisma.wordPressSitemapCache.findMany({
        where: {
          project: {
            clientId: client.id,
          },
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              websiteUrl: true,
            },
          },
        },
        orderBy: { publishedDate: 'desc' },
        take: 200,
      }),
    ]);

    console.log(`[Content API] Generated content: ${generatedContent.length} items`);
    console.log(`[Content API] Cached WordPress posts: ${cachedWordPressPosts.length} items`);
    
    // Log first few items for debugging
    if (generatedContent.length > 0) {
      console.log('[Content API] Sample generated content:', {
        id: generatedContent[0].id,
        title: generatedContent[0].title,
        projectId: generatedContent[0].projectId,
        hasProject: !!generatedContent[0].project
      });
    }
    
    if (cachedWordPressPosts.length > 0) {
      console.log('[Content API] Sample WordPress post:', {
        id: cachedWordPressPosts[0].id,
        title: cachedWordPressPosts[0].title,
        projectId: cachedWordPressPosts[0].projectId,
        hasProject: !!cachedWordPressPosts[0].project
      });
    }

    // Map to unified format
    console.log('[Content API] Mapping generated content...');
    const mappedGenerated = generatedContent
      .filter(item => item.project)
      .map(item => ({
        id: item.id,
        title: item.title || 'Untitled',
        url: item.publishedUrl || undefined,
        publishedDate: item.publishedAt,
        createdAt: item.createdAt,
        status: item.status || 'draft',
        source: 'generated',
        projectId: item.project.id,
        projectName: item.project.name || item.project.websiteUrl || 'Unknown Project',
        wordCount: item.wordCount || undefined,
      }));
    console.log(`[Content API] Mapped generated: ${mappedGenerated.length} items`);

    console.log('[Content API] Mapping WordPress posts...');
    const mappedWordPress = cachedWordPressPosts
      .filter(item => item.project)
      .map(item => ({
        id: `wp-${item.id}`,
        title: item.title || 'Untitled',
        url: item.url,
        publishedDate: item.publishedDate,
        createdAt: item.publishedDate,
        status: 'published',
        source: 'wordpress',
        projectId: item.project.id,
        projectName: item.project.name || item.project.websiteUrl || 'Unknown Project',
      }));
    console.log(`[Content API] Mapped WordPress: ${mappedWordPress.length} items`);

    // Combine and sort by date (newest first)
    console.log('[Content API] Combining and sorting content...');
    const allContent = [...mappedGenerated, ...mappedWordPress].sort((a, b) => {
      const dateA = a.publishedDate || a.createdAt || new Date(0);
      const dateB = b.publishedDate || b.createdAt || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    console.log(`[Content API] Total combined content: ${allContent.length} items`);

    // Calculate stats
    const stats = {
      total: allContent.length,
      generated: mappedGenerated.length,
      wordpress: mappedWordPress.length,
      draft: allContent.filter(c => c.status === 'draft').length,
      published: allContent.filter(c => c.status === 'published').length,
      scheduled: allContent.filter(c => c.status === 'scheduled').length,
    };
    console.log('[Content API] Stats:', stats);

    const duration = Date.now() - startTime;
    const response = {
      success: true,
      content: allContent,
      stats: stats,
    };
    
    console.log(`[Content API] ✅ Success in ${duration}ms`);
    console.log('[Content API] Response structure:', {
      success: response.success,
      contentLength: response.content.length,
      stats: response.stats
    });
    console.log('[Content API] ========== END ==========');

    return NextResponse.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Content API] ❌ ERROR after', duration, 'ms');
    console.error('[Content API] Error type:', error?.constructor?.name);
    console.error('[Content API] Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[Content API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[Content API] Full error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Er is een fout opgetreden bij het ophalen van content',
        details: error instanceof Error ? error.message : 'Onbekende fout',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}
