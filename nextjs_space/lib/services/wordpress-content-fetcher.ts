/**
 * WordPress Content Fetcher Service
 * 
 * Fetches and consolidates WordPress posts from multiple sources:
 * - WordPress REST API (PRIMARY - for real content)
 * - Cached WordPress data
 * - Fallback to sitemap (legacy)
 * 
 * Used by content overview pages to show both:
 * - Generated content (SavedContent table)
 * - Published WordPress posts (via REST API)
 */

import { WordPressAPI } from '@/lib/services/wordpress-api-fetcher';
import { parseWordPressSitemap, getCachedSitemapData, cacheSitemapData } from '@/lib/wordpress-sitemap-parser';
import { prisma } from '@/lib/db';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface WordPressPost {
  id: string;
  title: string;
  url: string;
  publishedDate: Date;
  excerpt?: string;
  status: 'published';
  source: 'wordpress';
  projectId: string;
  projectName: string;
  wordCount?: number;
}

export interface GeneratedContent {
  id: string;
  title: string;
  url?: string;
  publishedDate?: Date;
  createdAt: Date;
  excerpt?: string;
  status: 'draft' | 'published' | 'scheduled';
  source: 'generated';
  projectId: string;
  projectName: string;
  wordCount?: number;
}

export interface ConsolidatedContent {
  id: string;
  title: string;
  url?: string;
  publishedDate?: Date;
  createdAt?: Date;
  excerpt?: string;
  status: 'draft' | 'published' | 'scheduled';
  source: 'wordpress' | 'generated';
  projectId: string;
  projectName: string;
  wordCount?: number;
}

// ============================================================================
// WordPress Post Fetching
// ============================================================================

/**
 * Fetch WordPress posts for a specific project using WordPress REST API
 * 
 * Strategy:
 * 1. Check cache first (max 24 hours old)
 * 2. If no cache or too old: fetch fresh data from WordPress REST API
 * 3. Fallback to sitemap if REST API fails
 */
export async function fetchWordPressPostsForProject(
  projectId: string
): Promise<WordPressPost[]> {
  try {
    // Get project details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        websiteUrl: true,
      },
    });

    if (!project || !project.websiteUrl) {
      console.log(`[WordPress Fetcher] No website URL for project ${projectId}`);
      return [];
    }

    // Try to get cached data first (max 24 hours old)
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const cachedData = await getCachedSitemapData(projectId, oneDayInMs);

    let posts: WordPressPost[] = [];

    if (cachedData && cachedData.length > 0) {
      console.log(`[WordPress Fetcher] Using cached data for project ${projectId} (${cachedData.length} posts)`);
      
      // Generate unique IDs for cached entries using URL hash
      posts = cachedData.map((entry, index) => {
        // Create a simple hash from the URL for consistent IDs
        const urlHash = entry.url.split('').reduce((acc, char) => {
          return ((acc << 5) - acc) + char.charCodeAt(0);
        }, 0).toString(36);
        
        return {
          id: `wp-${projectId}-${urlHash}`,
          title: entry.title || 'Untitled',
          url: entry.url,
          publishedDate: entry.publishedDate || new Date(),
          excerpt: entry.excerpt,
          status: 'published' as const,
          source: 'wordpress' as const,
          projectId: project.id,
          projectName: project.name || project.websiteUrl || 'Unknown Project',
        };
      });
    } else {
      // No cache or old cache - fetch fresh data using WordPress REST API
      console.log(`[WordPress Fetcher] Fetching fresh data from WordPress REST API for project ${projectId}`);
      
      try {
        // Try WordPress REST API first (preferred method)
        const apiPosts = await WordPressAPI.fetchAllPosts(project.websiteUrl);
        
        if (apiPosts.length > 0) {
          console.log(`[WordPress Fetcher] Successfully fetched ${apiPosts.length} posts from REST API`);
          
          // Cache the API results
          await WordPressAPI.cachePosts(projectId, apiPosts);
          
          // Map to our format
          posts = apiPosts.map(post => {
            const urlHash = post.url.split('').reduce((acc, char) => {
              return ((acc << 5) - acc) + char.charCodeAt(0);
            }, 0).toString(36);
            
            return {
              id: `wp-${projectId}-${urlHash}`,
              title: post.title || 'Untitled',
              url: post.url,
              publishedDate: post.publishedDate,
              excerpt: post.excerpt,
              status: 'published' as const,
              source: 'wordpress' as const,
              projectId: project.id,
              projectName: project.name || project.websiteUrl || 'Unknown Project',
            };
          });
        } else {
          // REST API returned no posts - try sitemap fallback
          console.log(`[WordPress Fetcher] REST API returned no posts, trying sitemap fallback`);
          
          const sitemapData = await parseWordPressSitemap(project.websiteUrl);
          
          if (sitemapData.articles && sitemapData.articles.length > 0) {
            console.log(`[WordPress Fetcher] Successfully fetched ${sitemapData.articles.length} posts from sitemap (fallback)`);
            
            await cacheSitemapData(projectId, sitemapData.articles);
            
            posts = sitemapData.articles.map((article, index) => {
              const urlHash = article.url.split('').reduce((acc, char) => {
                return ((acc << 5) - acc) + char.charCodeAt(0);
              }, 0).toString(36);
              
              return {
                id: `wp-${projectId}-${urlHash}`,
                title: article.title || 'Untitled',
                url: article.url,
                publishedDate: article.publishedDate || new Date(),
                excerpt: article.excerpt,
                status: 'published' as const,
                source: 'wordpress' as const,
                projectId: project.id,
                projectName: project.name || project.websiteUrl || 'Unknown Project',
              };
            });
          }
        }
      } catch (error) {
        console.error(`[WordPress Fetcher] Error fetching posts for project ${projectId}:`, error);
        
        // Last resort: try sitemap
        try {
          console.log(`[WordPress Fetcher] Trying sitemap as last resort`);
          
          const sitemapData = await parseWordPressSitemap(project.websiteUrl);
          
          if (sitemapData.articles && sitemapData.articles.length > 0) {
            await cacheSitemapData(projectId, sitemapData.articles);
            
            posts = sitemapData.articles.map((article, index) => {
              const urlHash = article.url.split('').reduce((acc, char) => {
                return ((acc << 5) - acc) + char.charCodeAt(0);
              }, 0).toString(36);
              
              return {
                id: `wp-${projectId}-${urlHash}`,
                title: article.title || 'Untitled',
                url: article.url,
                publishedDate: article.publishedDate || new Date(),
                excerpt: article.excerpt,
                status: 'published' as const,
                source: 'wordpress' as const,
                projectId: project.id,
                projectName: project.name || project.websiteUrl || 'Unknown Project',
              };
            });
          }
        } catch (sitemapError) {
          console.error(`[WordPress Fetcher] Sitemap fallback also failed:`, sitemapError);
          return [];
        }
      }
    }

    console.log(`[WordPress Fetcher] Returning ${posts.length} posts for project ${projectId}`);
    return posts;
  } catch (error) {
    console.error(`[WordPress Fetcher] Error in fetchWordPressPostsForProject:`, error);
    return [];
  }
}

/**
 * Fetch WordPress posts for multiple projects
 */
export async function fetchWordPressPostsForProjects(
  projectIds: string[]
): Promise<WordPressPost[]> {
  const allPosts: WordPressPost[] = [];

  // Fetch posts for each project in parallel
  const results = await Promise.allSettled(
    projectIds.map(projectId => fetchWordPressPostsForProject(projectId))
  );

  // Consolidate results
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allPosts.push(...result.value);
    } else {
      console.error(`[WordPress Fetcher] Failed to fetch posts for project ${projectIds[index]}:`, result.reason);
    }
  });

  return allPosts;
}

// ============================================================================
// Generated Content Fetching
// ============================================================================

/**
 * Fetch generated content for a client
 */
export async function fetchGeneratedContent(
  clientId: string
): Promise<GeneratedContent[]> {
  try {
    const content = await prisma.savedContent.findMany({
      where: {
        project: {
          clientId: clientId,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to latest 100 items
    });

    // Filter out items with missing project data and map with null checks
    return content
      .filter(item => item && item.project && item.project.id)
      .map(item => ({
        id: item.id,
        title: item.title || 'Untitled',
        url: item.publishedUrl || undefined,
        publishedDate: item.publishedAt ? new Date(item.publishedAt) : undefined,
        createdAt: new Date(item.createdAt),
        status: (item.status || 'draft') as 'draft' | 'published' | 'scheduled',
        source: 'generated' as const,
        projectId: item.project.id,
        projectName: item.project.name || 'Unknown Project',
        wordCount: item.wordCount || undefined,
      }));
  } catch (error) {
    console.error(`[WordPress Fetcher] Error fetching generated content:`, error);
    return [];
  }
}

// ============================================================================
// Content Consolidation
// ============================================================================

/**
 * Consolidate all content (WordPress + Generated) for a client
 */
export async function fetchAllContent(
  clientId: string
): Promise<ConsolidatedContent[]> {
  try {
    // Get all projects for this client
    const projects = await prisma.project.findMany({
      where: { clientId },
      select: { id: true },
    });

    const projectIds = projects.map(p => p.id);

    // Fetch both generated content and WordPress posts in parallel
    const [generatedContent, wordPressPosts] = await Promise.all([
      fetchGeneratedContent(clientId),
      fetchWordPressPostsForProjects(projectIds),
    ]);

    // Combine and sort by date (newest first)
    const allContent: ConsolidatedContent[] = [
      ...generatedContent,
      ...wordPressPosts,
    ].sort((a, b) => {
      const dateA = a.publishedDate || a.createdAt || new Date(0);
      const dateB = b.publishedDate || b.createdAt || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    console.log(`[WordPress Fetcher] Fetched ${generatedContent.length} generated + ${wordPressPosts.length} WordPress posts = ${allContent.length} total`);

    return allContent;
  } catch (error) {
    console.error(`[WordPress Fetcher] Error in fetchAllContent:`, error);
    throw error;
  }
}

// ============================================================================
// Content Stats
// ============================================================================

export interface ContentStats {
  total: number;
  generated: number;
  wordpress: number;
  draft: number;
  published: number;
  scheduled: number;
}

/**
 * Get content statistics for a client
 */
export async function getContentStats(
  clientId: string
): Promise<ContentStats> {
  try {
    const allContent = await fetchAllContent(clientId);

    return {
      total: allContent.length,
      generated: allContent.filter(c => c.source === 'generated').length,
      wordpress: allContent.filter(c => c.source === 'wordpress').length,
      draft: allContent.filter(c => c.status === 'draft').length,
      published: allContent.filter(c => c.status === 'published').length,
      scheduled: allContent.filter(c => c.status === 'scheduled').length,
    };
  } catch (error) {
    console.error(`[WordPress Fetcher] Error getting content stats:`, error);
    return {
      total: 0,
      generated: 0,
      wordpress: 0,
      draft: 0,
      published: 0,
      scheduled: 0,
    };
  }
}
