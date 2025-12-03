/**
 * Internal Linking Helper for Content Hub
 * Suggests and adds internal links to articles
 */

export interface InternalLink {
  url: string;
  title: string;
  anchorText: string;
  relevanceScore?: number;
}

export interface LinkSuggestion {
  targetUrl: string;
  targetTitle: string;
  suggestedAnchor: string;
  contextSnippet: string;
  relevance: number;
}

/**
 * Find opportunities for internal linking in content
 */
export function findLinkOpportunities(
  content: string,
  existingPages: Array<{ url: string; title: string; keywords?: string[] }>,
  currentKeywords: string[]
): LinkSuggestion[] {
  const suggestions: LinkSuggestion[] = [];
  
  // Convert content to lowercase for matching
  const lowerContent = content.toLowerCase();
  
  existingPages.forEach(page => {
    let maxRelevance = 0;
    let bestAnchor = page.title;
    let contextSnippet = '';
    
    // Check title match
    if (lowerContent.includes(page.title.toLowerCase())) {
      maxRelevance = 0.9;
      bestAnchor = page.title;
      
      // Find context
      const titleIndex = lowerContent.indexOf(page.title.toLowerCase());
      const start = Math.max(0, titleIndex - 50);
      const end = Math.min(content.length, titleIndex + page.title.length + 50);
      contextSnippet = content.substring(start, end);
    }
    
    // Check keyword matches
    if (page.keywords) {
      page.keywords.forEach(keyword => {
        if (lowerContent.includes(keyword.toLowerCase())) {
          const relevance = 0.7;
          if (relevance > maxRelevance) {
            maxRelevance = relevance;
            bestAnchor = keyword;
            
            // Find context
            const keywordIndex = lowerContent.indexOf(keyword.toLowerCase());
            const start = Math.max(0, keywordIndex - 50);
            const end = Math.min(content.length, keywordIndex + keyword.length + 50);
            contextSnippet = content.substring(start, end);
          }
        }
      });
    }
    
    if (maxRelevance > 0.5) {
      suggestions.push({
        targetUrl: page.url,
        targetTitle: page.title,
        suggestedAnchor: bestAnchor,
        contextSnippet,
        relevance: maxRelevance,
      });
    }
  });
  
  // Sort by relevance
  return suggestions.sort((a, b) => b.relevance - a.relevance).slice(0, 15);
}

/**
 * Add internal links to HTML content
 */
export function addInternalLinks(
  content: string,
  links: InternalLink[]
): string {
  let modifiedContent = content;
  
  // Sort links by relevance score (descending)
  const sortedLinks = [...links].sort((a, b) => 
    (b.relevanceScore || 0) - (a.relevanceScore || 0)
  );
  
  // Add each link, but only once per anchor text
  const usedAnchors = new Set<string>();
  
  sortedLinks.forEach(link => {
    const anchorLower = link.anchorText.toLowerCase();
    
    if (usedAnchors.has(anchorLower)) {
      return;
    }
    
    // Find first occurrence of anchor text that's not already linked
    const regex = new RegExp(
      `(?<!<a[^>]*>)\\b(${escapeRegex(link.anchorText)})\\b(?![^<]*<\/a>)`,
      'i'
    );
    
    const match = modifiedContent.match(regex);
    if (match) {
      modifiedContent = modifiedContent.replace(
        regex,
        `<a href="${link.url}" title="${link.title}">$1</a>`
      );
      usedAnchors.add(anchorLower);
    }
  });
  
  return modifiedContent;
}

/**
 * Generate internal linking suggestions using AI
 */
export async function generateLinkSuggestions(
  articleTitle: string,
  articleContent: string,
  existingPages: Array<{ url: string; title: string }>,
  maxSuggestions: number = 10
): Promise<InternalLink[]> {
  // Simple implementation - match by keyword overlap
  const suggestions: InternalLink[] = [];
  
  const contentWords = new Set(
    articleContent
      .toLowerCase()
      .replace(/<[^>]*>/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4)
  );
  
  existingPages.forEach(page => {
    const titleWords = page.title.toLowerCase().split(/\s+/);
    const matches = titleWords.filter(word => 
      word.length > 4 && contentWords.has(word)
    );
    
    if (matches.length > 0) {
      suggestions.push({
        url: page.url,
        title: page.title,
        anchorText: page.title,
        relevanceScore: matches.length / titleWords.length,
      });
    }
  });
  
  return suggestions
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    .slice(0, maxSuggestions);
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Count existing internal links in content
 */
export function countInternalLinks(content: string, domain: string): number {
  const domainRegex = new RegExp(`href=["']https?:\/\/${escapeRegex(domain)}`, 'gi');
  const matches = content.match(domainRegex);
  return matches ? matches.length : 0;
}

/**
 * Validate internal links are working
 */
export async function validateLinks(
  links: InternalLink[]
): Promise<Array<{ link: InternalLink; valid: boolean; statusCode?: number }>> {
  const results = [];
  
  for (const link of links) {
    try {
      const response = await fetch(link.url, { method: 'HEAD' });
      results.push({
        link,
        valid: response.ok,
        statusCode: response.status,
      });
    } catch (error) {
      results.push({
        link,
        valid: false,
      });
    }
  }
  
  return results;
}
