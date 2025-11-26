
/**
 * Sitemap Checker - Check if content already exists on website
 * Prevents duplicate content generation
 */

import { prisma } from '@/lib/db';

export interface SitemapEntry {
  loc: string;
  title?: string;
  lastmod?: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  reason?: string;
  existingUrl?: string;
}

/**
 * Fetch and parse sitemap from project
 */
export async function fetchSitemap(projectId: string): Promise<SitemapEntry[]> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        websiteUrl: true,
        sitemap: true,
        sitemapScannedAt: true,
      },
    });

    if (!project) {
      console.warn('Project not found for sitemap check');
      return [];
    }

    // If sitemap was recently scanned (within 24 hours), use cached version
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (
      project.sitemap &&
      project.sitemapScannedAt &&
      new Date(project.sitemapScannedAt) > twentyFourHoursAgo
    ) {
      console.log('✅ Using cached sitemap (scanned within 24 hours)');
      return parseSitemap(project.sitemap);
    }

    // Otherwise, fetch fresh sitemap
    if (!project.websiteUrl) {
      console.warn('No website URL found for project');
      return [];
    }

    console.log(`🔍 Fetching fresh sitemap from ${project.websiteUrl}`);
    const sitemapUrl = `${project.websiteUrl}/sitemap.xml`;

    const response = await fetch(sitemapUrl, {
      headers: { 'User-Agent': 'WritgoAI Content Planner/1.0' },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      console.warn(`Failed to fetch sitemap: ${response.status}`);
      return project.sitemap ? parseSitemap(project.sitemap) : [];
    }

    const xml = await response.text();

    // Update cache in database
    await prisma.project.update({
      where: { id: projectId },
      data: {
        sitemap: xml,
        sitemapScannedAt: new Date(),
      },
    });

    return parseSitemap(xml);
  } catch (error) {
    console.error('Error fetching sitemap:', error);
    return [];
  }
}

/**
 * Parse XML sitemap into structured data
 */
function parseSitemap(xml: any): SitemapEntry[] {
  try {
    // If sitemap is already parsed JSON
    if (typeof xml === 'object' && Array.isArray(xml)) {
      return xml;
    }

    // Parse XML string
    if (typeof xml !== 'string') {
      return [];
    }

    const entries: SitemapEntry[] = [];
    const urlMatches = xml.matchAll(/<url[^>]*>(.*?)<\/url>/gs);

    for (const match of urlMatches) {
      const urlContent = match[1];
      const locMatch = urlContent.match(/<loc[^>]*>(.*?)<\/loc>/);
      const lastmodMatch = urlContent.match(/<lastmod[^>]*>(.*?)<\/lastmod>/);

      if (locMatch) {
        entries.push({
          loc: locMatch[1].trim(),
          lastmod: lastmodMatch ? lastmodMatch[1].trim() : undefined,
        });
      }
    }

    return entries;
  } catch (error) {
    console.error('Error parsing sitemap:', error);
    return [];
  }
}

/**
 * Check if a topic/keyword is already covered on the website
 */
export async function checkForDuplicates(
  projectId: string,
  title: string,
  focusKeyword: string
): Promise<DuplicateCheckResult> {
  try {
    const sitemap = await fetchSitemap(projectId);

    if (sitemap.length === 0) {
      // No sitemap found, can't check for duplicates
      return { isDuplicate: false };
    }

    // Normalize strings for comparison
    const normalizedTitle = normalizeString(title);
    const normalizedKeyword = normalizeString(focusKeyword);

    // Check each sitemap entry
    for (const entry of sitemap) {
      const normalizedUrl = normalizeString(entry.loc);

      // Check if keyword is in URL
      if (normalizedUrl.includes(normalizedKeyword)) {
        return {
          isDuplicate: true,
          reason: `Keyword "${focusKeyword}" gevonden in URL`,
          existingUrl: entry.loc,
        };
      }

      // Check if title words are in URL (for SEO-friendly URLs)
      const titleWords = normalizedTitle.split(/\s+/).filter((w) => w.length > 4);
      const matchingWords = titleWords.filter((word) => normalizedUrl.includes(word));

      // If 70% of title words are in URL, it's likely a duplicate
      if (matchingWords.length / titleWords.length > 0.7) {
        return {
          isDuplicate: true,
          reason: `Vergelijkbare URL gevonden voor "${title}"`,
          existingUrl: entry.loc,
        };
      }
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    // On error, allow the content (better safe than sorry)
    return { isDuplicate: false };
  }
}

/**
 * Batch check multiple content ideas for duplicates
 */
export async function batchCheckDuplicates(
  projectId: string,
  ideas: Array<{ title: string; focusKeyword: string }>
): Promise<Array<DuplicateCheckResult>> {
  try {
    const sitemap = await fetchSitemap(projectId);

    if (sitemap.length === 0) {
      return ideas.map(() => ({ isDuplicate: false }));
    }

    return Promise.all(
      ideas.map(async (idea) => {
        const normalizedTitle = normalizeString(idea.title);
        const normalizedKeyword = normalizeString(idea.focusKeyword);

        for (const entry of sitemap) {
          const normalizedUrl = normalizeString(entry.loc);

          if (normalizedUrl.includes(normalizedKeyword)) {
            return {
              isDuplicate: true,
              reason: `Keyword "${idea.focusKeyword}" gevonden in URL`,
              existingUrl: entry.loc,
            };
          }

          const titleWords = normalizedTitle.split(/\s+/).filter((w) => w.length > 4);
          const matchingWords = titleWords.filter((word) => normalizedUrl.includes(word));

          if (matchingWords.length / titleWords.length > 0.7) {
            return {
              isDuplicate: true,
              reason: `Vergelijkbare URL gevonden voor "${idea.title}"`,
              existingUrl: entry.loc,
            };
          }
        }

        return { isDuplicate: false };
      })
    );
  } catch (error) {
    console.error('Error batch checking duplicates:', error);
    return ideas.map(() => ({ isDuplicate: false }));
  }
}

/**
 * Get statistics about existing content on site
 */
export async function getSitemapStats(projectId: string) {
  const sitemap = await fetchSitemap(projectId);

  return {
    totalPages: sitemap.length,
    lastScanned: new Date(),
    urls: sitemap.map((entry) => entry.loc),
  };
}

/**
 * Normalize string for comparison (lowercase, remove special chars, etc.)
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single
}
