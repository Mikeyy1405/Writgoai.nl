import { prisma } from './db';

export interface WordPressConfig {
  siteUrl: string;
  username: string;
  applicationPassword: string;
}

export interface WordPressConfigOptions {
  clientEmail?: string;
  projectId?: string;
}

/**
 * Get WordPress config for a project or client
 * Checks project-specific config first, then falls back to client-level config
 */
export async function getWordPressConfig(
  options: WordPressConfigOptions
): Promise<WordPressConfig | null> {
  try {
    const { prisma } = await import('./db');
    
    if (!options.clientEmail && !options.projectId) {
      throw new Error('Either clientEmail or projectId is required');
    }

    // If projectId is provided, get project config
    if (options.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: options.projectId },
        include: {
          client: {
            select: {
              wordpressUrl: true,
              wordpressUsername: true,
              wordpressPassword: true,
            }
          }
        }
      });

      if (project) {
        // Use project config if available, otherwise fall back to client config
        const config = {
          siteUrl: project.wordpressUrl || project.client.wordpressUrl || '',
          username: project.wordpressUsername || project.client.wordpressUsername || '',
          applicationPassword: project.wordpressPassword || project.client.wordpressPassword || '',
        };

        if (config.siteUrl && config.username && config.applicationPassword) {
          return config;
        }
      }
    }

    // Fall back to client config
    if (options.clientEmail) {
      const client = await prisma.client.findUnique({
        where: { email: options.clientEmail },
        select: {
          wordpressUrl: true,
          wordpressUsername: true,
          wordpressPassword: true,
        }
      });

      if (client && client.wordpressUrl && client.wordpressUsername && client.wordpressPassword) {
        return {
          siteUrl: client.wordpressUrl,
          username: client.wordpressUsername,
          applicationPassword: client.wordpressPassword,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting WordPress config:', error);
    return null;
  }
}

interface PublishArticleOptions {
  title: string;
  content: string;
  excerpt: string;
  status?: 'publish' | 'draft';
  categories?: number[];
  tags?: (string | number)[]; // Can be tag names (strings) or tag IDs (numbers)
  featuredImageUrl?: string; // URL of featured image to upload
  // SEO metadata for Yoast/RankMath
  seoTitle?: string;
  seoDescription?: string;
  focusKeyword?: string;
  useGutenberg?: boolean; // Whether to convert content to Gutenberg blocks
}

interface WordPressPost {
  id: number;
  link: string;
  status: string;
}

/**
 * Convert HTML content to Gutenberg blocks (server-side compatible)
 * Processes elements in order to maintain proper structure
 * Now supports affiliate product boxes and custom HTML blocks
 */
function convertHTMLToGutenbergBlocks(html: string): string {
  if (!html) return '';

  // STAP 1: Verwijder alle H1's - deze staan al in de WordPress titel
  let cleanedHtml = html.replace(/<h1[^>]*>.*?<\/h1>/gis, '');
  
  let blocks = '';
  let processedHtml = cleanedHtml;
  
  // Find all HTML elements with their positions
  const allMatches: Array<{match: string, index: number, type: string, end: number}> = [];
  
  // Define all patterns we want to match (in priority order)
  const patterns = [
    // Affiliate displays (check these FIRST before generic divs)
    { regex: /<!-- Affiliate Product Box:.*?-->.*?<!-- End Affiliate Product Box -->/gis, type: 'affiliate-box' },
    { regex: /<!-- Affiliate CTA Box:.*?-->.*?<!-- End Affiliate CTA Box -->/gis, type: 'affiliate-cta' },
    { regex: /<!-- Affiliate Product Grid -->.*?<!-- End Affiliate Product Grid -->/gis, type: 'affiliate-grid' },
    { regex: /<!-- Affiliate Comparison Table -->.*?<!-- End Affiliate Comparison Table -->/gis, type: 'affiliate-table' },
    // Fallback: Match divs with WritgoAI classes (for backward compatibility)
    { regex: /<div[^>]*class="writgo-product-box(?:-v2)?"[^>]*>[\s\S]*?<\/div>\s*(?=<|$)/gis, type: 'affiliate-box' },
    { regex: /<div[^>]*class="writgo-cta-box(?:-v2)?"[^>]*>[\s\S]*?<\/div>\s*(?=<|$)/gis, type: 'affiliate-cta' },
    // Tables (check BEFORE generic divs/details) - NIEUWE TOEVOEGING
    { regex: /<table[^>]*>[\s\S]*?<\/table>/gis, type: 'table' },
    // FAQ Accordion (check BEFORE generic details/div)
    { regex: /<details[^>]*>[\s\S]*?<\/details>/gis, type: 'details' },
    // Direct answer box (check BEFORE generic divs)
    { regex: /<div[^>]*class="direct-answer-box"[^>]*>[\s\S]*?<\/div>/gis, type: 'direct-answer' },
    // Regular HTML elements (H1 already removed above)
    { regex: /<h2[^>]*>.*?<\/h2>/gis, type: 'h2' },
    { regex: /<h3[^>]*>.*?<\/h3>/gis, type: 'h3' },
    { regex: /<h4[^>]*>.*?<\/h4>/gis, type: 'h4' },
    { regex: /<h5[^>]*>.*?<\/h5>/gis, type: 'h5' },
    { regex: /<h6[^>]*>.*?<\/h6>/gis, type: 'h6' },
    { regex: /<figure[^>]*>.*?<\/figure>/gis, type: 'figure' },
    { regex: /<img[^>]*\/?>/gi, type: 'img' },
    { regex: /<ul[^>]*>.*?<\/ul>/gis, type: 'ul' },
    { regex: /<ol[^>]*>.*?<\/ol>/gis, type: 'ol' },
    { regex: /<blockquote[^>]*>.*?<\/blockquote>/gis, type: 'blockquote' },
    { regex: /<pre[^>]*>.*?<\/pre>/gis, type: 'pre' },
    { regex: /<p[^>]*>.*?<\/p>/gis, type: 'p' },
  ];
  
  // Find all matches with their positions
  for (const pattern of patterns) {
    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    while ((match = regex.exec(cleanedHtml)) !== null) {
      allMatches.push({
        match: match[0],
        index: match.index,
        end: match.index + match[0].length,
        type: pattern.type
      });
    }
  }
  
  // Sort by position to maintain document order
  allMatches.sort((a, b) => a.index - b.index);
  
  // Remove overlapping matches (keep the first/outermost one)
  const filteredMatches: typeof allMatches = [];
  let lastEnd = 0;
  for (const match of allMatches) {
    if (match.index >= lastEnd) {
      filteredMatches.push(match);
      lastEnd = match.end;
    }
  }
  
  // Process each match in order (use filteredMatches to avoid duplicates)
  for (const item of filteredMatches) {
    const content = item.match;
    
    switch (item.type) {
      // Tables - preserve as HTML block with proper Gutenberg wrapper
      case 'table': {
        blocks += `<!-- wp:table -->\n<figure class="wp-block-table">${content}</figure>\n<!-- /wp:table -->\n\n`;
        break;
      }
      // Direct answer box - preserve as HTML block
      case 'direct-answer': {
        blocks += `<!-- wp:html -->\n${content}\n<!-- /wp:html -->\n\n`;
        break;
      }
      // FAQ Accordion - preserve as HTML block (details/summary)
      case 'details': {
        blocks += `<!-- wp:html -->\n${content}\n<!-- /wp:html -->\n\n`;
        break;
      }
      case 'h2': {
        const headingContent = content.match(/<h2[^>]*>(.*?)<\/h2>/is)?.[1] || '';
        blocks += `<!-- wp:heading -->\n<h2 class="wp-block-heading">${headingContent}</h2>\n<!-- /wp:heading -->\n\n`;
        break;
      }
      case 'h3': {
        const headingContent = content.match(/<h3[^>]*>(.*?)<\/h3>/is)?.[1] || '';
        blocks += `<!-- wp:heading {"level":3} -->\n<h3 class="wp-block-heading">${headingContent}</h3>\n<!-- /wp:heading -->\n\n`;
        break;
      }
      case 'h4': {
        const headingContent = content.match(/<h4[^>]*>(.*?)<\/h4>/is)?.[1] || '';
        blocks += `<!-- wp:heading {"level":4} -->\n<h4 class="wp-block-heading">${headingContent}</h4>\n<!-- /wp:heading -->\n\n`;
        break;
      }
      case 'h5': {
        const headingContent = content.match(/<h5[^>]*>(.*?)<\/h5>/is)?.[1] || '';
        blocks += `<!-- wp:heading {"level":5} -->\n<h5 class="wp-block-heading">${headingContent}</h5>\n<!-- /wp:heading -->\n\n`;
        break;
      }
      case 'h6': {
        const headingContent = content.match(/<h6[^>]*>(.*?)<\/h6>/is)?.[1] || '';
        blocks += `<!-- wp:heading {"level":6} -->\n<h6 class="wp-block-heading">${headingContent}</h6>\n<!-- /wp:heading -->\n\n`;
        break;
      }
      // Affiliate display blocks - preserve complete HTML with inline styles
      case 'affiliate-box':
      case 'affiliate-cta':
      case 'affiliate-grid':
      case 'affiliate-table': {
        // These are custom HTML blocks with inline styles that work in WordPress
        blocks += `<!-- wp:html -->\n${content}\n<!-- /wp:html -->\n\n`;
        break;
      }
      case 'figure': {
        const figureMatch = content.match(/<figure[^>]*>(\s*)<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*\/?>\s*(?:<figcaption[^>]*>(.*?)<\/figcaption>)?\s*<\/figure>/is);
        if (figureMatch) {
          const [, , src, alt, caption] = figureMatch;
          if (caption) {
            blocks += `<!-- wp:image -->\n<figure class="wp-block-image"><img src="${src}" alt="${alt}"/><figcaption class="wp-element-caption">${caption}</figcaption></figure>\n<!-- /wp:image -->\n\n`;
          } else {
            blocks += `<!-- wp:image -->\n<figure class="wp-block-image"><img src="${src}" alt="${alt}"/></figure>\n<!-- /wp:image -->\n\n`;
          }
        }
        break;
      }
      case 'img': {
        // Only process if not already part of a figure
        if (!content.includes('wp-block-image')) {
          const imgMatch = content.match(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*\/?>/i);
          if (imgMatch) {
            const [, src, alt] = imgMatch;
            blocks += `<!-- wp:image -->\n<figure class="wp-block-image"><img src="${src}" alt="${alt}"/></figure>\n<!-- /wp:image -->\n\n`;
          }
        }
        break;
      }
      case 'ul': {
        const listContent = content.match(/<ul[^>]*>(.*?)<\/ul>/is)?.[1] || '';
        blocks += `<!-- wp:list -->\n<ul>${listContent}</ul>\n<!-- /wp:list -->\n\n`;
        break;
      }
      case 'ol': {
        const listContent = content.match(/<ol[^>]*>(.*?)<\/ol>/is)?.[1] || '';
        blocks += `<!-- wp:list {"ordered":true} -->\n<ol>${listContent}</ol>\n<!-- /wp:list -->\n\n`;
        break;
      }
      case 'blockquote': {
        const quoteContent = content.match(/<blockquote[^>]*>(.*?)<\/blockquote>/is)?.[1] || '';
        blocks += `<!-- wp:quote -->\n<blockquote class="wp-block-quote">${quoteContent}</blockquote>\n<!-- /wp:quote -->\n\n`;
        break;
      }
      case 'pre': {
        const codeContent = content.match(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/is)?.[1] || '';
        if (codeContent) {
          blocks += `<!-- wp:code -->\n<pre class="wp-block-code"><code>${codeContent}</code></pre>\n<!-- /wp:code -->\n\n`;
        }
        break;
      }
      case 'p': {
        const paragraphContent = content.match(/<p[^>]*>(.*?)<\/p>/is)?.[1] || '';
        if (paragraphContent.trim()) {
          blocks += `<!-- wp:paragraph -->\n<p>${paragraphContent}</p>\n<!-- /wp:paragraph -->\n\n`;
        }
        break;
      }
    }
  }

  return blocks;
}

/**
 * Upload image to WordPress media library
 */
async function uploadImageToWordPress(
  config: WordPressConfig,
  imageUrl: string,
  alt: string = 'Featured Image'
): Promise<number | null> {
  const { siteUrl, username, applicationPassword } = config;
  
  try {
    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error('Failed to fetch image:', imageUrl);
      return null;
    }
    
    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();
    
    // Get filename from URL or generate one
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1].split('?')[0] || `image-${Date.now()}.jpg`;
    
    // Upload to WordPress media library
    const apiUrl = `${siteUrl}/wp-json/wp/v2/media`;
    const auth = Buffer.from(`${username}:${applicationPassword}`).toString('base64');
    
    const uploadResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': imageBlob.type || 'image/jpeg',
      },
      body: imageBuffer,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      console.error('Failed to upload image to WordPress:', errorData);
      return null;
    }

    const media = await uploadResponse.json();
    
    // Update alt text if needed
    if (alt && media.id) {
      await fetch(`${siteUrl}/wp-json/wp/v2/media/${media.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify({
          alt_text: alt,
        }),
      });
    }
    
    return media.id;
  } catch (error) {
    console.error('Error uploading image to WordPress:', error);
    return null;
  }
}

/**
 * Convert tag names to tag IDs, creating tags if they don't exist
 */
async function convertTagNamesToIds(
  config: WordPressConfig,
  tagNames: string[]
): Promise<number[]> {
  const { siteUrl, username, applicationPassword } = config;
  const auth = Buffer.from(`${username}:${applicationPassword}`).toString('base64');
  const tagIds: number[] = [];
  
  for (const tagName of tagNames) {
    if (!tagName || !tagName.trim()) continue;
    
    const trimmedName = tagName.trim();
    
    try {
      // First, search for existing tag
      const searchUrl = `${siteUrl}/wp-json/wp/v2/tags?search=${encodeURIComponent(trimmedName)}`;
      const searchResponse = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      });

      if (searchResponse.ok) {
        const existingTags = await searchResponse.json();
        const exactMatch = existingTags.find(
          (tag: any) => tag.name.toLowerCase() === trimmedName.toLowerCase()
        );
        
        if (exactMatch) {
          tagIds.push(exactMatch.id);
          continue;
        }
      }
      
      // Tag doesn't exist, create it
      const createUrl = `${siteUrl}/wp-json/wp/v2/tags`;
      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify({
          name: trimmedName,
        }),
      });

      if (createResponse.ok) {
        const newTag = await createResponse.json();
        tagIds.push(newTag.id);
      } else {
        console.error(`Failed to create tag "${trimmedName}":`, await createResponse.text());
      }
    } catch (error) {
      console.error(`Error processing tag "${trimmedName}":`, error);
    }
  }
  
  return tagIds;
}

export async function publishToWordPress(
  config: WordPressConfig,
  article: PublishArticleOptions
): Promise<WordPressPost> {
  const { siteUrl, username, applicationPassword } = config;
  
  // WordPress REST API endpoint
  const apiUrl = `${siteUrl}/wp-json/wp/v2/posts`;
  
  // Basic authentication header
  const auth = Buffer.from(`${username}:${applicationPassword}`).toString('base64');
  
  try {
    let featuredMediaId: number | undefined;
    
    // Upload featured image if provided
    if (article.featuredImageUrl) {
      console.log('Uploading featured image:', article.featuredImageUrl);
      const mediaId = await uploadImageToWordPress(
        config,
        article.featuredImageUrl,
        article.title // Use title as alt text
      );
      
      if (mediaId) {
        featuredMediaId = mediaId;
        console.log('Featured image uploaded with ID:', mediaId);
      }
    }
    
    // Convert content to Gutenberg blocks if requested (default: yes)
    const useGutenberg = article.useGutenberg !== false; // Default to true
    const content = useGutenberg 
      ? convertHTMLToGutenbergBlocks(article.content)
      : article.content;
    
    // Convert tag names to tag IDs
    let tagIds: number[] = [];
    if (article.tags && article.tags.length > 0) {
      // Separate string tags from numeric tags
      const stringTags = article.tags.filter(tag => typeof tag === 'string') as string[];
      const numericTags = article.tags.filter(tag => typeof tag === 'number') as number[];
      
      // Convert string tags to IDs
      if (stringTags.length > 0) {
        console.log('Converting tag names to IDs:', stringTags);
        const convertedIds = await convertTagNamesToIds(config, stringTags);
        console.log('Converted tag IDs:', convertedIds);
        tagIds.push(...convertedIds);
      }
      
      // Add numeric tags (already IDs)
      if (numericTags.length > 0) {
        tagIds.push(...numericTags);
      }
    }
    
    // Generate slug from focus keyword (fallback to title if no keyword)
    let slug = '';
    if (article.focusKeyword) {
      slug = article.focusKeyword
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    } else {
      // Fallback to title if no focus keyword
      slug = article.title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    
    // Prepare post data
    const postData: any = {
      title: article.title,
      content: content,
      excerpt: article.excerpt,
      status: article.status || 'publish',
      slug: slug, // Use focus keyword as slug
      categories: article.categories || [],
      tags: tagIds, // Use converted tag IDs
      featured_media: featuredMediaId, // Set featured image
    };
    
    // Add meta fields for both Yoast and RankMath compatibility
    // KRITIEK: Meta fields moeten als TOP-LEVEL properties worden verstuurd voor WordPress REST API
    if (article.seoTitle || article.seoDescription || article.focusKeyword) {
      postData.meta = {};
      
      // Yoast SEO meta fields - VOLLEDIG bewaren
      if (article.seoTitle) {
        postData.meta._yoast_wpseo_title = article.seoTitle;
        // Also set in yoast_head_json for compatibility
        if (!postData.yoast_head_json) postData.yoast_head_json = {};
        postData.yoast_head_json.title = article.seoTitle;
      }
      if (article.seoDescription) {
        postData.meta._yoast_wpseo_metadesc = article.seoDescription;
        // Also set in yoast_head_json for compatibility
        if (!postData.yoast_head_json) postData.yoast_head_json = {};
        postData.yoast_head_json.description = article.seoDescription;
      }
      if (article.focusKeyword) {
        postData.meta._yoast_wpseo_focuskw = article.focusKeyword;
        // Also set in yoast_head_json for compatibility
        if (!postData.yoast_head_json) postData.yoast_head_json = {};
        postData.yoast_head_json.focus_keyphrase = article.focusKeyword;
      }
      
      // RankMath SEO meta fields - VOLLEDIG bewaren
      if (article.seoTitle) {
        postData.meta.rank_math_title = article.seoTitle;
      }
      if (article.seoDescription) {
        postData.meta.rank_math_description = article.seoDescription;
      }
      if (article.focusKeyword) {
        postData.meta.rank_math_focus_keyword = article.focusKeyword;
      }
      
      // Additional meta fields for better compatibility
      if (article.seoDescription) {
        // Set excerpt as fallback for meta description
        postData.excerpt = article.seoDescription;
      }
    }
    
    // Log what we're sending for debugging
    console.log('📤 WordPress post data:', {
      title: postData.title,
      slug: postData.slug,
      hasContent: !!postData.content,
      contentLength: postData.content?.length,
      excerpt: postData.excerpt?.substring(0, 100),
      hasMeta: !!postData.meta,
      metaFields: postData.meta ? Object.keys(postData.meta) : [],
      seoTitle: article.seoTitle,
      seoDescription: article.seoDescription?.substring(0, 100),
      focusKeyword: article.focusKeyword,
    });
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Check for specific WordPress errors and provide helpful messages
      if (response.status === 500 && errorData?.data?.error?.message) {
        const errorMsg = errorData.data.error.message;
        
        // Memory exhaustion error
        if (errorMsg.includes('Allowed memory size') || errorMsg.includes('exhausted')) {
          throw new Error(
            'WordPress heeft onvoldoende geheugen om dit artikel te publiceren. ' +
            'Dit gebeurt vaak door plugins zoals "Table of Contents". ' +
            'Vraag je WordPress beheerder om het memory_limit te verhogen naar 256M of hoger in wp-config.php, ' +
            'of schakel tijdelijk de "Easy Table of Contents" plugin uit.'
          );
        }
      }
      
      throw new Error(`WordPress API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const post = await response.json();
    
    return {
      id: post.id,
      link: post.link,
      status: post.status,
    };
  } catch (error) {
    console.error('Error publishing to WordPress:', error);
    throw error;
  }
}

export async function updateWordPressPost(
  config: WordPressConfig,
  postId: number,
  updates: Partial<PublishArticleOptions>
): Promise<WordPressPost> {
  const { siteUrl, username, applicationPassword } = config;
  
  const apiUrl = `${siteUrl}/wp-json/wp/v2/posts/${postId}`;
  const auth = Buffer.from(`${username}:${applicationPassword}`).toString('base64');
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`);
    }

    const post = await response.json();
    
    return {
      id: post.id,
      link: post.link,
      status: post.status,
    };
  } catch (error) {
    console.error('Error updating WordPress post:', error);
    throw error;
  }
}

export async function fetchWordPressCategories(
  config: WordPressConfig
): Promise<Array<{ id: number; name: string; slug: string }>> {
  const { siteUrl, username, applicationPassword } = config;
  const apiUrl = `${siteUrl}/wp-json/wp/v2/categories?per_page=100`;
  const auth = Buffer.from(`${username}:${applicationPassword}`).toString('base64');
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch WordPress categories:', response.status);
      return [];
    }

    const categories = await response.json();
    return categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
    }));
  } catch (error) {
    console.error('Error fetching WordPress categories:', error);
    return [];
  }
}

export async function verifyWordPressConnection(
  config: WordPressConfig
): Promise<boolean> {
  const { siteUrl, username, applicationPassword } = config;
  
  // First, verify WordPress REST API is available
  try {
    const rootResponse = await fetch(`${siteUrl}/wp-json`, {
      method: 'GET',
      headers: {
        'User-Agent': 'WritgoAI Bot/1.0',
      },
    });

    if (!rootResponse.ok) {
      console.error('WordPress REST API niet bereikbaar');
      return false;
    }

    const rootData = await rootResponse.json();
    
    // Check if it's actually WordPress
    if (!rootData.name || !rootData.name.toLowerCase().includes('wordpress') && !rootData.namespaces) {
      console.error('Dit lijkt geen WordPress site te zijn');
      return false;
    }
  } catch (error) {
    console.error('WordPress REST API verificatie mislukt:', error);
    return false;
  }
  
  // Now verify credentials
  const apiUrl = `${siteUrl}/wp-json/wp/v2/users/me`;
  const auth = Buffer.from(`${username}:${applicationPassword}`).toString('base64');
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      console.error('WordPress authenticatie mislukt. Status:', response.status);
      return false;
    }

    // Verify response contains user data
    const userData = await response.json();
    if (!userData.id || !userData.name) {
      console.error('Ongeldige gebruikersgegevens ontvangen');
      return false;
    }

    console.log('WordPress verbinding succesvol geverifieerd voor gebruiker:', userData.name);
    return true;
  } catch (error) {
    console.error('Error verifying WordPress connection:', error);
    return false;
  }
}

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

interface SitemapData {
  urls: SitemapUrl[];
  totalPages: number;
  categories: string[];
  tags: string[];
  recentPosts: string[];
}

export async function fetchSitemap(siteUrl: string): Promise<SitemapData> {
  try {
    // Common sitemap locations
    const sitemapUrls = [
      `${siteUrl}/sitemap.xml`,
      `${siteUrl}/sitemap_index.xml`,
      `${siteUrl}/wp-sitemap.xml`,
      `${siteUrl}/post-sitemap.xml`,
    ];

    let sitemapContent = '';
    let foundSitemap = false;

    // Try each sitemap URL
    for (const url of sitemapUrls) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'WritgoAI Bot/1.0',
          },
        });

        if (response.ok) {
          sitemapContent = await response.text();
          foundSitemap = true;
          console.log(`Found sitemap at: ${url}`);
          break;
        }
      } catch (err) {
        // Try next URL
        continue;
      }
    }

    if (!foundSitemap || !sitemapContent) {
      throw new Error('Geen sitemap gevonden');
    }

    // Parse sitemap XML
    const urls: SitemapUrl[] = [];
    const urlRegex = /<url>\s*<loc>(.*?)<\/loc>(?:\s*<lastmod>(.*?)<\/lastmod>)?(?:\s*<changefreq>(.*?)<\/changefreq>)?(?:\s*<priority>(.*?)<\/priority>)?/g;
    
    let match;
    while ((match = urlRegex.exec(sitemapContent)) !== null) {
      urls.push({
        loc: match[1],
        lastmod: match[2] || undefined,
        changefreq: match[3] || undefined,
        priority: match[4] || undefined,
      });
    }

    // If this is a sitemap index, fetch individual sitemaps
    if (sitemapContent.includes('<sitemapindex')) {
      const sitemapIndexRegex = /<sitemap>\s*<loc>(.*?)<\/loc>/g;
      const childSitemaps: string[] = [];
      
      let indexMatch;
      while ((indexMatch = sitemapIndexRegex.exec(sitemapContent)) !== null) {
        childSitemaps.push(indexMatch[1]);
      }

      // Fetch each child sitemap (limit to first 5 to avoid overload)
      for (const childUrl of childSitemaps.slice(0, 5)) {
        try {
          const response = await fetch(childUrl, {
            headers: {
              'User-Agent': 'WritgoAI Bot/1.0',
            },
          });

          if (response.ok) {
            const childContent = await response.text();
            let childMatch;
            while ((childMatch = urlRegex.exec(childContent)) !== null) {
              urls.push({
                loc: childMatch[1],
                lastmod: childMatch[2] || undefined,
                changefreq: childMatch[3] || undefined,
                priority: childMatch[4] || undefined,
              });
            }
          }
        } catch (err) {
          console.error(`Error fetching child sitemap: ${childUrl}`, err);
        }
      }
    }

    // Extract categories and tags from URLs
    const categories = new Set<string>();
    const tags = new Set<string>();
    const recentPosts: string[] = [];

    urls.forEach((url) => {
      // Extract categories from URL patterns like /category/name/
      const categoryMatch = url.loc.match(/\/category\/([^\/]+)/);
      if (categoryMatch) {
        categories.add(categoryMatch[1].replace(/-/g, ' '));
      }

      // Extract tags from URL patterns like /tag/name/
      const tagMatch = url.loc.match(/\/tag\/([^\/]+)/);
      if (tagMatch) {
        tags.add(tagMatch[1].replace(/-/g, ' '));
      }

      // Collect recent posts (filter out category/tag pages)
      if (!url.loc.includes('/category/') && 
          !url.loc.includes('/tag/') && 
          !url.loc.includes('/author/') &&
          url.loc !== siteUrl &&
          url.loc !== `${siteUrl}/`) {
        recentPosts.push(url.loc);
      }
    });

    // Sort by lastmod and take 20 most recent
    const sortedPosts = urls
      .filter(url => url.lastmod && 
        !url.loc.includes('/category/') && 
        !url.loc.includes('/tag/'))
      .sort((a, b) => {
        const dateA = new Date(a.lastmod || 0);
        const dateB = new Date(b.lastmod || 0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 20)
      .map(url => url.loc);

    return {
      urls,
      totalPages: urls.length,
      categories: Array.from(categories),
      tags: Array.from(tags),
      recentPosts: sortedPosts.length > 0 ? sortedPosts : recentPosts.slice(0, 20),
    };

  } catch (error) {
    console.error('Error fetching sitemap:', error);
    throw new Error(`Kon sitemap niet ophalen: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
  }
}
