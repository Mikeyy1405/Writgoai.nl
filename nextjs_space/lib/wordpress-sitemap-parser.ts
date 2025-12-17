/**
 * WordPress Sitemap Parser
 * 
 * Parses WordPress XML sitemaps to extract existing content for:
 * - Intelligent internal link suggestions
 * - Content gap analysis
 * - Topic mapping
 * - Related article discovery
 * 
 * Supports:
 * - Standard WordPress sitemaps (/sitemap.xml)
 * - Yoast SEO sitemaps
 * - RankMath sitemaps
 * - Custom sitemap structures
 */

import { prisma } from '@/lib/db';
import { XMLParser } from 'fast-xml-parser';
import { chatCompletion } from '@/lib/ai-utils';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface WordPressSitemapEntry {
  url: string;
  title: string;
  publishedDate?: Date;
  topics?: string[];
  keywords?: string[];
  excerpt?: string;
}

export interface InternalLinkSuggestion {
  url: string;
  title: string;
  anchorText: string;
  relevanceScore: number;
  context: string;
}

export interface SitemapParseResult {
  totalUrls: number;
  articles: WordPressSitemapEntry[];
  categories: string[];
  lastScanned: Date;
}

// ============================================================================
// Core Parsing Functions
// ============================================================================

/**
 * Parse WordPress sitemap and extract all article URLs
 */
export async function parseWordPressSitemap(
  websiteUrl: string
): Promise<SitemapParseResult> {
  console.log(`[Sitemap Parser] Starting parse for: ${websiteUrl}`);
  
  try {
    // Clean URL
    const baseUrl = websiteUrl.replace(/\/$/, '');
    
    // Try different sitemap locations
    const sitemapUrls = [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap_index.xml`,
      `${baseUrl}/wp-sitemap.xml`,
      `${baseUrl}/sitemap-index.xml`,
    ];

    let sitemapContent: string | null = null;
    let workingSitemapUrl: string | null = null;

    // Try each sitemap URL until one works
    for (const sitemapUrl of sitemapUrls) {
      try {
        console.log(`[Sitemap Parser] Trying: ${sitemapUrl}`);
        const response = await fetch(sitemapUrl, {
          headers: {
            'User-Agent': 'WritGoAI Sitemap Parser/1.0',
          },
          signal: AbortSignal.timeout(15000), // 15 second timeout
        });

        if (response.ok) {
          sitemapContent = await response.text();
          workingSitemapUrl = sitemapUrl;
          console.log(`[Sitemap Parser] Found sitemap at: ${sitemapUrl}`);
          break;
        }
      } catch (error) {
        // Continue to next URL
        continue;
      }
    }

    if (!sitemapContent) {
      throw new Error('No sitemap found at any standard location');
    }

    // Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    const xmlData = parser.parse(sitemapContent);

    // Extract URLs based on sitemap structure
    let articleUrls: string[] = [];

    // Check if this is a sitemap index (contains links to other sitemaps)
    if (xmlData.sitemapindex) {
      console.log('[Sitemap Parser] Detected sitemap index');
      const sitemaps = Array.isArray(xmlData.sitemapindex.sitemap) 
        ? xmlData.sitemapindex.sitemap 
        : [xmlData.sitemapindex.sitemap];

      // Find post sitemaps (usually contain articles)
      const postSitemaps = sitemaps.filter((sm: any) => {
        const loc = sm.loc;
        return loc.includes('post') || loc.includes('page');
      });

      // Parse each post sitemap
      for (const sitemap of postSitemaps.slice(0, 5)) { // Limit to 5 sitemaps
        try {
          const subUrls = await parseSubSitemap(sitemap.loc);
          articleUrls.push(...subUrls);
        } catch (error) {
          console.warn(`[Sitemap Parser] Failed to parse sub-sitemap: ${sitemap.loc}`);
        }
      }
    } else if (xmlData.urlset && xmlData.urlset.url) {
      // Regular sitemap
      console.log('[Sitemap Parser] Detected regular sitemap');
      const urls = Array.isArray(xmlData.urlset.url) 
        ? xmlData.urlset.url 
        : [xmlData.urlset.url];
      
      articleUrls = urls
        .map((u: any) => u.loc)
        .filter((url: string) => {
          // Filter out non-article URLs
          return !url.includes('/tag/') && 
                 !url.includes('/category/') && 
                 !url.includes('/author/') &&
                 !url.includes('/page/');
        });
    }

    console.log(`[Sitemap Parser] Found ${articleUrls.length} article URLs`);

    // Fetch article data for each URL
    const articles: WordPressSitemapEntry[] = [];
    
    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < Math.min(articleUrls.length, 100); i += batchSize) {
      const batch = articleUrls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(url => fetchArticleData(url))
      );
      articles.push(...batchResults.filter(Boolean) as WordPressSitemapEntry[]);
    }

    // Extract unique categories/topics
    const categories = Array.from(
      new Set(articles.flatMap(a => a.topics || []))
    );

    const result: SitemapParseResult = {
      totalUrls: articleUrls.length,
      articles,
      categories,
      lastScanned: new Date(),
    };

    console.log(`[Sitemap Parser] Successfully parsed ${articles.length} articles`);
    return result;

  } catch (error: any) {
    console.error('[Sitemap Parser] Error:', error.message);
    throw new Error(`Failed to parse sitemap: ${error.message}`);
  }
}

/**
 * Parse a sub-sitemap (from sitemap index)
 */
async function parseSubSitemap(sitemapUrl: string): Promise<string[]> {
  try {
    const response = await fetch(sitemapUrl, {
      headers: {
        'User-Agent': 'WritGoAI Sitemap Parser/1.0',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return [];
    }

    const content = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    const xmlData = parser.parse(content);

    if (xmlData.urlset && xmlData.urlset.url) {
      const urls = Array.isArray(xmlData.urlset.url) 
        ? xmlData.urlset.url 
        : [xmlData.urlset.url];
      return urls.map((u: any) => u.loc);
    }

    return [];
  } catch (error) {
    console.warn(`[Sitemap Parser] Error parsing sub-sitemap: ${sitemapUrl}`);
    return [];
  }
}

/**
 * Fetch article data from a URL
 */
async function fetchArticleData(url: string): Promise<WordPressSitemapEntry | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WritGoAI Sitemap Parser/1.0',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Extract title from <title> tag or og:title
    let title = '';
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }

    const ogTitleMatch = html.match(/property="og:title"\s+content="([^"]+)"/i);
    if (ogTitleMatch) {
      title = ogTitleMatch[1].trim();
    }

    // Extract excerpt/description
    let excerpt = '';
    const descMatch = html.match(/name="description"\s+content="([^"]+)"/i);
    if (descMatch) {
      excerpt = descMatch[1].trim();
    }

    const ogDescMatch = html.match(/property="og:description"\s+content="([^"]+)"/i);
    if (ogDescMatch) {
      excerpt = ogDescMatch[1].trim();
    }

    // Extract keywords from meta tags
    const keywords: string[] = [];
    const keywordsMatch = html.match(/name="keywords"\s+content="([^"]+)"/i);
    if (keywordsMatch) {
      keywords.push(...keywordsMatch[1].split(',').map(k => k.trim()));
    }

    // Extract categories from HTML (if available)
    const topics: string[] = [];
    const categoryMatches = html.matchAll(/rel="category tag">([^<]+)<\/a>/gi);
    for (const match of categoryMatches) {
      topics.push(match[1].trim());
    }

    return {
      url,
      title,
      excerpt,
      topics,
      keywords,
    };
  } catch (error) {
    console.warn(`[Sitemap Parser] Error fetching article data: ${url}`);
    return null;
  }
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Cache sitemap data to database
 */
export async function cacheSitemapData(
  projectId: string,
  articles: WordPressSitemapEntry[]
): Promise<void> {
  try {
    console.log(`[Sitemap Parser] Caching ${articles.length} articles for project ${projectId}`);

    // Delete old cache entries
    await prisma.wordPressSitemapCache.deleteMany({
      where: { projectId },
    });

    // Insert new entries
    for (const article of articles) {
      try {
        await prisma.wordPressSitemapCache.create({
          data: {
            projectId,
            url: article.url,
            title: article.title,
            publishedDate: article.publishedDate,
            topics: article.topics || [],
            keywords: article.keywords || [],
          },
        });
      } catch (error) {
        // Skip duplicates
        console.warn(`[Sitemap Parser] Skipping duplicate: ${article.url}`);
      }
    }

    console.log('[Sitemap Parser] Cache updated successfully');
  } catch (error: any) {
    console.error('[Sitemap Parser] Error caching data:', error.message);
  }
}

/**
 * Get cached sitemap data
 */
export async function getCachedSitemapData(
  projectId: string,
  maxAge: number = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
): Promise<WordPressSitemapEntry[] | null> {
  try {
    const entries = await prisma.wordPressSitemapCache.findMany({
      where: { projectId },
      orderBy: { lastScanned: 'desc' },
    });

    if (entries.length === 0) {
      return null;
    }

    // Check if cache is too old
    const latestEntry = entries[0];
    const cacheAge = Date.now() - latestEntry.lastScanned.getTime();
    
    if (cacheAge > maxAge) {
      console.log('[Sitemap Parser] Cache is too old, needs refresh');
      return null;
    }

    return entries.map(entry => ({
      url: entry.url,
      title: entry.title,
      publishedDate: entry.publishedDate || undefined,
      topics: entry.topics,
      keywords: entry.keywords,
    }));
  } catch (error) {
    console.error('[Sitemap Parser] Error reading cache:', error);
    return null;
  }
}

// ============================================================================
// Internal Link Suggestions
// ============================================================================

/**
 * Find relevant internal links for a new article
 * Uses AI to analyze content and suggest contextual links
 */
export async function findInternalLinks(
  projectId: string,
  articleTitle: string,
  articleKeywords: string[],
  articleContent?: string,
  maxLinks: number = 10
): Promise<InternalLinkSuggestion[]> {
  try {
    console.log(`[Sitemap Parser] Finding internal links for: ${articleTitle}`);

    // Get cached sitemap data
    const cachedArticles = await getCachedSitemapData(projectId);
    
    if (!cachedArticles || cachedArticles.length === 0) {
      console.warn('[Sitemap Parser] No cached articles available for internal links');
      return [];
    }

    // Use AI to find the most relevant articles
    const prompt = `Je bent een SEO expert die interne link suggesties genereert.

Nieuw artikel:
Titel: ${articleTitle}
Keywords: ${articleKeywords.join(', ')}
${articleContent ? `Content snippet: ${articleContent.substring(0, 500)}...` : ''}

Bestaande artikelen:
${cachedArticles.slice(0, 50).map((a, i) => 
  `${i + 1}. "${a.title}" (${a.url})
     Topics: ${a.topics?.join(', ') || 'geen'}
     Keywords: ${a.keywords?.join(', ') || 'geen'}`
).join('\n\n')}

Selecteer de ${maxLinks} meest relevante artikelen om naar te linken vanuit het nieuwe artikel.

Voor elk artikel, geef:
1. De URL van het artikel
2. Een natuurlijke anchor text (2-5 woorden)
3. Een relevance score (0-100)
4. Context waar de link past

Geef je antwoord als JSON in dit formaat:
{
  "links": [
    {
      "url": "https://...",
      "anchorText": "natuurlijke anchor text",
      "relevanceScore": 85,
      "context": "In de sectie over [topic], kan deze link natuurlijk worden geplaatst"
    }
  ]
}

BELANGRIJK: Geef ALLEEN de JSON terug, geen extra tekst.`;

    const aiResponse = await chatCompletion(
      [
        { 
          role: 'system', 
          content: 'Je bent een SEO expert die gestructureerde JSON voor interne link suggesties genereert.' 
        },
        { role: 'user', content: prompt }
      ],
      {
        model: 'claude-sonnet-4-20250514',
        temperature: 0.3,
        max_tokens: 2000,
      }
    );

    // Parse AI response
    const parsed = parseInternalLinksResponse(aiResponse);
    
    console.log(`[Sitemap Parser] Found ${parsed.length} internal link suggestions`);
    return parsed;

  } catch (error: any) {
    console.error('[Sitemap Parser] Error finding internal links:', error.message);
    return [];
  }
}

/**
 * Parse AI response for internal links
 */
function parseInternalLinksResponse(response: string): InternalLinkSuggestion[] {
  try {
    // Try direct JSON parse
    let parsed: any;
    try {
      parsed = JSON.parse(response);
    } catch {
      // Remove markdown code blocks
      const cleaned = response
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      parsed = JSON.parse(cleaned);
    }

    const links = parsed.links || parsed.suggestions || [];
    
    return links.map((link: any) => ({
      url: link.url,
      title: link.title || '',
      anchorText: link.anchorText || link.anchor,
      relevanceScore: link.relevanceScore || link.score || 50,
      context: link.context || '',
    }));
  } catch (error) {
    console.error('[Sitemap Parser] Error parsing internal links response:', error);
    return [];
  }
}

/**
 * Find related articles based on keywords/topics
 * Simple keyword-based matching without AI
 */
export async function findRelatedArticles(
  projectId: string,
  keywords: string[],
  topics: string[],
  limit: number = 10
): Promise<WordPressSitemapEntry[]> {
  try {
    const cachedArticles = await getCachedSitemapData(projectId);
    
    if (!cachedArticles || cachedArticles.length === 0) {
      return [];
    }

    // Score each article based on keyword/topic overlap
    const scoredArticles = cachedArticles.map(article => {
      let score = 0;
      
      // Check keyword matches
      for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase();
        
        if (article.title.toLowerCase().includes(keywordLower)) {
          score += 10;
        }
        
        if (article.keywords?.some(k => k.toLowerCase().includes(keywordLower))) {
          score += 5;
        }
      }
      
      // Check topic matches
      for (const topic of topics) {
        if (article.topics?.includes(topic)) {
          score += 15;
        }
      }
      
      return { article, score };
    });

    // Sort by score and return top N
    return scoredArticles
      .filter(sa => sa.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(sa => sa.article);

  } catch (error) {
    console.error('[Sitemap Parser] Error finding related articles:', error);
    return [];
  }
}

// ============================================================================
// Exports
// ============================================================================

export const WordPressSitemapParser = {
  parse: parseWordPressSitemap,
  cache: cacheSitemapData,
  getCached: getCachedSitemapData,
  findInternalLinks,
  findRelatedArticles,
};
