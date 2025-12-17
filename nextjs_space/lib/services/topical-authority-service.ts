/**
 * Topical Authority Map Generator Service
 * 
 * Generates complete topical authority maps with 400-500 articles
 * Implements the pillar-cluster model for SEO dominance
 * 
 * Core Features:
 * - Automatic pillar topic generation (5-10 pillars)
 * - Subtopic generation (40-50 per pillar)
 * - Article planning (8-10 per subtopic = 400-500 total)
 * - DataForSEO integration for keyword metrics
 * - WordPress sitemap analysis for content gaps
 * - Intelligent internal link suggestions
 * - Priority scoring and scheduling
 */

import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-utils';
import { DataForSEO } from '@/lib/dataforseo-api';
import { WordPressSitemapParser } from '@/lib/wordpress-sitemap-parser';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface GenerateMapOptions {
  projectId: string;
  clientId: string;
  niche: string;
  description?: string;
  targetArticles?: number; // Default: 400-500
  location?: string;
  language?: string;
  useDataForSEO?: boolean;
  analyzeExistingContent?: boolean;
}

export interface PillarTopicData {
  title: string;
  description: string;
  keywords: string[];
  priority: number; // 1-10
  searchVolume?: number;
  difficulty?: number;
}

export interface SubtopicData {
  title: string;
  description: string;
  keywords: string[];
  priority: number;
  searchVolume?: number;
  difficulty?: number;
}

export interface ArticleData {
  title: string;
  description: string;
  keywords: string[];
  focusKeyword: string;
  contentType: 'pillar' | 'cluster' | 'supporting';
  articleType: 'blog-post' | 'how-to' | 'guide' | 'listicle' | 'review' | 'comparison';
  priority: number;
  wordCountTarget: number;
  searchIntent: 'informational' | 'commercial' | 'navigational' | 'transactional';
  searchVolume?: number;
  difficulty?: number;
}

export interface TopicalAuthorityMapResult {
  mapId: string;
  pillars: Array<{
    pillarId: string;
    title: string;
    subtopics: Array<{
      subtopicId: string;
      title: string;
      articles: Array<{
        articleId: string;
        title: string;
      }>;
    }>;
  }>;
  totalArticles: number;
  estimatedTimeToComplete: string; // e.g., "12 months at 1 article/day"
}

// ============================================================================
// Main Generation Function
// ============================================================================

/**
 * Generate a complete topical authority map
 * This is the main entry point for creating a 400-500 article content strategy
 */
export async function generateTopicalAuthorityMap(
  options: GenerateMapOptions
): Promise<TopicalAuthorityMapResult> {
  const {
    projectId,
    clientId,
    niche,
    description,
    targetArticles = 450,
    location = 'Netherlands',
    language = 'nl',
    useDataForSEO = true,
    analyzeExistingContent = true,
  } = options;

  console.log(`[Topical Authority] Starting map generation for niche: ${niche}`);
  console.log(`[Topical Authority] Target: ${targetArticles} articles`);

  // Step 1: Get project data
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  // Step 2: Analyze existing WordPress content (if enabled)
  let existingContent: any[] = [];
  if (analyzeExistingContent && project.websiteUrl) {
    console.log('[Topical Authority] Analyzing existing WordPress content...');
    try {
      const sitemapResult = await WordPressSitemapParser.parse(project.websiteUrl);
      existingContent = sitemapResult.articles;
      
      // Cache the sitemap data
      await WordPressSitemapParser.cache(projectId, existingContent);
      
      console.log(`[Topical Authority] Found ${existingContent.length} existing articles`);
    } catch (error: any) {
      console.warn(`[Topical Authority] Could not analyze existing content: ${error.message}`);
    }
  }

  // Step 3: Create the map
  const map = await prisma.topicalAuthorityMap.create({
    data: {
      projectId,
      clientId,
      niche,
      description: description || `Complete topical authority map for ${niche}`,
      totalArticlesTarget: targetArticles,
      status: 'draft',
    },
  });

  console.log(`[Topical Authority] Created map: ${map.id}`);

  // Step 4: Generate pillar topics (5-10 pillars)
  const targetPillars = Math.ceil(targetArticles / 50); // ~50 articles per pillar
  const pillars = await generatePillarTopics(
    map.id,
    niche,
    targetPillars,
    existingContent,
    { useDataForSEO, location, language }
  );

  console.log(`[Topical Authority] Generated ${pillars.length} pillar topics`);

  // Step 5: For each pillar, generate subtopics and articles
  const result: TopicalAuthorityMapResult = {
    mapId: map.id,
    pillars: [],
    totalArticles: 0,
    estimatedTimeToComplete: '',
  };

  for (let i = 0; i < pillars.length; i++) {
    const pillar = pillars[i];
    
    console.log(`[Topical Authority] Processing pillar ${i + 1}/${pillars.length}: ${pillar.title}`);
    
    // Calculate articles per pillar
    const articlesForThisPillar = Math.floor(targetArticles / pillars.length);
    
    // Generate subtopics (40-50 per pillar)
    const subtopics = await generateSubtopics(
      pillar.id,
      pillar.title,
      niche,
      articlesForThisPillar,
      existingContent,
      { useDataForSEO, location, language }
    );

    console.log(`[Topical Authority]   Generated ${subtopics.length} subtopics`);

    // For each subtopic, generate articles (8-10 per subtopic)
    const pillarResult: any = {
      pillarId: pillar.id,
      title: pillar.title,
      subtopics: [],
    };

    for (let j = 0; j < subtopics.length; j++) {
      const subtopic = subtopics[j];
      
      const articlesForThisSubtopic = Math.floor(articlesForThisPillar / subtopics.length);
      
      const articles = await generateArticles(
        map.id,
        pillar.id,
        subtopic.id,
        subtopic.title,
        niche,
        articlesForThisSubtopic,
        { useDataForSEO, location, language }
      );

      pillarResult.subtopics.push({
        subtopicId: subtopic.id,
        title: subtopic.title,
        articles: articles.map(a => ({
          articleId: a.id,
          title: a.title,
        })),
      });

      result.totalArticles += articles.length;
    }

    result.pillars.push(pillarResult);
  }

  // Step 6: Update map status
  await prisma.topicalAuthorityMap.update({
    where: { id: map.id },
    data: {
      status: 'active',
      totalArticlesPlanned: result.totalArticles,
    },
  });

  // Calculate estimated time
  const daysAt1PerDay = result.totalArticles;
  const months = Math.ceil(daysAt1PerDay / 30);
  result.estimatedTimeToComplete = `${months} months at 1 article/day (${daysAt1PerDay} days total)`;

  console.log(`[Topical Authority] ✅ Map generation complete!`);
  console.log(`[Topical Authority] Total articles: ${result.totalArticles}`);
  console.log(`[Topical Authority] Estimated time: ${result.estimatedTimeToComplete}`);

  return result;
}

// ============================================================================
// Pillar Topic Generation
// ============================================================================

/**
 * Generate 5-10 pillar topics for the niche
 * These are the core topics that form the foundation
 */
async function generatePillarTopics(
  mapId: string,
  niche: string,
  targetCount: number,
  existingContent: any[],
  options: { useDataForSEO: boolean; location: string; language: string }
): Promise<any[]> {
  console.log(`[Topical Authority] Generating ${targetCount} pillar topics...`);

  const existingSummary = existingContent.length > 0
    ? `Bestaande content:\n${existingContent.slice(0, 20).map(a => `- ${a.title}`).join('\n')}`
    : 'Geen bestaande content gevonden.';

  const prompt = `Je bent een SEO expert die topical authority maps creëert.

Niche: ${niche}

${existingSummary}

Genereer ${targetCount} HOOFDPILAREN (pillar topics) voor deze niche. Dit zijn de BREDE, FUNDAMENTELE onderwerpen die de basis vormen van topical authority.

Elke pillar moet:
1. Breed genoeg zijn voor 40-50 subtopics
2. Kernconcepten van de niche dekken
3. Hoge zoekvolume potentie hebben
4. Geschikt zijn voor een comprehensive pillar page (3000-5000 woorden)

BELANGRIJK:
- Dit zijn de HOOFDPILAREN, niet de subtopics
- Denk aan brede categorieën zoals "Basics", "Advanced Techniques", "Tools & Resources", etc.
- Elke pillar moet ruimte bieden voor 40-50 subtopics en 400-500 artikelen

Geef je antwoord als JSON:
{
  "pillars": [
    {
      "title": "Pillar Topic Title",
      "description": "Uitgebreide beschrijving van wat dit pillar topic dekt",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "priority": 8
    }
  ]
}

Genereer EXACT ${targetCount} pillars.
Priority: 1-10 (10 = hoogste prioriteit)
Geef ALLEEN JSON terug, geen extra tekst.`;

  const aiResponse = await chatCompletion(
    [
      {
        role: 'system',
        content: 'Je bent een SEO expert die gestructureerde topical authority maps genereert in JSON formaat.'
      },
      { role: 'user', content: prompt }
    ],
    {
      model: 'claude-sonnet-4-20250514',
      temperature: 0.7,
      max_tokens: 4000,
    }
  );

  // Parse AI response
  const parsed = parseAIResponse(aiResponse);
  const pillarData: PillarTopicData[] = parsed.pillars || [];

  if (pillarData.length === 0) {
    throw new Error('Failed to generate pillar topics');
  }

  // Enrich with DataForSEO data
  if (options.useDataForSEO && DataForSEO.isConfigured()) {
    console.log('[Topical Authority] Enriching pillars with DataForSEO data...');
    
    const allKeywords = pillarData.flatMap(p => p.keywords);
    const keywordData = await DataForSEO.getBatchKeywordData({
      keywords: allKeywords,
      location: options.location,
      language: options.language,
    });

    // Map keyword data to pillars
    for (const pillar of pillarData) {
      const mainKeyword = pillar.keywords[0];
      const data = keywordData.find(kd => kd.keyword === mainKeyword);
      if (data) {
        pillar.searchVolume = data.searchVolume;
        pillar.difficulty = data.difficulty;
      }
    }
  }

  // Save to database
  const createdPillars = [];
  for (let i = 0; i < pillarData.length; i++) {
    const pillar = pillarData[i];
    const slug = generateSlug(pillar.title);

    const created = await prisma.pillarTopic.create({
      data: {
        mapId,
        title: pillar.title,
        slug,
        description: pillar.description,
        keywords: pillar.keywords,
        searchVolume: pillar.searchVolume || 0,
        difficulty: pillar.difficulty || 50,
        priority: pillar.priority,
        order: i + 1,
        status: 'planned',
      },
    });

    createdPillars.push(created);
  }

  return createdPillars;
}

// ============================================================================
// Subtopic Generation
// ============================================================================

/**
 * Generate 40-50 subtopics for a pillar
 */
async function generateSubtopics(
  pillarId: string,
  pillarTitle: string,
  niche: string,
  targetArticles: number,
  existingContent: any[],
  options: { useDataForSEO: boolean; location: string; language: string }
): Promise<any[]> {
  // Calculate target subtopics (each subtopic will have 8-10 articles)
  const targetSubtopics = Math.ceil(targetArticles / 9); // ~9 articles per subtopic
  
  console.log(`[Topical Authority]   Generating ${targetSubtopics} subtopics for: ${pillarTitle}`);

  const prompt = `Je bent een SEO expert die topical authority maps creëert.

Niche: ${niche}
Pillar Topic: ${pillarTitle}

Genereer ${targetSubtopics} SUBTOPICS voor dit pillar topic. Dit zijn SPECIFIEKERE onderwerpen die het pillar ondersteunen.

Elke subtopic moet:
1. Direct gerelateerd zijn aan het pillar topic
2. Specifiek genoeg zijn voor 8-10 gedetailleerde artikelen
3. Een unieke invalshoek hebben
4. Zoekintentie hebben (informational, commercial, navigational, transactional)

Voorbeelden van goede subtopics (voor pillar "SEO Basics"):
- "On-Page SEO Technieken"
- "Technical SEO Fundamentals"
- "Keyword Research Methods"
- "Link Building Strategies"

Geef je antwoord als JSON:
{
  "subtopics": [
    {
      "title": "Subtopic Title",
      "description": "Beschrijving van wat dit subtopic dekt",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "priority": 7
    }
  ]
}

Genereer EXACT ${targetSubtopics} subtopics.
Priority: 1-10 (10 = hoogste prioriteit)
Geef ALLEEN JSON terug, geen extra tekst.`;

  const aiResponse = await chatCompletion(
    [
      {
        role: 'system',
        content: 'Je bent een SEO expert die gestructureerde topical authority maps genereert in JSON formaat.'
      },
      { role: 'user', content: prompt }
    ],
    {
      model: 'claude-sonnet-4-20250514',
      temperature: 0.7,
      max_tokens: 6000,
    }
  );

  const parsed = parseAIResponse(aiResponse);
  const subtopicData: SubtopicData[] = parsed.subtopics || [];

  if (subtopicData.length === 0) {
    throw new Error(`Failed to generate subtopics for pillar: ${pillarTitle}`);
  }

  // Enrich with DataForSEO data
  if (options.useDataForSEO && DataForSEO.isConfigured()) {
    const allKeywords = subtopicData.flatMap(s => s.keywords);
    const keywordData = await DataForSEO.getBatchKeywordData({
      keywords: allKeywords.slice(0, 100), // Limit to avoid API overload
      location: options.location,
      language: options.language,
    });

    for (const subtopic of subtopicData) {
      const mainKeyword = subtopic.keywords[0];
      const data = keywordData.find(kd => kd.keyword === mainKeyword);
      if (data) {
        subtopic.searchVolume = data.searchVolume;
        subtopic.difficulty = data.difficulty;
      }
    }
  }

  // Save to database
  const createdSubtopics = [];
  for (let i = 0; i < subtopicData.length; i++) {
    const subtopic = subtopicData[i];
    const slug = generateSlug(subtopic.title);

    const created = await prisma.subtopic.create({
      data: {
        pillarId,
        title: subtopic.title,
        slug,
        description: subtopic.description,
        keywords: subtopic.keywords,
        searchVolume: subtopic.searchVolume || 0,
        difficulty: subtopic.difficulty || 50,
        priority: subtopic.priority,
        order: i + 1,
        status: 'planned',
      },
    });

    createdSubtopics.push(created);
  }

  return createdSubtopics;
}

// ============================================================================
// Article Generation
// ============================================================================

/**
 * Generate 8-10 articles for a subtopic
 */
async function generateArticles(
  mapId: string,
  pillarId: string,
  subtopicId: string,
  subtopicTitle: string,
  niche: string,
  targetCount: number,
  options: { useDataForSEO: boolean; location: string; language: string }
): Promise<any[]> {
  console.log(`[Topical Authority]     Generating ${targetCount} articles for: ${subtopicTitle}`);

  const prompt = `Je bent een SEO expert die content plans creëert.

Niche: ${niche}
Subtopic: ${subtopicTitle}

Genereer ${targetCount} SPECIFIEKE ARTIKELEN voor dit subtopic.

Elk artikel moet:
1. Een unieke invalshoek hebben
2. Een duidelijke zoekintentie hebben
3. Praktisch en actionable zijn
4. Geschikt zijn voor 1500-2500 woorden (cluster content)

Varieer de artikel types:
- blog-post (70%)
- how-to (15%)
- listicle (10%)
- review/comparison (5%)

Geef je antwoord als JSON:
{
  "articles": [
    {
      "title": "Artikel Titel",
      "description": "Korte beschrijving",
      "keywords": ["keyword1", "keyword2"],
      "focusKeyword": "main keyword",
      "articleType": "blog-post|how-to|listicle|review|comparison",
      "searchIntent": "informational|commercial|navigational|transactional",
      "priority": 6,
      "wordCountTarget": 1800
    }
  ]
}

Genereer EXACT ${targetCount} artikelen.
Priority: 1-10 (10 = hoogste prioriteit)
Geef ALLEEN JSON terug, geen extra tekst.`;

  const aiResponse = await chatCompletion(
    [
      {
        role: 'system',
        content: 'Je bent een SEO expert die gestructureerde content plans genereert in JSON formaat.'
      },
      { role: 'user', content: prompt }
    ],
    {
      model: 'claude-sonnet-4-20250514',
      temperature: 0.8,
      max_tokens: 6000,
    }
  );

  const parsed = parseAIResponse(aiResponse);
  const articleData: ArticleData[] = (parsed.articles || []).map((a: any) => ({
    ...a,
    contentType: 'cluster' as const,
  }));

  if (articleData.length === 0) {
    throw new Error(`Failed to generate articles for subtopic: ${subtopicTitle}`);
  }

  // Enrich with DataForSEO data
  if (options.useDataForSEO && DataForSEO.isConfigured()) {
    const focusKeywords = articleData.map(a => a.focusKeyword);
    const keywordData = await DataForSEO.getBatchKeywordData({
      keywords: focusKeywords.slice(0, 100),
      location: options.location,
      language: options.language,
    });

    for (const article of articleData) {
      const data = keywordData.find(kd => kd.keyword === article.focusKeyword);
      if (data) {
        article.searchVolume = data.searchVolume;
        article.difficulty = data.difficulty;
      }
    }
  }

  // Save to database
  const createdArticles = [];
  for (let i = 0; i < articleData.length; i++) {
    const article = articleData[i];
    const slug = generateSlug(article.title);

    const created = await prisma.plannedArticle.create({
      data: {
        mapId,
        pillarId,
        subtopicId,
        title: article.title,
        slug,
        description: article.description,
        keywords: article.keywords,
        focusKeyword: article.focusKeyword,
        contentType: article.contentType,
        articleType: article.articleType,
        priority: article.priority,
        wordCountTarget: article.wordCountTarget,
        searchIntent: article.searchIntent,
        order: i + 1,
        status: 'planned',
        dataForSEO: article.searchVolume || article.difficulty ? {
          searchVolume: article.searchVolume,
          difficulty: article.difficulty,
        } : {},
      },
    });

    createdArticles.push(created);
  }

  return createdArticles;
}

// ============================================================================
// Helper Functions
// ============================================================================

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
    console.error('[Topical Authority] Failed to parse AI response');
    throw new Error('Failed to parse AI response');
  }
}

/**
 * Generate URL-safe slug
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ============================================================================
// Map Retrieval & Management
// ============================================================================

/**
 * Get topical authority map with all data
 */
export async function getTopicalAuthorityMap(mapId: string): Promise<any> {
  const map = await prisma.topicalAuthorityMap.findUnique({
    where: { id: mapId },
    include: {
      pillars: {
        include: {
          subtopics: {
            include: {
              articles: {
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  return map;
}

/**
 * Get maps for a project
 */
export async function getProjectMaps(projectId: string): Promise<any[]> {
  return prisma.topicalAuthorityMap.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get articles ready for generation
 * Returns articles sorted by priority
 */
export async function getArticlesForGeneration(
  mapId: string,
  limit: number = 10
): Promise<any[]> {
  return prisma.plannedArticle.findMany({
    where: {
      mapId,
      status: 'planned',
    },
    include: {
      subtopic: true,
      pillar: true,
    },
    orderBy: [
      { priority: 'desc' },
      { order: 'asc' },
    ],
    take: limit,
  });
}

/**
 * Update article status
 */
export async function updateArticleStatus(
  articleId: string,
  status: string,
  data?: {
    savedContentId?: string;
    publishedUrl?: string;
    wordpressPostId?: number;
    generatedAt?: Date;
    publishedAt?: Date;
  }
): Promise<void> {
  await prisma.plannedArticle.update({
    where: { id: articleId },
    data: {
      status,
      ...data,
    },
  });
}

// ============================================================================
// Exports
// ============================================================================

export const TopicalAuthorityService = {
  generateMap: generateTopicalAuthorityMap,
  getMap: getTopicalAuthorityMap,
  getProjectMaps,
  getArticlesForGeneration,
  updateArticleStatus,
};
