/**
 * Content Enrichment Utilities
 *
 * Provides utilities for enriching articles with:
 * - YouTube video embeds
 * - Sitemap scraping for internal links
 * - Additional in-article images
 */

import { generateArticleImage } from './aiml-image-generator';

// YouTube API configuration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  embedUrl: string;
  embedHtml: string;
}

export interface SitemapLink {
  url: string;
  title?: string;
  lastmod?: string;
}

/**
 * Search for a relevant YouTube video based on keyword/topic
 */
export async function searchYouTubeVideo(
  keyword: string,
  language: string = 'nl'
): Promise<YouTubeVideo | null> {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key not configured, skipping video search');
    return null;
  }

  try {
    // Build search query - add language hint for Dutch content
    const searchQuery = language === 'nl'
      ? `${keyword} uitleg tutorial`
      : keyword;

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&q=${encodeURIComponent(searchQuery)}` +
      `&type=video&maxResults=5&relevanceLanguage=${language}` +
      `&videoEmbeddable=true&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      console.error('YouTube API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    // Get the first relevant video
    const video = data.items[0];
    const videoId = video.id.videoId;

    return {
      id: videoId,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default.url,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      embedHtml: generateYouTubeEmbed(videoId, video.snippet.title),
    };
  } catch (error) {
    console.error('YouTube search error:', error);
    return null;
  }
}

/**
 * Generate responsive YouTube embed HTML
 */
export function generateYouTubeEmbed(videoId: string, title: string): string {
  return `
<div class="youtube-embed" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 30px 0; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
  <iframe
    src="https://www.youtube.com/embed/${videoId}?rel=0"
    title="${title.replace(/"/g, '&quot;')}"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; border-radius: 12px;"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
    loading="lazy"
  ></iframe>
</div>
`;
}

/**
 * Fetch and parse sitemap from a website URL
 */
export async function scrapeSitemap(websiteUrl: string): Promise<SitemapLink[]> {
  const baseUrl = websiteUrl.replace(/\/$/, '');
  const sitemapUrls = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/wp-sitemap.xml`,
    `${baseUrl}/post-sitemap.xml`,
    `${baseUrl}/sitemap-posts.xml`,
  ];

  const links: SitemapLink[] = [];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const response = await fetch(sitemapUrl, {
        headers: {
          'User-Agent': 'WritGo Bot/1.0 (https://writgo.nl)',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        continue;
      }

      const xml = await response.text();

      // Check if this is a sitemap index (contains other sitemaps)
      if (xml.includes('<sitemapindex')) {
        const childSitemaps = extractSitemapUrls(xml);
        for (const childUrl of childSitemaps.slice(0, 3)) {
          const childLinks = await fetchSitemapLinks(childUrl);
          links.push(...childLinks);
        }
      } else {
        // Regular sitemap - extract URLs
        const pageLinks = extractLinksFromSitemap(xml);
        links.push(...pageLinks);
      }

      // If we found links, stop trying other sitemap URLs
      if (links.length > 0) {
        break;
      }
    } catch (error) {
      // Continue to next sitemap URL
      continue;
    }
  }

  // Filter to only include blog/article URLs and limit
  const blogLinks = links.filter(link => {
    const url = link.url.toLowerCase();
    return (
      url.includes('/blog/') ||
      url.includes('/artikel') ||
      url.includes('/nieuws') ||
      url.includes('/post/') ||
      // Generic pattern: base URL + single path segment (common for blog posts)
      (url.split('/').filter(Boolean).length <= 4 && !url.includes('page'))
    );
  });

  return blogLinks.slice(0, 50);
}

/**
 * Extract sitemap URLs from sitemap index
 */
function extractSitemapUrls(xml: string): string[] {
  const urls: string[] = [];
  const locRegex = /<sitemap>\s*<loc>([^<]+)<\/loc>/gi;
  let match;

  while ((match = locRegex.exec(xml)) !== null) {
    urls.push(match[1].trim());
  }

  return urls;
}

/**
 * Fetch links from a single sitemap
 */
async function fetchSitemapLinks(sitemapUrl: string): Promise<SitemapLink[]> {
  try {
    const response = await fetch(sitemapUrl, {
      headers: {
        'User-Agent': 'WritGo Bot/1.0 (https://writgo.nl)',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    return extractLinksFromSitemap(xml);
  } catch {
    return [];
  }
}

/**
 * Extract page URLs from sitemap XML
 */
function extractLinksFromSitemap(xml: string): SitemapLink[] {
  const links: SitemapLink[] = [];

  // Match <url> blocks
  const urlBlockRegex = /<url>([\s\S]*?)<\/url>/gi;
  let match;

  while ((match = urlBlockRegex.exec(xml)) !== null) {
    const block = match[1];

    // Extract loc (URL)
    const locMatch = block.match(/<loc>([^<]+)<\/loc>/i);
    if (!locMatch) continue;

    const url = locMatch[1].trim();

    // Extract lastmod if present
    const lastmodMatch = block.match(/<lastmod>([^<]+)<\/lastmod>/i);
    const lastmod = lastmodMatch ? lastmodMatch[1].trim() : undefined;

    links.push({ url, lastmod });
  }

  return links;
}

/**
 * Extract title from a webpage URL
 */
export async function fetchPageTitle(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WritGo Bot/1.0 (https://writgo.nl)',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Extract title from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      return titleMatch[1].trim()
        .replace(/\s*[\|\-–—]\s*.*$/, '') // Remove site name suffix
        .trim();
    }

    // Try og:title
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitleMatch) {
      return ogTitleMatch[1].trim();
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Format sitemap links for AI prompt
 */
export function formatSitemapLinksForPrompt(links: SitemapLink[]): string {
  if (links.length === 0) {
    return '';
  }

  const linkList = links.slice(0, 20).map(link =>
    `- ${link.url}${link.title ? ` (${link.title})` : ''}`
  ).join('\n');

  return `
## Interne links van de website (voeg 2-4 relevante links toe):
${linkList}

Instructies voor interne links:
- Voeg deze links toe waar ze natuurlijk passen in de tekst
- Gebruik beschrijvende anchor tekst gebaseerd op het onderwerp
- Link naar gerelateerde artikelen
- Gebruik HTML: <a href="URL">anchor tekst</a>
`;
}

/**
 * Generate an in-article image for a specific section
 */
export async function generateInArticleImage(
  sectionTitle: string,
  articleKeyword: string
): Promise<string | null> {
  const prompt = `${sectionTitle}, ${articleKeyword}, informative illustration, clean design`;

  return await generateArticleImage(prompt, 'photorealistic');
}

/**
 * Create HTML for in-article image
 */
export function createInArticleImageHtml(
  imageUrl: string,
  altText: string,
  caption?: string
): string {
  return `
<figure style="margin: 30px 0; text-align: center;">
  <img
    src="${imageUrl}"
    alt="${altText.replace(/"/g, '&quot;')}"
    style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
    loading="lazy"
  />
  ${caption ? `<figcaption style="margin-top: 10px; font-size: 14px; color: #666; font-style: italic;">${caption}</figcaption>` : ''}
</figure>
`;
}

/**
 * Find insertion point after intro (before first H2)
 */
export function findIntroEndPosition(content: string): number {
  // Find the first H2 tag
  const h2Match = content.match(/<h2[^>]*>/i);
  if (h2Match && h2Match.index !== undefined) {
    return h2Match.index;
  }

  // Fallback: after first 2 paragraphs
  let pCount = 0;
  let lastPEnd = 0;
  const pRegex = /<\/p>/gi;
  let match;

  while ((match = pRegex.exec(content)) !== null) {
    pCount++;
    lastPEnd = match.index + match[0].length;
    if (pCount >= 2) {
      return lastPEnd;
    }
  }

  return lastPEnd || 0;
}

/**
 * Find insertion point in middle of article (after 2nd or 3rd H2)
 */
export function findMiddlePosition(content: string): number {
  const h2Regex = /<h2[^>]*>[\s\S]*?<\/h2>/gi;
  let h2Count = 0;
  let lastH2End = 0;
  let match;

  while ((match = h2Regex.exec(content)) !== null) {
    h2Count++;
    if (h2Count === 2 || h2Count === 3) {
      // Find the end of the next paragraph after this H2
      const afterH2 = content.substring(match.index + match[0].length);
      const nextPEnd = afterH2.match(/<\/p>/i);
      if (nextPEnd && nextPEnd.index !== undefined) {
        lastH2End = match.index + match[0].length + nextPEnd.index + 4;
        if (h2Count === 3) break;
      }
    }
  }

  return lastH2End;
}

/**
 * Insert content at specific position
 */
export function insertContentAtPosition(
  content: string,
  insertContent: string,
  position: number
): string {
  if (position <= 0) {
    return content + insertContent;
  }
  return content.slice(0, position) + '\n\n' + insertContent + '\n\n' + content.slice(position);
}
