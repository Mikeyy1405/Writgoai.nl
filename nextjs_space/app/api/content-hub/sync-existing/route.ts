import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * POST /api/content-hub/sync-existing
 * Sync existing WordPress posts to Content Hub
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { siteId } = body;

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is verplicht' },
        { status: 400 }
      );
    }

    // Get site
    const site = await prisma.contentHubSite.findUnique({
      where: { id: siteId },
    });

    if (!site || site.clientId !== client.id) {
      return NextResponse.json(
        { error: 'Site niet gevonden' },
        { status: 404 }
      );
    }

    if (!site.isConnected || !site.wordpressUsername || !site.wordpressAppPassword) {
      return NextResponse.json(
        { error: 'WordPress niet verbonden' },
        { status: 400 }
      );
    }

    // Fetch existing posts from WordPress
    const auth = Buffer.from(`${site.wordpressUsername}:${site.wordpressAppPassword}`).toString('base64');
    const wpUrl = site.wordpressUrl.replace(/\/$/, '');
    
    let allPosts: any[] = [];
    let page = 1;
    let hasMore = true;

    // Fetch all published posts
    while (hasMore && page <= 10) { // Limit to 10 pages to prevent infinite loops
      const response = await fetch(
        `${wpUrl}/wp-json/wp/v2/posts?per_page=100&page=${page}&status=publish`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Kon WordPress posts niet ophalen');
      }

      const posts = await response.json();
      
      if (posts.length === 0) {
        hasMore = false;
      } else {
        allPosts = allPosts.concat(posts);
        page++;
      }
    }

    console.log(`[Content Hub] Found ${allPosts.length} existing WordPress posts`);

    // Create ContentHubArticles for posts that don't exist yet
    let syncedCount = 0;
    let skippedCount = 0;

    for (const post of allPosts) {
      try {
        // Check if article already exists with this WordPress URL
        const existingArticle = await prisma.contentHubArticle.findFirst({
          where: {
            siteId: site.id,
            wordpressUrl: post.link,
          },
        });

        if (existingArticle) {
          skippedCount++;
          continue;
        }

        // Extract title without HTML
        const title = post.title.rendered.replace(/<[^>]*>/g, '');
        
        // Create article record for existing WordPress post
        await prisma.contentHubArticle.create({
          data: {
            siteId: site.id,
            title,
            slug: post.slug,
            cluster: 'Bestaande Content', // Default cluster for existing content
            keywords: [], // We don't have keywords from WordPress
            status: 'published',
            priority: 0,
            wordpressUrl: post.link,
            publishedAt: new Date(post.date),
            content: post.content.rendered,
            metaTitle: post.yoast_head_json?.title || title,
            metaDescription: post.yoast_head_json?.description || post.excerpt?.rendered?.replace(/<[^>]*>/g, '').substring(0, 160),
          },
        });

        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync post ${post.id}:`, error);
      }
    }

    // Update site with synced data
    await prisma.contentHubSite.update({
      where: { id: site.id },
      data: {
        existingPages: allPosts.length,
        lastSyncedAt: new Date(),
        completedArticles: await prisma.contentHubArticle.count({
          where: {
            siteId: site.id,
            status: 'published',
          },
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `${syncedCount} bestaande artikelen gesynchroniseerd`,
      stats: {
        total: allPosts.length,
        synced: syncedCount,
        skipped: skippedCount,
      },
    });
  } catch (error: any) {
    console.error('[Content Hub] Sync existing error:', error);
    return NextResponse.json(
      { error: error.message || 'Kon bestaande content niet synchroniseren' },
      { status: 500 }
    );
  }
}
