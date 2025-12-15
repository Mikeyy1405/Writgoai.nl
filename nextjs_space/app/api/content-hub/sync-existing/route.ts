import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Safely remove HTML tags from a string using multiple passes
 * This ensures nested tags and malicious scripts are fully removed
 */
function sanitizeHtml(html: string): string {
  let text = html;
  let prevText = '';
  
  // Remove HTML tags in multiple passes to handle nested tags
  while (text !== prevText && text.includes('<')) {
    prevText = text;
    text = text.replace(/<[^>]*>/g, '');
  }
  
  // Decode common HTML entities in the correct order to prevent double-escaping
  text = text.replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#039;/g, "'")
             .replace(/&nbsp;/g, ' ')
             .replace(/&amp;/g, '&');  // Do &amp; last to prevent double-decoding
  
  return text.trim();
}

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
    let wordpressError = null;
    let totalPages: number | null = null;

    // Try to fetch all published posts (limit to 20 pages = 2000 posts max to prevent excessive API calls)
    try {
      while (hasMore && page <= 20) {
        // Validate page number against total pages if known (from previous response)
        if (totalPages !== null && page > totalPages) {
          console.log(`[Content Hub] Reached last page (${totalPages}), stopping pagination`);
          hasMore = false;
          break;
        }
        // Try standard REST API endpoint first, fallback to alternative if 404
        const standardEndpoint = `${wpUrl}/wp-json/wp/v2/posts?per_page=100&page=${page}&status=publish`;
        let response = await fetch(
          standardEndpoint,
          {
            headers: {
              'Authorization': `Basic ${auth}`,
            },
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(15000), // 15 second timeout
          }
        );

        // If 404, try alternative REST API endpoint format
        if (response.status === 404) {
          console.log('[Content Hub] Standard endpoint not found, trying alternative format...');
          const alternativeEndpoint = `${wpUrl}/?rest_route=/wp/v2/posts&per_page=100&page=${page}&status=publish`;
          response = await fetch(
            alternativeEndpoint,
            {
              headers: {
                'Authorization': `Basic ${auth}`,
              },
              signal: AbortSignal.timeout(15000),
            }
          );
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Onbekende fout');
          
          // Handle invalid page number error - this means we've reached the end of pagination
          if (response.status === 400) {
            try {
              const errorData = JSON.parse(errorText);
              if (errorData.code === 'rest_post_invalid_page_number') {
                // This is normal - it means we've reached the end of available pages
                console.log(`[Content Hub] Reached end of pagination at page ${page}`);
                hasMore = false;
                break; // Exit the loop, this is not an error
              }
            } catch (e) {
              // If we can't parse the error, fall through to generic error handling
            }
          }
          
          // Only log and throw errors if we didn't already handle pagination end above
          console.error(`[Content Hub] WordPress API error (${response.status}):`, errorText);
          
          // Specific error messages based on status code
          if (response.status === 401 || response.status === 403) {
            throw new Error('WordPress authenticatie mislukt. Controleer je gebruikersnaam en app wachtwoord.');
          } else if (response.status === 404) {
            throw new Error('WordPress REST API niet gevonden. Is de site bereikbaar?');
          } else if (response.status >= 500) {
            throw new Error('WordPress server fout. Probeer het later opnieuw.');
          } else {
            throw new Error(`WordPress fout (${response.status}): ${errorText}`);
          }
        }

        // Extract total pages from response headers (check on every response)
        const wpTotalPages = response.headers.get('X-WP-TotalPages');
        if (wpTotalPages) {
          const parsed = parseInt(wpTotalPages, 10);
          if (!isNaN(parsed) && parsed >= 0) {
            if (totalPages === null) {
              totalPages = parsed;
              console.log(`[Content Hub] WordPress reports ${totalPages} total pages available`);
              
              // If WordPress reports 0 pages, there are no posts
              if (totalPages === 0) {
                console.log('[Content Hub] No posts found in WordPress (0 pages)');
                hasMore = false;
                break;
              }
            }
          } else {
            console.warn(`[Content Hub] Invalid X-WP-TotalPages header value: ${wpTotalPages}`);
          }
        } else if (totalPages === null) {
          console.log('[Content Hub] X-WP-TotalPages header not found, will paginate until empty response');
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
    } catch (error: any) {
      console.error('[Content Hub] WordPress fetch error:', error);
      wordpressError = error.message || 'Kon geen verbinding maken met WordPress';
      
      // Check if we have existing articles in the database
      const existingArticles = await prisma.contentHubArticle.count({
        where: {
          siteId: site.id,
          status: 'published',
        },
      });

      // If WordPress is unreachable but we have existing data, return a partial success
      if (existingArticles > 0) {
        return NextResponse.json({
          success: true,
          warning: true,
          message: `WordPress niet bereikbaar, maar ${existingArticles} artikelen zijn al gesynchroniseerd`,
          error: wordpressError,
          stats: {
            total: existingArticles,
            synced: 0,
            skipped: existingArticles,
            cached: true,
          },
        });
      }
      
      // If no cached data exists, return error
      return NextResponse.json(
        { 
          error: wordpressError,
          details: 'WordPress niet bereikbaar en geen gesynchroniseerde artikelen in database',
        },
        { status: 503 } // Service Unavailable instead of 500
      );
    }

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

        // Extract title without HTML using the sanitizer function
        const title = sanitizeHtml(post.title.rendered);
        
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
            metaDescription: post.yoast_head_json?.description || 
              (post.excerpt?.rendered ? sanitizeHtml(post.excerpt.rendered).substring(0, 160) : ''),
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
