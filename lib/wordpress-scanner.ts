/**
 * WordPress Scanner - Haalt alle bestaande content op via sitemap en WP REST API
 */

export interface ExistingContent {
  id: string | number;
  title: string;
  slug: string;
  url: string;
  type: 'post' | 'page' | 'product' | 'category';
  excerpt?: string;
  categories?: string[];
  tags?: string[];
  publishedAt?: string;
}

export interface ScanResult {
  success: boolean;
  websiteUrl: string;
  niche: string;
  existingContent: ExistingContent[];
  existingTopics: string[]; // Normalized topics for duplicate detection
  categories: string[];
  tags: string[];
  totalPosts: number;
  totalPages: number;
  hasWordPress: boolean;
  sitemapFound: boolean;
  apiAvailable: boolean;
  suggestedTopics: string[];
  error?: string;
}

// Fetch sitemap and extract URLs
async function fetchSitemap(baseUrl: string): Promise<{ urls: string[]; titles: string[] }> {
  const urls: string[] = [];
  const titles: string[] = [];
  
  const sitemapUrls = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/wp-sitemap.xml`,
    `${baseUrl}/post-sitemap.xml`,
    `${baseUrl}/page-sitemap.xml`,
    `${baseUrl}/wp-sitemap-posts-post-1.xml`,
    `${baseUrl}/wp-sitemap-posts-page-1.xml`,
  ];
  
  for (const sitemapUrl of sitemapUrls) {
    try {
      const response = await fetch(sitemapUrl, {
        headers: { 'User-Agent': 'WritGo Content Scanner/1.0' },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const text = await response.text();
        
        // Check for nested sitemaps
        if (text.includes('<sitemap>')) {
          const nestedUrls = text.matchAll(/<loc>([^<]+\.xml)<\/loc>/g);
          for (const match of nestedUrls) {
            try {
              const nestedResponse = await fetch(match[1], {
                headers: { 'User-Agent': 'WritGo Content Scanner/1.0' },
                signal: AbortSignal.timeout(10000)
              });
              if (nestedResponse.ok) {
                const nestedText = await nestedResponse.text();
                const locMatches = nestedText.matchAll(/<loc>([^<]+)<\/loc>/g);
                for (const locMatch of locMatches) {
                  if (!locMatch[1].endsWith('.xml')) {
                    urls.push(locMatch[1]);
                  }
                }
              }
            } catch (e) {
              // Ignore nested sitemap errors
            }
          }
        }
        
        // Extract direct URLs
        const locMatches = text.matchAll(/<loc>([^<]+)<\/loc>/g);
        for (const match of locMatches) {
          const url = match[1];
          if (!url.includes('sitemap') && !url.endsWith('.xml')) {
            urls.push(url);
          }
        }
      }
    } catch (e) {
      // Continue to next sitemap URL
    }
  }
  
  // Extract titles from URLs
  for (const url of urls) {
    try {
      const path = new URL(url).pathname;
      const slug = path.split('/').filter(Boolean).pop() || '';
      const title = slug
        .replace(/-/g, ' ')
        .replace(/\d{4}\/\d{2}\/\d{2}/g, '') // Remove date patterns
        .replace(/\d+/g, '')
        .trim();
      if (title && title.length > 2) {
        titles.push(title);
      }
    } catch (e) {
      // Ignore invalid URLs
    }
  }
  
  return { urls: [...new Set(urls)], titles: [...new Set(titles)] };
}

// Fetch WordPress posts via REST API
async function fetchWordPressPosts(baseUrl: string): Promise<ExistingContent[]> {
  const content: ExistingContent[] = [];
  const perPage = 100;
  
  // Try different API endpoints
  const apiEndpoints = [
    `${baseUrl}/wp-json/wp/v2/posts`,
    `${baseUrl}/?rest_route=/wp/v2/posts`,
  ];
  
  for (const endpoint of apiEndpoints) {
    try {
      let page = 1;
      let hasMore = true;
      
      while (hasMore && page <= 10) { // Max 10 pages (1000 posts)
        const response = await fetch(`${endpoint}?per_page=${perPage}&page=${page}&_fields=id,title,slug,link,excerpt,categories,tags,date`, {
          headers: { 
            'User-Agent': 'WritGo Content Scanner/1.0',
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(15000)
        });
        
        if (!response.ok) {
          if (page === 1) break; // Try next endpoint
          hasMore = false;
          continue;
        }
        
        const posts = await response.json();
        
        if (!Array.isArray(posts) || posts.length === 0) {
          hasMore = false;
          continue;
        }
        
        for (const post of posts) {
          content.push({
            id: post.id,
            title: post.title?.rendered || '',
            slug: post.slug || '',
            url: post.link || '',
            type: 'post',
            excerpt: post.excerpt?.rendered?.replace(/<[^>]+>/g, '').trim() || '',
            categories: post.categories || [],
            tags: post.tags || [],
            publishedAt: post.date
          });
        }
        
        page++;
        
        // Check if there are more pages
        const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
        hasMore = page <= totalPages;
      }
      
      if (content.length > 0) break; // Found posts, no need to try other endpoints
      
    } catch (e) {
      console.log(`API endpoint ${endpoint} failed:`, e);
      // Continue to next endpoint
    }
  }
  
  return content;
}

// Fetch WordPress pages via REST API
async function fetchWordPressPages(baseUrl: string): Promise<ExistingContent[]> {
  const content: ExistingContent[] = [];
  
  const apiEndpoints = [
    `${baseUrl}/wp-json/wp/v2/pages`,
    `${baseUrl}/?rest_route=/wp/v2/pages`,
  ];
  
  for (const endpoint of apiEndpoints) {
    try {
      const response = await fetch(`${endpoint}?per_page=100&_fields=id,title,slug,link,excerpt`, {
        headers: { 
          'User-Agent': 'WritGo Content Scanner/1.0',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(15000)
      });
      
      if (!response.ok) continue;
      
      const pages = await response.json();
      
      if (!Array.isArray(pages)) continue;
      
      for (const page of pages) {
        content.push({
          id: page.id,
          title: page.title?.rendered || '',
          slug: page.slug || '',
          url: page.link || '',
          type: 'page',
          excerpt: page.excerpt?.rendered?.replace(/<[^>]+>/g, '').trim() || ''
        });
      }
      
      if (content.length > 0) break;
      
    } catch (e) {
      // Continue to next endpoint
    }
  }
  
  return content;
}

// Fetch WordPress categories
async function fetchWordPressCategories(baseUrl: string): Promise<string[]> {
  const categories: string[] = [];
  
  const apiEndpoints = [
    `${baseUrl}/wp-json/wp/v2/categories`,
    `${baseUrl}/?rest_route=/wp/v2/categories`,
  ];
  
  for (const endpoint of apiEndpoints) {
    try {
      const response = await fetch(`${endpoint}?per_page=100`, {
        headers: { 'User-Agent': 'WritGo Content Scanner/1.0' },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) continue;
      
      const cats = await response.json();
      
      if (Array.isArray(cats)) {
        for (const cat of cats) {
          if (cat.name && cat.name !== 'Uncategorized' && cat.name !== 'Geen categorie') {
            categories.push(cat.name);
          }
        }
      }
      
      if (categories.length > 0) break;
      
    } catch (e) {
      // Continue
    }
  }
  
  return categories;
}

// Fetch WordPress tags
async function fetchWordPressTags(baseUrl: string): Promise<string[]> {
  const tags: string[] = [];
  
  const apiEndpoints = [
    `${baseUrl}/wp-json/wp/v2/tags`,
    `${baseUrl}/?rest_route=/wp/v2/tags`,
  ];
  
  for (const endpoint of apiEndpoints) {
    try {
      const response = await fetch(`${endpoint}?per_page=100`, {
        headers: { 'User-Agent': 'WritGo Content Scanner/1.0' },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) continue;
      
      const tagList = await response.json();
      
      if (Array.isArray(tagList)) {
        for (const tag of tagList) {
          if (tag.name) {
            tags.push(tag.name);
          }
        }
      }
      
      if (tags.length > 0) break;
      
    } catch (e) {
      // Continue
    }
  }
  
  return tags;
}

// Detect niche from content
function detectNiche(content: ExistingContent[], categories: string[]): string {
  const allText = [
    ...content.map(c => c.title.toLowerCase()),
    ...content.map(c => (c.excerpt || '').toLowerCase()),
    ...categories.map(c => c.toLowerCase())
  ].join(' ');
  
  const nicheKeywords: Record<string, string[]> = {
    'Technologie': ['laptop', 'computer', 'smartphone', 'tech', 'software', 'hardware', 'gaming', 'monitor', 'tablet', 'iphone', 'android', 'samsung', 'apple', 'gadget'],
    'Gezondheid & Fitness': ['gezondheid', 'fitness', 'sport', 'voeding', 'dieet', 'workout', 'wellness', 'yoga', 'afvallen', 'supplement', 'vitaminen', 'gezond'],
    'Financiën': ['geld', 'beleggen', 'sparen', 'financieel', 'hypotheek', 'verzekering', 'pensioen', 'crypto', 'bitcoin', 'investeren', 'budget', 'lening'],
    'Reizen': ['reizen', 'vakantie', 'hotel', 'vlucht', 'bestemming', 'travel', 'stedentrip', 'reis', 'strand', 'camping'],
    'Huis & Tuin': ['huis', 'tuin', 'wonen', 'interieur', 'meubel', 'keuken', 'badkamer', 'verbouwen', 'plant', 'bloem', 'decoratie'],
    'Mode & Beauty': ['mode', 'kleding', 'beauty', 'makeup', 'skincare', 'fashion', 'schoenen', 'tas', 'accessoires', 'parfum'],
    'Food & Recepten': ['recept', 'koken', 'eten', 'food', 'restaurant', 'bakken', 'ingrediënt', 'gerecht', 'diner', 'lunch'],
    'Kinderen & Gezin': ['kinderen', 'baby', 'ouders', 'gezin', 'opvoeding', 'zwanger', 'speelgoed', 'kind', 'peuter', 'kleuter'],
    'Auto & Mobiliteit': ['auto', 'motor', 'fiets', 'elektrisch', 'transport', 'voertuig', 'rijden', 'lease', 'occasion'],
    'Huisdieren': ['hond', 'kat', 'huisdier', 'voer', 'dier', 'puppy', 'kitten', 'vogel', 'konijn', 'hamster'],
    'Business & Marketing': ['marketing', 'business', 'ondernemen', 'sales', 'startup', 'seo', 'social media', 'online', 'webshop', 'e-commerce'],
    'Hobby & DIY': ['hobby', 'diy', 'knutselen', 'fotografie', 'muziek', 'kunst', 'creatief', 'handwerk', 'borduren', 'naaien'],
  };
  
  let bestNiche = 'Algemeen';
  let maxScore = 0;
  
  for (const [niche, keywords] of Object.entries(nicheKeywords)) {
    const score = keywords.filter(kw => allText.includes(kw)).length;
    if (score > maxScore) {
      maxScore = score;
      bestNiche = niche;
    }
  }
  
  return bestNiche;
}

// Normalize topics for duplicate detection
function normalizeTopics(content: ExistingContent[]): string[] {
  const topics = new Set<string>();
  
  for (const item of content) {
    // Add title (cleaned)
    const cleanTitle = item.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleanTitle.length > 3) {
      topics.add(cleanTitle);
    }
    
    // Add slug
    if (item.slug) {
      topics.add(item.slug.replace(/-/g, ' ').toLowerCase().trim());
    }
  }
  
  return [...topics];
}

// Suggest topics based on niche
function suggestTopics(niche: string, existingCategories: string[]): string[] {
  const topicSuggestions: Record<string, string[]> = {
    'Technologie': [
      'Beste laptops', 'Smartphone vergelijking', 'Gaming accessoires', 
      'Monitor koopgids', 'Tablet reviews', 'Smart home producten',
      'Beste koptelefoons', 'Webcam test', 'Gaming muizen vergelijking'
    ],
    'Gezondheid & Fitness': [
      'Beste fitness trackers', 'Eiwitpoeder vergelijking', 'Yoga matten test',
      'Hardloopschoenen reviews', 'Hometrainers vergelijking', 'Vitaminen gids'
    ],
    'Financiën': [
      'Beste spaarrekening', 'Kredietkaart vergelijking', 'Beleggen beginners',
      'Cryptocurrency gids', 'Budgetten apps', 'Verzekeringen vergelijken'
    ],
    'Huis & Tuin': [
      'Beste stofzuiger', 'Robotstofzuiger vergelijking', 'Tuinmeubelen test',
      'Airconditioner reviews', 'Keukenmachines vergelijking', 'Matras koopgids'
    ],
    'Reizen': [
      'Beste koffers', 'Reisaccessoires', 'Camping uitrusting',
      'Reisboekingen tips', 'Stedentrips Europa', 'Vakantiebestemmingen'
    ],
    'Mode & Beauty': [
      'Beste gezichtscrème', 'Parfum reviews', 'Sneakers vergelijking',
      'Zonnebrillen test', 'Skincare routine', 'Haarproducten review'
    ],
    'Food & Recepten': [
      'Airfryer vergelijking', 'Keukenapparaten test', 'Blender reviews',
      'Koffiezetapparaten', 'Pannensets vergelijking', 'BBQ koopgids'
    ],
    'Kinderen & Gezin': [
      'Beste kinderwagen', 'Speelgoed reviews', 'Kinderfiets vergelijking',
      'Autostoeltjes test', 'Babyfoon reviews', 'Luiers vergelijking'
    ],
    'Auto & Mobiliteit': [
      'Elektrische auto vergelijking', 'E-bike reviews', 'Autobanden test',
      'Navigatiesystemen', 'Dashcams vergelijking', 'Autowas producten'
    ],
    'Huisdieren': [
      'Beste hondenvoer', 'Kattenvoer vergelijking', 'Hondenmanden test',
      'Kattenbakken reviews', 'Hondenspeelgoed', 'Huisdier verzorging'
    ],
    'Business & Marketing': [
      'SEO tools vergelijking', 'Email marketing software', 'CRM systemen test',
      'Website builders', 'Social media tools', 'Boekhoudsoftware'
    ],
    'Hobby & DIY': [
      'Beste camera', 'Drone vergelijking', 'Naaimachine test',
      'Gereedschap sets', 'Elektrisch gereedschap', 'Crafting supplies'
    ],
    'Algemeen': [
      'Product reviews', 'Vergelijkingen', 'Koopgidsen',
      'Tips & tricks', 'How-to guides', 'Beste producten'
    ]
  };
  
  const suggestions = topicSuggestions[niche] || topicSuggestions['Algemeen'];
  
  // Add category-based suggestions
  const categoryTopics = existingCategories
    .filter(cat => cat.length > 3)
    .map(cat => `${cat} tips`)
    .slice(0, 5);
  
  return [...suggestions, ...categoryTopics];
}

// Main scan function
export async function scanWordPressSite(websiteUrl: string): Promise<ScanResult> {
  // Normalize URL
  let baseUrl = websiteUrl.trim();
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }
  baseUrl = baseUrl.replace(/\/$/, '');
  
  const result: ScanResult = {
    success: false,
    websiteUrl: baseUrl,
    niche: 'Algemeen',
    existingContent: [],
    existingTopics: [],
    categories: [],
    tags: [],
    totalPosts: 0,
    totalPages: 0,
    hasWordPress: false,
    sitemapFound: false,
    apiAvailable: false,
    suggestedTopics: []
  };
  
  try {
    // 1. Fetch sitemap
    console.log('[Scanner] Fetching sitemap...');
    const { urls, titles } = await fetchSitemap(baseUrl);
    result.sitemapFound = urls.length > 0;
    console.log(`[Scanner] Found ${urls.length} URLs in sitemap`);
    
    // 2. Fetch WordPress posts via API
    console.log('[Scanner] Fetching WordPress posts...');
    const posts = await fetchWordPressPosts(baseUrl);
    result.apiAvailable = posts.length > 0;
    result.hasWordPress = posts.length > 0 || result.sitemapFound;
    result.totalPosts = posts.length;
    console.log(`[Scanner] Found ${posts.length} posts via API`);
    
    // 3. Fetch WordPress pages
    console.log('[Scanner] Fetching WordPress pages...');
    const pages = await fetchWordPressPages(baseUrl);
    result.totalPages = pages.length;
    console.log(`[Scanner] Found ${pages.length} pages via API`);
    
    // 4. Fetch categories and tags
    console.log('[Scanner] Fetching categories and tags...');
    result.categories = await fetchWordPressCategories(baseUrl);
    result.tags = await fetchWordPressTags(baseUrl);
    console.log(`[Scanner] Found ${result.categories.length} categories, ${result.tags.length} tags`);
    
    // 5. Combine all content
    result.existingContent = [...posts, ...pages];
    
    // Add sitemap URLs that might not be in API
    for (const url of urls) {
      const exists = result.existingContent.some(c => c.url === url);
      if (!exists) {
        const path = new URL(url).pathname;
        const slug = path.split('/').filter(Boolean).pop() || '';
        result.existingContent.push({
          id: `sitemap-${slug}`,
          title: slug.replace(/-/g, ' '),
          slug,
          url,
          type: 'post'
        });
      }
    }
    
    // 6. Detect niche
    result.niche = detectNiche(result.existingContent, result.categories);
    console.log(`[Scanner] Detected niche: ${result.niche}`);
    
    // 7. Normalize topics for duplicate detection
    result.existingTopics = normalizeTopics(result.existingContent);
    console.log(`[Scanner] Normalized ${result.existingTopics.length} existing topics`);
    
    // 8. Suggest topics
    result.suggestedTopics = suggestTopics(result.niche, result.categories);
    
    result.success = true;
    
  } catch (error: any) {
    console.error('[Scanner] Error:', error);
    result.error = error.message;
  }
  
  return result;
}

// Check if a topic already exists (for duplicate detection)
export function topicExists(newTopic: string, existingTopics: string[]): boolean {
  const normalized = newTopic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Direct match
  if (existingTopics.includes(normalized)) {
    return true;
  }
  
  // Fuzzy match (80% similarity)
  for (const existing of existingTopics) {
    const similarity = calculateSimilarity(normalized, existing);
    if (similarity > 0.8) {
      return true;
    }
  }
  
  return false;
}

// Calculate string similarity (Jaccard index on words)
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(' '));
  const words2 = new Set(str2.split(' '));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}
