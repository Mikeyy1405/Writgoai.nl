/**
 * WordPress Website Analyzer Service
 * 
 * Automatically analyzes WordPress websites to:
 * - Detect the niche/industry
 * - Extract primary keywords
 * - Identify target audience
 * - Analyze existing content
 * - Identify content gaps
 * - Prioritize topics for content creation
 * 
 * This service enables fully automated topical authority map generation
 * without manual niche input.
 */

import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-utils';
import { WordPressSitemapParser } from '@/lib/wordpress-sitemap-parser';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface WebsiteAnalysisResult {
  niche: string;
  nicheDescription: string;
  subNiches: string[];
  primaryKeywords: string[];
  targetAudience: string;
  contentThemes: string[];
  existingTopics: string[];
  existingArticleCount: number;
  websiteUrl: string;
  language: string;
  contentGaps: ContentGap[];
}

export interface ContentGap {
  topic: string;
  description: string;
  priority: number; // 1-10
  estimatedArticles: number;
  keywords: string[];
}

export interface NicheDetectionData {
  homepage: {
    title: string;
    description: string;
    content: string;
    keywords: string[];
  };
  articles: Array<{
    title: string;
    topics: string[];
    keywords: string[];
    excerpt?: string;
  }>;
  categories: string[];
}

// ============================================================================
// Main Analysis Function
// ============================================================================

/**
 * Analyze a WordPress website and detect its niche automatically
 * This is the main entry point for automated website analysis
 */
export async function analyzeWebsite(projectId: string): Promise<WebsiteAnalysisResult> {
  console.log(`[Website Analyzer] Starting analysis for project: ${projectId}`);

  // Step 1: Get project data
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      websiteUrl: true,
      description: true,
    },
  });

  if (!project || !project.websiteUrl) {
    throw new Error('Project not found or no website URL configured');
  }

  console.log(`[Website Analyzer] Analyzing: ${project.websiteUrl}`);

  // Step 2: Fetch homepage data
  const homepageData = await fetchHomepageData(project.websiteUrl);
  
  // Step 3: Parse WordPress sitemap to get existing content
  let sitemapData;
  try {
    sitemapData = await WordPressSitemapParser.parse(project.websiteUrl);
    
    // Cache the sitemap data for future use
    await WordPressSitemapParser.cache(projectId, sitemapData.articles);
    
    console.log(`[Website Analyzer] Found ${sitemapData.articles.length} existing articles`);
  } catch (error: any) {
    console.warn(`[Website Analyzer] Could not parse sitemap: ${error.message}`);
    sitemapData = {
      totalUrls: 0,
      articles: [],
      categories: [],
      lastScanned: new Date(),
    };
  }

  // Step 4: Prepare data for AI niche detection
  const nicheData: NicheDetectionData = {
    homepage: homepageData,
    articles: sitemapData.articles.map(a => ({
      title: a.title,
      topics: a.topics || [],
      keywords: a.keywords || [],
      excerpt: a.excerpt,
    })),
    categories: sitemapData.categories,
  };

  // Step 5: Use AI to detect niche
  const nicheAnalysis = await detectNiche(nicheData);

  // Step 6: Extract primary keywords
  const primaryKeywords = await extractKeywords(
    nicheData,
    nicheAnalysis.niche
  );

  // Step 7: Analyze content gaps
  const contentGaps = await analyzeContentGaps(
    nicheAnalysis.niche,
    nicheAnalysis.subNiches,
    sitemapData.articles
  );

  // Step 8: Build final result
  const result: WebsiteAnalysisResult = {
    niche: nicheAnalysis.niche,
    nicheDescription: nicheAnalysis.description,
    subNiches: nicheAnalysis.subNiches,
    primaryKeywords,
    targetAudience: nicheAnalysis.targetAudience,
    contentThemes: nicheAnalysis.contentThemes,
    existingTopics: extractExistingTopics(sitemapData.articles),
    existingArticleCount: sitemapData.articles.length,
    websiteUrl: project.websiteUrl,
    language: nicheAnalysis.language,
    contentGaps,
  };

  console.log(`[Website Analyzer] ✅ Analysis complete!`);
  console.log(`[Website Analyzer] Detected niche: ${result.niche}`);
  console.log(`[Website Analyzer] Sub-niches: ${result.subNiches.join(', ')}`);
  console.log(`[Website Analyzer] Existing articles: ${result.existingArticleCount}`);
  console.log(`[Website Analyzer] Content gaps identified: ${contentGaps.length}`);

  return result;
}

// ============================================================================
// Homepage Data Fetching
// ============================================================================

/**
 * Fetch and parse homepage data
 */
async function fetchHomepageData(websiteUrl: string): Promise<NicheDetectionData['homepage']> {
  try {
    const response = await fetch(websiteUrl, {
      headers: {
        'User-Agent': 'WritGoAI Website Analyzer/1.0',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch homepage: ${response.status}`);
    }

    const html = await response.text();

    // Extract title
    let title = '';
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }

    // Extract meta description
    let description = '';
    const descMatch = html.match(/name="description"\s+content="([^"]+)"/i);
    if (descMatch) {
      description = descMatch[1].trim();
    }

    const ogDescMatch = html.match(/property="og:description"\s+content="([^"]+)"/i);
    if (ogDescMatch && !description) {
      description = ogDescMatch[1].trim();
    }

    // Extract meta keywords
    const keywords: string[] = [];
    const keywordsMatch = html.match(/name="keywords"\s+content="([^"]+)"/i);
    if (keywordsMatch) {
      keywords.push(...keywordsMatch[1].split(',').map(k => k.trim()));
    }

    // Extract main content (remove HTML tags, get first 2000 chars)
    let content = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 2000);

    return {
      title,
      description,
      content,
      keywords,
    };
  } catch (error: any) {
    console.error(`[Website Analyzer] Error fetching homepage: ${error.message}`);
    throw new Error(`Could not fetch homepage data: ${error.message}`);
  }
}

// ============================================================================
// AI-Powered Niche Detection
// ============================================================================

/**
 * Use AI to detect the website's niche based on homepage and existing content
 */
async function detectNiche(data: NicheDetectionData): Promise<{
  niche: string;
  description: string;
  subNiches: string[];
  targetAudience: string;
  contentThemes: string[];
  language: string;
}> {
  console.log('[Website Analyzer] Detecting niche with AI...');

  const prompt = `Je bent een SEO expert die WordPress websites analyseert om de niche te detecteren.

HOMEPAGE DATA:
Titel: ${data.homepage.title}
Beschrijving: ${data.homepage.description}
Keywords: ${data.homepage.keywords.join(', ')}

Content preview:
${data.homepage.content.substring(0, 1000)}

BESTAANDE ARTIKELEN (eerste 20):
${data.articles.slice(0, 20).map((a, i) => 
  `${i + 1}. "${a.title}"
     Topics: ${a.topics.join(', ') || 'geen'}
     Keywords: ${a.keywords.join(', ') || 'geen'}`
).join('\n\n')}

CATEGORIEËN:
${data.categories.join(', ')}

Analyseer deze website en detecteer:
1. **Hoofdniche**: De primaire niche/industrie van de website (kort en bondig, bijv. "Piano lessen en muziekonderwijs", "WordPress tutorials", "Fitness coaching")
2. **Beschrijving**: Een uitgebreide beschrijving van wat de website precies doet
3. **Sub-niches**: 5-10 specifieke sub-niches binnen de hoofdniche
4. **Doelgroep**: Wie is de primaire doelgroep?
5. **Content thema's**: De belangrijkste thema's die op de website worden behandeld
6. **Taal**: De primaire taal van de website (nl of en)

BELANGRIJK:
- De niche moet SPECIFIEK zijn, niet te breed (bijv. "Piano lessen" ipv "Muziek")
- Sub-niches moeten actionable content topics zijn
- Baseer je antwoord op de WERKELIJKE content, niet op wat je denkt dat het zou kunnen zijn

Geef je antwoord als JSON:
{
  "niche": "Specifieke niche in 2-5 woorden",
  "description": "Uitgebreide beschrijving van de niche en wat de website doet",
  "subNiches": [
    "Sub-niche 1",
    "Sub-niche 2",
    "Sub-niche 3"
  ],
  "targetAudience": "Beschrijving van de doelgroep",
  "contentThemes": [
    "Thema 1",
    "Thema 2",
    "Thema 3"
  ],
  "language": "nl of en"
}

Geef ALLEEN JSON terug, geen extra tekst.`;

  const aiResponse = await chatCompletion(
    [
      {
        role: 'system',
        content: 'Je bent een SEO expert die WordPress websites analyseert en de niche detecteert in gestructureerd JSON formaat.'
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
  const parsed = parseAIResponse(aiResponse);

  return {
    niche: parsed.niche || 'Algemene content',
    description: parsed.description || '',
    subNiches: parsed.subNiches || [],
    targetAudience: parsed.targetAudience || 'Algemeen publiek',
    contentThemes: parsed.contentThemes || [],
    language: parsed.language || 'nl',
  };
}

// ============================================================================
// Keyword Extraction
// ============================================================================

/**
 * Extract primary keywords from the website
 */
async function extractKeywords(
  data: NicheDetectionData,
  niche: string
): Promise<string[]> {
  console.log('[Website Analyzer] Extracting primary keywords...');

  // Collect all keywords from homepage and articles
  const allKeywords = new Set<string>();

  // Add homepage keywords
  data.homepage.keywords.forEach(k => allKeywords.add(k.toLowerCase()));

  // Add article keywords
  data.articles.forEach(article => {
    article.keywords.forEach(k => allKeywords.add(k.toLowerCase()));
  });

  // Extract keywords from titles
  data.articles.forEach(article => {
    const titleWords = article.title
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3);
    titleWords.forEach(w => allKeywords.add(w));
  });

  // Convert to array and use AI to select most relevant
  const keywordList = Array.from(allKeywords);

  if (keywordList.length === 0) {
    // If no keywords found, generate from niche
    return [niche.toLowerCase()];
  }

  const prompt = `Je bent een SEO expert die primary keywords identificeert.

Niche: ${niche}

Gevonden keywords:
${keywordList.slice(0, 100).join(', ')}

Selecteer de 10-15 BELANGRIJKSTE keywords die het beste de niche representeren.

Geef je antwoord als JSON:
{
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Geef ALLEEN JSON terug, geen extra tekst.`;

  try {
    const aiResponse = await chatCompletion(
      [
        {
          role: 'system',
          content: 'Je bent een SEO expert die primary keywords selecteert in JSON formaat.'
        },
        { role: 'user', content: prompt }
      ],
      {
        model: 'claude-sonnet-4-20250514',
        temperature: 0.3,
        max_tokens: 500,
      }
    );

    const parsed = parseAIResponse(aiResponse);
    return parsed.keywords || keywordList.slice(0, 15);
  } catch (error) {
    console.warn('[Website Analyzer] Could not use AI for keyword extraction, using top keywords');
    return keywordList.slice(0, 15);
  }
}

// ============================================================================
// Content Gap Analysis
// ============================================================================

/**
 * Analyze content gaps and identify missing topics
 */
async function analyzeContentGaps(
  niche: string,
  subNiches: string[],
  existingArticles: any[]
): Promise<ContentGap[]> {
  console.log('[Website Analyzer] Analyzing content gaps...');

  const existingTopics = extractExistingTopics(existingArticles);

  const prompt = `Je bent een SEO expert die content gaps identificeert.

Niche: ${niche}

Sub-niches:
${subNiches.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Bestaande topics (eerste 50):
${existingTopics.slice(0, 50).map((t, i) => `${i + 1}. ${t}`).join('\n')}

Identificeer 8-12 BELANGRIJKE content gaps - topics die ONTBREKEN en die essentieel zijn voor complete topical authority in deze niche.

Voor elk content gap, geef:
1. Topic titel
2. Waarom dit belangrijk is
3. Priority (1-10, waar 10 = meest urgent)
4. Geschat aantal artikelen nodig om dit gap te vullen
5. Relevante keywords

Focus op:
- Fundamentele topics die nog niet gedekt zijn
- High-value commercial topics
- Trending onderwerpen in de niche
- Comparison/review content
- How-to/tutorial content

Geef je antwoord als JSON:
{
  "gaps": [
    {
      "topic": "Topic titel",
      "description": "Waarom dit belangrijk is",
      "priority": 8,
      "estimatedArticles": 25,
      "keywords": ["keyword1", "keyword2"]
    }
  ]
}

Geef ALLEEN JSON terug, geen extra tekst.`;

  try {
    const aiResponse = await chatCompletion(
      [
        {
          role: 'system',
          content: 'Je bent een SEO expert die content gaps identificeert in JSON formaat.'
        },
        { role: 'user', content: prompt }
      ],
      {
        model: 'claude-sonnet-4-20250514',
        temperature: 0.5,
        max_tokens: 3000,
      }
    );

    const parsed = parseAIResponse(aiResponse);
    return parsed.gaps || [];
  } catch (error) {
    console.error('[Website Analyzer] Error analyzing content gaps:', error);
    return [];
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract unique topics from existing articles
 */
function extractExistingTopics(articles: any[]): string[] {
  const topics = new Set<string>();

  articles.forEach(article => {
    // Add title as topic
    topics.add(article.title);

    // Add categories/topics
    if (article.topics) {
      article.topics.forEach((t: string) => topics.add(t));
    }
  });

  return Array.from(topics);
}

/**
 * Parse AI response with multiple strategies
 */
function parseAIResponse(response: string): any {
  try {
    // Strategy 1: Direct parse
    try {
      return JSON.parse(response);
    } catch {
      // Strategy 2: Remove markdown
      const cleaned = response
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      return JSON.parse(cleaned);
    }
  } catch (error) {
    console.error('[Website Analyzer] Failed to parse AI response');
    console.error('Response was:', response);
    throw new Error('Failed to parse AI response');
  }
}

/**
 * Prioritize topics based on gaps and existing content
 */
export function prioritizeTopics(
  contentGaps: ContentGap[],
  existingTopics: string[]
): ContentGap[] {
  // Sort by priority (high to low)
  const sorted = [...contentGaps].sort((a, b) => b.priority - a.priority);

  // Filter out topics that are too similar to existing ones
  const filtered = sorted.filter(gap => {
    const gapLower = gap.topic.toLowerCase();
    return !existingTopics.some(existing => 
      existing.toLowerCase().includes(gapLower) ||
      gapLower.includes(existing.toLowerCase())
    );
  });

  return filtered;
}

// ============================================================================
// Exports
// ============================================================================

export const WordPressWebsiteAnalyzer = {
  analyze: analyzeWebsite,
  detectNiche,
  extractKeywords,
  analyzeContentGaps,
  prioritizeTopics,
};
