
/**
 * Website Scraper Utility
 * Fetches and analyzes website content for the AI chat
 */

interface WebsiteContent {
  success: boolean;
  url: string;
  title?: string;
  content?: string;
  description?: string;
  images?: string[];
  links?: string[];
  error?: string;
}

/**
 * Extract clean text content from HTML
 */
function extractTextFromHtml(html: string): string {
  // Remove scripts and styles
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Limit to first 5000 characters for manageability
  return text.substring(0, 5000);
}

/**
 * Extract title from HTML
 */
function extractTitle(html: string): string | undefined {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }
  
  // Try og:title as fallback
  const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
  if (ogTitleMatch && ogTitleMatch[1]) {
    return ogTitleMatch[1].trim();
  }
  
  return undefined;
}

/**
 * Extract meta description from HTML
 */
function extractDescription(html: string): string | undefined {
  const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
  if (descMatch && descMatch[1]) {
    return descMatch[1].trim();
  }
  
  // Try og:description as fallback
  const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
  if (ogDescMatch && ogDescMatch[1]) {
    return ogDescMatch[1].trim();
  }
  
  return undefined;
}

/**
 * Extract image URLs from HTML
 */
function extractImages(html: string, baseUrl: string): string[] {
  const images: string[] = [];
  const imgRegex = /<img[^>]+src="([^">]+)"/gi;
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    let imgUrl = match[1];
    
    // Convert relative URLs to absolute
    if (imgUrl.startsWith('/')) {
      const urlObj = new URL(baseUrl);
      imgUrl = `${urlObj.protocol}//${urlObj.host}${imgUrl}`;
    } else if (!imgUrl.startsWith('http')) {
      continue; // Skip data URIs and other non-standard URLs
    }
    
    images.push(imgUrl);
    
    if (images.length >= 10) break; // Limit to 10 images
  }
  
  return images;
}

/**
 * Extract links from HTML
 */
function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const linkRegex = /<a[^>]+href="([^">]+)"/gi;
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    let linkUrl = match[1];
    
    // Convert relative URLs to absolute
    if (linkUrl.startsWith('/')) {
      const urlObj = new URL(baseUrl);
      linkUrl = `${urlObj.protocol}//${urlObj.host}${linkUrl}`;
    } else if (!linkUrl.startsWith('http')) {
      continue; // Skip anchors and other non-standard URLs
    }
    
    links.push(linkUrl);
    
    if (links.length >= 20) break; // Limit to 20 links
  }
  
  return links;
}

/**
 * Scrape website content
 */
export async function scrapeWebsite(url: string): Promise<WebsiteContent> {
  try {
    console.log('🌐 Scraping website:', url);
    
    // Validate URL
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        success: false,
        url,
        error: 'Alleen HTTP en HTTPS URLs worden ondersteund'
      };
    }
    
    // Fetch the website with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return {
        success: false,
        url,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const html = await response.text();
    
    // Extract various content
    const title = extractTitle(html);
    const description = extractDescription(html);
    const content = extractTextFromHtml(html);
    const images = extractImages(html, url);
    const links = extractLinks(html, url);
    
    console.log('✅ Website scraped successfully:', {
      title,
      contentLength: content.length,
      imagesCount: images.length,
      linksCount: links.length
    });
    
    return {
      success: true,
      url,
      title,
      description,
      content,
      images,
      links
    };
    
  } catch (error: any) {
    console.error('❌ Website scraping error:', error);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        url,
        error: 'Timeout: Website duurde te lang om te laden'
      };
    }
    
    return {
      success: false,
      url,
      error: error.message || 'Onbekende fout bij het ophalen van de website'
    };
  }
}

/**
 * Detect if message contains a website analysis request
 */
export function detectWebsiteAnalysisRequest(message: string): string | null {
  const messageLower = message.toLowerCase();
  
  // Dutch triggers
  const dutchTriggers = [
    'analyseer deze website',
    'analyseer de website',
    'analyseer website',
    'bekijk deze website',
    'bekijk de website',
    'bekijk website',
    'bezoek deze website',
    'bezoek de website',
    'bezoek website',
    'wat vind je van',
    'wat zie je op',
    'bekijk de site',
    'analyseer de site',
  ];
  
  // English triggers
  const englishTriggers = [
    'analyze this website',
    'analyze the website',
    'analyze website',
    'check this website',
    'check the website',
    'check website',
    'visit this website',
    'visit the website',
    'visit website',
    'what do you think of',
    'what do you see on',
  ];
  
  const allTriggers = [...dutchTriggers, ...englishTriggers];
  
  if (!allTriggers.some(trigger => messageLower.includes(trigger))) {
    return null;
  }
  
  // Extract URL from message
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const match = message.match(urlRegex);
  
  if (match && match[0]) {
    // Clean up URL (remove trailing punctuation)
    let url = match[0];
    url = url.replace(/[.,;:!?]+$/, '');
    return url;
  }
  
  return null;
}
