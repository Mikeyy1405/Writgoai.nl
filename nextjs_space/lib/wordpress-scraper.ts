/**
 * WordPress Site Scraper
 * 
 * Scrapes WordPress sites using the REST API to analyze content
 * and identify content gaps for AI-powered content planning
 */

export interface WordPressPost {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  categories: number[];
  tags: number[];
  date: string;
  link: string;
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface WordPressTag {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface WordPressSiteAnalysis {
  url: string;
  posts: WordPressPost[];
  categories: WordPressCategory[];
  tags: WordPressTag[];
  totalPosts: number;
  analyzedAt: string;
}

/**
 * Normalize WordPress URL to ensure it has proper format
 */
function normalizeWordPressUrl(url: string): string {
  // Remove trailing slash
  url = url.replace(/\/$/, '');
  
  // Add https:// if no protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  return url;
}

/**
 * Fetch posts from WordPress REST API
 */
async function fetchPosts(baseUrl: string, perPage: number = 50): Promise<WordPressPost[]> {
  const url = `${baseUrl}/wp-json/wp/v2/posts?per_page=${perPage}&_embed=true`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WritGo Content Analyzer/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
    }
    
    const posts = await response.json();
    
    return posts.map((post: any) => ({
      id: post.id,
      title: post.title?.rendered || '',
      content: post.content?.rendered || '',
      excerpt: post.excerpt?.rendered || '',
      categories: post.categories || [],
      tags: post.tags || [],
      date: post.date,
      link: post.link,
    }));
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw new Error(`Could not fetch posts from ${baseUrl}. Make sure it's a valid WordPress site.`);
  }
}

/**
 * Fetch categories from WordPress REST API
 */
async function fetchCategories(baseUrl: string): Promise<WordPressCategory[]> {
  const url = `${baseUrl}/wp-json/wp/v2/categories?per_page=100`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WritGo Content Analyzer/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }
    
    const categories = await response.json();
    
    return categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      count: cat.count,
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Fetch tags from WordPress REST API
 */
async function fetchTags(baseUrl: string): Promise<WordPressTag[]> {
  const url = `${baseUrl}/wp-json/wp/v2/tags?per_page=100`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WritGo Content Analyzer/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tags: ${response.status}`);
    }
    
    const tags = await response.json();
    
    return tags.map((tag: any) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      count: tag.count,
    }));
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

/**
 * Main function to scrape and analyze a WordPress site
 */
export async function scrapeWordPressSite(
  siteUrl: string,
  postsToFetch: number = 50
): Promise<WordPressSiteAnalysis> {
  const normalizedUrl = normalizeWordPressUrl(siteUrl);
  
  console.log(`[WordPress Scraper] Analyzing site: ${normalizedUrl}`);
  
  // Fetch data in parallel
  const [posts, categories, tags] = await Promise.all([
    fetchPosts(normalizedUrl, postsToFetch),
    fetchCategories(normalizedUrl),
    fetchTags(normalizedUrl),
  ]);
  
  console.log(`[WordPress Scraper] Found ${posts.length} posts, ${categories.length} categories, ${tags.length} tags`);
  
  return {
    url: normalizedUrl,
    posts,
    categories,
    tags,
    totalPosts: posts.length,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Extract key topics and themes from WordPress analysis
 */
export function extractTopicsFromAnalysis(analysis: WordPressSiteAnalysis): string[] {
  const topics: Set<string> = new Set();
  
  // Add category names
  analysis.categories.forEach(cat => {
    if (cat.count > 0 && cat.name !== 'Uncategorized') {
      topics.add(cat.name);
    }
  });
  
  // Add popular tags (with more than 2 posts)
  analysis.tags
    .filter(tag => tag.count >= 2)
    .forEach(tag => topics.add(tag.name));
  
  return Array.from(topics);
}

/**
 * Generate a content summary for AI analysis
 */
export function generateContentSummary(analysis: WordPressSiteAnalysis): string {
  const recentPosts = analysis.posts.slice(0, 20);
  const postTitles = recentPosts.map(p => p.title).join('\n- ');
  const categoryNames = analysis.categories.map(c => c.name).join(', ');
  const tagNames = analysis.tags.slice(0, 20).map(t => t.name).join(', ');
  
  return `
WordPress Site Analysis:
URL: ${analysis.url}
Total Posts: ${analysis.totalPosts}

Recent Post Titles (laatste ${recentPosts.length}):
- ${postTitles}

Categorieën: ${categoryNames || 'Geen categorieën'}

Populaire Tags: ${tagNames || 'Geen tags'}

Datum van analyse: ${new Date(analysis.analyzedAt).toLocaleDateString('nl-NL')}
`.trim();
}
