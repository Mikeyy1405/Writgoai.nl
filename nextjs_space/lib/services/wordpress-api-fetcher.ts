/**
 * WordPress REST API Fetcher
 * 
 * Gebruikt de officiële WordPress REST API om echte content op te halen
 * in plaats van sitemap parsing. Dit geeft:
 * - Echte URL's van bestaande posts
 * - Volledige metadata (title, content, excerpt, author, etc.)
 * - Betere filtering mogelijkheden
 * - Reliable data zonder parsing errors
 * 
 * API Documentatie: https://developer.wordpress.org/rest-api/reference/posts/
 */

import { prisma } from '@/lib/db';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface WordPressAPIPost {
  id: number;
  date: string;
  modified: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
  _embedded?: {
    'wp:term'?: any[][];
    author?: any[];
  };
}

export interface WordPressPost {
  id: number;
  title: string;
  url: string;
  slug: string;
  publishedDate: Date;
  modifiedDate: Date;
  excerpt: string;
  status: string;
  categories: number[];
  tags: number[];
}

// ============================================================================
// WordPress REST API Functions
// ============================================================================

/**
 * Fetch posts from WordPress REST API
 * 
 * @param siteUrl - Base URL van de WordPress site (bijv. "https://gigadier.nl")
 * @param options - Fetch opties (per_page, page, etc.)
 * @returns Array van WordPress posts
 */
export async function fetchWordPressPosts(
  siteUrl: string,
  options: {
    perPage?: number;
    page?: number;
    status?: 'publish' | 'draft' | 'future' | 'private';
  } = {}
): Promise<WordPressPost[]> {
  try {
    // Normalize URL (remove trailing slash)
    const baseUrl = siteUrl.replace(/\/$/, '');
    
    const {
      perPage = 100,
      page = 1,
      status = 'publish',
    } = options;
    
    console.log(`[WordPress API] Fetching posts from ${baseUrl} (page ${page})`);
    
    // Build API URL
    const apiUrl = `${baseUrl}/wp-json/wp/v2/posts?per_page=${perPage}&page=${page}&status=${status}&_embed`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'WritgoAI/1.0',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
    
    if (!response.ok) {
      if (response.status === 400) {
        // Bad request - probably no more pages
        console.log(`[WordPress API] No more pages available`);
        return [];
      }
      
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }
    
    const posts: WordPressAPIPost[] = await response.json();
    
    console.log(`[WordPress API] Found ${posts.length} posts on page ${page}`);
    
    // Map to our format
    const mappedPosts = posts.map(post => ({
      id: post.id,
      title: stripHtml(post.title.rendered),
      url: post.link,
      slug: post.slug,
      publishedDate: new Date(post.date),
      modifiedDate: new Date(post.modified),
      excerpt: stripHtml(post.excerpt.rendered).trim(),
      status: post.status,
      categories: post.categories || [],
      tags: post.tags || [],
    }));
    
    return mappedPosts;
    
  } catch (error) {
    console.error(`[WordPress API] Error fetching posts from ${siteUrl}:`, error);
    
    // Try fallback without _embed
    try {
      const baseUrl = siteUrl.replace(/\/$/, '');
      const { perPage = 100, page = 1, status = 'publish' } = options;
      
      const apiUrl = `${baseUrl}/wp-json/wp/v2/posts?per_page=${perPage}&page=${page}&status=${status}`;
      
      console.log(`[WordPress API] Trying fallback without _embed: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'WritgoAI/1.0',
        },
        signal: AbortSignal.timeout(30000),
      });
      
      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.status}`);
      }
      
      const posts: WordPressAPIPost[] = await response.json();
      
      return posts.map(post => ({
        id: post.id,
        title: stripHtml(post.title.rendered),
        url: post.link,
        slug: post.slug,
        publishedDate: new Date(post.date),
        modifiedDate: new Date(post.modified),
        excerpt: stripHtml(post.excerpt?.rendered || '').trim(),
        status: post.status,
        categories: [],
        tags: [],
      }));
      
    } catch (fallbackError) {
      console.error(`[WordPress API] Fallback also failed:`, fallbackError);
      return [];
    }
  }
}

/**
 * Fetch all posts from WordPress site (paginated)
 * 
 * Haalt automatisch alle pagina's op tot er geen posts meer zijn
 * Max 10 pagina's (1000 posts) om te voorkomen dat we vastlopen
 */
export async function fetchAllWordPressPosts(
  siteUrl: string,
  maxPages: number = 10
): Promise<WordPressPost[]> {
  try {
    const baseUrl = siteUrl.replace(/\/$/, '');
    let allPosts: WordPressPost[] = [];
    let page = 1;
    let hasMore = true;
    
    console.log(`[WordPress API] Starting full fetch from ${baseUrl}`);
    
    while (hasMore && page <= maxPages) {
      console.log(`[WordPress API] Fetching page ${page}/${maxPages}...`);
      
      const posts = await fetchWordPressPosts(siteUrl, { page });
      
      if (posts.length === 0) {
        // No more posts
        hasMore = false;
        break;
      }
      
      allPosts.push(...posts);
      page++;
    }
    
    console.log(`[WordPress API] Total posts fetched: ${allPosts.length}`);
    
    return allPosts;
    
  } catch (error) {
    console.error(`[WordPress API] Error in fetchAllWordPressPosts:`, error);
    return [];
  }
}

/**
 * Test WordPress REST API availability
 * 
 * Controleert of de WordPress REST API beschikbaar is
 */
export async function testWordPressAPI(siteUrl: string): Promise<boolean> {
  try {
    const baseUrl = siteUrl.replace(/\/$/, '');
    const apiUrl = `${baseUrl}/wp-json/wp/v2`;
    
    console.log(`[WordPress API] Testing API at: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'WritgoAI/1.0',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      console.error(`[WordPress API] API test failed: ${response.status}`);
      return false;
    }
    
    console.log(`[WordPress API] API is available at ${baseUrl}`);
    return true;
    
  } catch (error) {
    console.error(`[WordPress API] API test error:`, error);
    return false;
  }
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Cache WordPress posts to database
 * 
 * Gebruikt dezelfde cache tabel als de sitemap parser voor consistentie
 */
export async function cacheWordPressPosts(
  projectId: string,
  posts: WordPressPost[]
): Promise<void> {
  if (!posts || posts.length === 0) {
    console.log('[WordPress API Cache] No posts to cache');
    return;
  }
  
  try {
    console.log(`[WordPress API Cache] Starting cache for ${posts.length} posts in project ${projectId}`);
    
    // Step 1: Fetch existing URLs for this project
    const existingRecords = await prisma.wordPressSitemapCache.findMany({
      where: { projectId },
      select: { url: true }
    });
    
    const existingUrls = new Set(existingRecords.map(r => r.url));
    console.log(`[WordPress API Cache] Found ${existingUrls.size} existing records`);
    
    // Step 2: Filter only new posts
    const newPosts = posts.filter(post => !existingUrls.has(post.url));
    
    if (newPosts.length === 0) {
      console.log('[WordPress API Cache] No new posts to cache - all URLs already exist');
      return;
    }
    
    console.log(`[WordPress API Cache] Caching ${newPosts.length} new posts (${posts.length - newPosts.length} already exist)`);
    
    // Step 3: Batch insert new records
    const batchSize = 50;
    let totalCached = 0;
    
    for (let i = 0; i < newPosts.length; i += batchSize) {
      const batch = newPosts.slice(i, i + batchSize);
      
      try {
        const result = await prisma.wordPressSitemapCache.createMany({
          data: batch.map(post => ({
            projectId,
            url: post.url,
            title: post.title || '',
            publishedDate: post.publishedDate,
            topics: [], // TODO: Extract from categories if needed
            keywords: [], // TODO: Extract from tags if needed
            lastScanned: new Date()
          })),
          skipDuplicates: true
        });
        
        totalCached += result.count;
        console.log(`[WordPress API Cache] Batch ${Math.floor(i / batchSize) + 1}: ${result.count} records cached`);
        
      } catch (error: any) {
        console.error(`[WordPress API Cache] Batch error:`, error.message);
      }
    }
    
    console.log(`[WordPress API Cache] Successfully cached ${totalCached} posts`);
    
  } catch (error: any) {
    console.error('[WordPress API Cache] Fatal error:', error.message);
    throw error;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Strip HTML tags from string
 */
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#039;/g, "'") // Replace &#039; with '
    .trim();
}

// ============================================================================
// Exports
// ============================================================================

export const WordPressAPI = {
  fetchPosts: fetchWordPressPosts,
  fetchAllPosts: fetchAllWordPressPosts,
  testAPI: testWordPressAPI,
  cachePosts: cacheWordPressPosts,
};
