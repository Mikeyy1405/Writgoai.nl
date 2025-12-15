import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { countWords, sanitizeHtml } from '@/lib/wordpress-helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/content-hub/wordpress-posts
 * Fetch all WordPress posts from connected site
 */
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get('siteId');

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

    // Fetch posts from WordPress
    const auth = Buffer.from(`${site.wordpressUsername}:${site.wordpressAppPassword}`).toString('base64');
    const wpUrl = site.wordpressUrl.replace(/\/$/, '');
    
    let allPosts: any[] = [];
    let page = 1;
    const perPage = 100;
    let hasMore = true;
    const maxPages = 20; // Limit to prevent excessive API calls

    try {
      while (hasMore && page <= maxPages) {
        const endpoint = `${wpUrl}/wp-json/wp/v2/posts?per_page=${perPage}&page=${page}&_embed=1`;
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Basic ${auth}`,
          },
          signal: AbortSignal.timeout(15000),
        });

        if (response.status === 404) {
          // Try alternative format
          const altEndpoint = `${wpUrl}/?rest_route=/wp/v2/posts&per_page=${perPage}&page=${page}&_embed=1`;
          const altResponse = await fetch(altEndpoint, {
            headers: {
              'Authorization': `Basic ${auth}`,
            },
            signal: AbortSignal.timeout(15000),
          });
          
          if (!altResponse.ok) {
            if (altResponse.status === 400) {
              // End of pagination
              hasMore = false;
              break;
            }
            throw new Error(`WordPress API fout: ${altResponse.status}`);
          }
          
          const posts = await altResponse.json();
          if (posts.length === 0) {
            hasMore = false;
          } else {
            allPosts = allPosts.concat(posts);
            page++;
          }
          continue;
        }

        if (!response.ok) {
          if (response.status === 400) {
            // End of pagination
            hasMore = false;
            break;
          }
          throw new Error(`WordPress API fout: ${response.status}`);
        }

        const posts = await response.json();
        
        if (posts.length === 0) {
          hasMore = false;
        } else {
          allPosts = allPosts.concat(posts);
          page++;
        }
      }

      // Transform posts to simplified format
      const transformedPosts = allPosts.map(post => {
        // Extract featured image URL
        let featuredImage = null;
        if (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
          featuredImage = post._embedded['wp:featuredmedia'][0].source_url;
        }

        // Count words in content
        const wordCount = countWords(post.content.rendered);

        return {
          id: post.id,
          title: sanitizeHtml(post.title.rendered),
          slug: post.slug,
          link: post.link,
          status: post.status,
          date: post.date,
          modified: post.modified,
          excerpt: sanitizeHtml(post.excerpt.rendered).substring(0, 200),
          content: post.content.rendered,
          wordCount,
          featuredImage,
          author: post._embedded?.author?.[0]?.name || 'Onbekend',
          categories: post._embedded?.['wp:term']?.[0]?.map((cat: any) => cat.name) || [],
        };
      });

      return NextResponse.json({
        success: true,
        posts: transformedPosts,
        total: transformedPosts.length,
      });
    } catch (error: any) {
      console.error('[WordPress Posts] Fetch error:', error);
      return NextResponse.json(
        { error: error.message || 'Kon WordPress posts niet ophalen' },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error('[WordPress Posts] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
