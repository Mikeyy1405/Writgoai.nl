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
  try {
    const startTime = Date.now();
    
    // Check authenticatie
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    // Vind client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }

    console.log(`[Content API] Fetching content for client ${client.id}`);

    // FAST: Only database queries, NO external API calls
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

    // Map to unified format
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

    // Combine and sort by date (newest first)
    const allContent = [...mappedGenerated, ...mappedWordPress].sort((a, b) => {
      const dateA = a.publishedDate || a.createdAt || new Date(0);
      const dateB = b.publishedDate || b.createdAt || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    // Calculate stats
    const stats = {
      total: allContent.length,
      generated: mappedGenerated.length,
      wordpress: mappedWordPress.length,
      draft: allContent.filter(c => c.status === 'draft').length,
      published: allContent.filter(c => c.status === 'published').length,
    };

    const duration = Date.now() - startTime;
    console.log(`[Content API] ✅ ${duration}ms - ${allContent.length} items (Generated: ${stats.generated}, WordPress: ${stats.wordpress})`);

    return NextResponse.json({
      success: true,
      content: allContent,
      stats: stats,
    });
  } catch (error) {
    console.error('[Content API] ❌ Error fetching content:', error);
    return NextResponse.json(
      { 
        error: 'Er is een fout opgetreden bij het ophalen van content',
        details: error instanceof Error ? error.message : 'Onbekende fout'
      },
      { status: 500 }
    );
  }
}
