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
import { WordPressWebsiteAnalyzer, type WebsiteAnalysisResult } from './wordpress-website-analyzer';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface GenerateMapOptions {
  projectId: string;
  clientId: string;
  niche?: string; // Optional: will auto-detect if not provided
  description?: string;
  targetArticles?: number; // Default: 400-500
  location?: string;
  language?: string;
  useDataForSEO?: boolean;
  analyzeExistingContent?: boolean;
  autoAnalyze?: boolean; // If true, automatically analyze website
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
 * 
 * NEW: Can automatically detect niche from WordPress website if not provided
 */
export async function generateTopicalAuthorityMap(
  options: GenerateMapOptions
): Promise<TopicalAuthorityMapResult> {
  const {
    projectId,
    clientId,
    niche: providedNiche,
    description,
    targetArticles = 450,
    location = 'Netherlands',
    language: providedLanguage = 'nl',
    useDataForSEO = true,
    analyzeExistingContent = true,
    autoAnalyze = false,
  } = options;

  // Step 1: Get project data
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  // Step 2: Automatic website analysis (if enabled or no niche provided)
  let websiteAnalysis: WebsiteAnalysisResult | null = null;
  let niche = providedNiche;
  let language = providedLanguage;
  let existingContent: any[] = [];

  if (!niche || autoAnalyze) {
    console.log('[Topical Authority] 🔍 Starting automatic website analysis...');
    
    if (!project.websiteUrl) {
      throw new Error('No website URL configured for automatic analysis');
    }

    try {
      websiteAnalysis = await WordPressWebsiteAnalyzer.analyze(projectId);
      
      // Use detected niche if not provided
      if (!niche) {
        niche = websiteAnalysis.niche;
        console.log(`[Topical Authority] ✅ Auto-detected niche: ${niche}`);
      }
      
      // Use detected language
      language = websiteAnalysis.language;
      
      // Get existing content from analysis
      const cachedArticles = await WordPressSitemapParser.getCached(projectId);
      if (cachedArticles) {
        existingContent = cachedArticles;
      }
      
      console.log(`[Topical Authority] ✅ Website analysis complete`);
      console.log(`[Topical Authority]    - Niche: ${websiteAnalysis.niche}`);
      console.log(`[Topical Authority]    - Sub-niches: ${websiteAnalysis.subNiches.length}`);
      console.log(`[Topical Authority]    - Existing articles: ${websiteAnalysis.existingArticleCount}`);
      console.log(`[Topical Authority]    - Content gaps: ${websiteAnalysis.contentGaps.length}`);
      
    } catch (error: any) {
      console.error(`[Topical Authority] ❌ Website analysis failed: ${error.message}`);
      
      if (!niche) {
        throw new Error(`Could not auto-detect niche: ${error.message}. Please provide niche manually.`);
      }
      
      console.warn('[Topical Authority] Continuing with provided niche...');
    }
  }

  // Step 3: Fallback: Analyze existing WordPress content (if not done in auto-analysis)
  if (existingContent.length === 0 && analyzeExistingContent && project.websiteUrl) {
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

  if (!niche) {
    throw new Error('Niche is required. Either provide it manually or enable auto-analysis.');
  }

  // FIXED STRUCTURE: ALWAYS 9 pillars × 10 subtopics × 5 articles = 450
  const EXACT_STRUCTURE = {
    PILLARS: 9,
    SUBTOPICS_PER_PILLAR: 10,
    ARTICLES_PER_SUBTOPIC: 5,
    TOTAL: 450, // 9 × 10 × 5
  };

  console.log(`[Topical Authority] 🚀 Starting map generation for niche: ${niche}`);
  console.log(`[Topical Authority] EXACT Target: ${EXACT_STRUCTURE.TOTAL} articles (${EXACT_STRUCTURE.PILLARS} pillars × ${EXACT_STRUCTURE.SUBTOPICS_PER_PILLAR} subtopics × ${EXACT_STRUCTURE.ARTICLES_PER_SUBTOPIC} articles)`);

  // Step 4: Create the map
  const map = await prisma.topicalAuthorityMap.create({
    data: {
      projectId,
      clientId,
      niche,
      description: description || (websiteAnalysis 
        ? websiteAnalysis.nicheDescription 
        : `Complete topical authority map for ${niche}`),
      totalArticlesTarget: EXACT_STRUCTURE.TOTAL,
      status: 'draft',
      metadata: {
        ...(websiteAnalysis ? {
          autoDetected: true,
          subNiches: websiteAnalysis.subNiches,
          primaryKeywords: websiteAnalysis.primaryKeywords,
          targetAudience: websiteAnalysis.targetAudience,
          existingArticlesAnalyzed: websiteAnalysis.existingArticleCount,
        } : {}),
        structure: {
          pillars: EXACT_STRUCTURE.PILLARS,
          subtopicsPerPillar: EXACT_STRUCTURE.SUBTOPICS_PER_PILLAR,
          articlesPerSubtopic: EXACT_STRUCTURE.ARTICLES_PER_SUBTOPIC,
          totalArticles: EXACT_STRUCTURE.TOTAL,
        },
      },
    },
  });

  console.log(`[Topical Authority] ✅ Created map: ${map.id}`);

  // Step 5: Generate EXACTLY 9 pillar topics
  const pillars = await generatePillarTopics(
    map.id,
    niche,
    EXACT_STRUCTURE.PILLARS, // EXACT: 9 pillars
    existingContent,
    { useDataForSEO, location, language },
    websiteAnalysis
  );

  console.log(`[Topical Authority] Generated ${pillars.length} pillar topics (expected: ${EXACT_STRUCTURE.PILLARS})`);

  // VALIDATION: Ensure we have exactly 9 pillars
  if (pillars.length !== EXACT_STRUCTURE.PILLARS) {
    throw new Error(`Expected ${EXACT_STRUCTURE.PILLARS} pillars, got ${pillars.length}`);
  }

  // Step 6: For each pillar, generate EXACTLY 10 subtopics and 5 articles per subtopic
  const result: TopicalAuthorityMapResult = {
    mapId: map.id,
    pillars: [],
    totalArticles: 0,
    estimatedTimeToComplete: '',
  };

  for (let i = 0; i < pillars.length; i++) {
    const pillar = pillars[i];
    
    console.log(`[Topical Authority] Processing pillar ${i + 1}/${pillars.length}: ${pillar.title}`);
    
    // EXACT: 10 subtopics per pillar
    const subtopics = await generateSubtopics(
      pillar.id,
      pillar.title,
      niche,
      EXACT_STRUCTURE.SUBTOPICS_PER_PILLAR * EXACT_STRUCTURE.ARTICLES_PER_SUBTOPIC, // Total articles for this pillar
      existingContent,
      { useDataForSEO, location, language },
      EXACT_STRUCTURE.SUBTOPICS_PER_PILLAR // Pass exact count
    );

    console.log(`[Topical Authority]   Generated ${subtopics.length} subtopics (expected: ${EXACT_STRUCTURE.SUBTOPICS_PER_PILLAR})`);

    // VALIDATION: Ensure exactly 10 subtopics
    if (subtopics.length !== EXACT_STRUCTURE.SUBTOPICS_PER_PILLAR) {
      console.warn(`[Topical Authority] WARNING: Expected ${EXACT_STRUCTURE.SUBTOPICS_PER_PILLAR} subtopics, got ${subtopics.length}`);
    }

    const pillarResult: any = {
      pillarId: pillar.id,
      title: pillar.title,
      subtopics: [],
    };

    // For each subtopic, generate EXACTLY 5 articles
    for (let j = 0; j < subtopics.length; j++) {
      const subtopic = subtopics[j];
      
      // EXACT: 5 articles per subtopic
      const articles = await generateArticles(
        map.id,
        pillar.id,
        subtopic.id,
        subtopic.title,
        niche,
        EXACT_STRUCTURE.ARTICLES_PER_SUBTOPIC, // EXACT: 5 articles
        { useDataForSEO, location, language }
      );

      console.log(`[Topical Authority]     Subtopic ${j + 1}: ${articles.length} articles (expected: ${EXACT_STRUCTURE.ARTICLES_PER_SUBTOPIC})`);

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
  options: { useDataForSEO: boolean; location: string; language: string },
  websiteAnalysis?: WebsiteAnalysisResult | null
): Promise<any[]> {
  console.log(`[Topical Authority] Generating ${targetCount} pillar topics...`);

  const existingSummary = existingContent.length > 0
    ? `Bestaande content:\n${existingContent.slice(0, 20).map(a => `- ${a.title}`).join('\n')}`
    : 'Geen bestaande content gevonden.';

  const websiteContext = websiteAnalysis ? `
WEBSITE ANALYSE:
Sub-niches: ${websiteAnalysis.subNiches.join(', ')}
Content thema's: ${websiteAnalysis.contentThemes.join(', ')}
Doelgroep: ${websiteAnalysis.targetAudience}
Bestaande artikelen: ${websiteAnalysis.existingArticleCount}

CONTENT GAPS (focus hierop):
${websiteAnalysis.contentGaps.map(gap => 
  `- ${gap.topic} (Priority: ${gap.priority}/10, ~${gap.estimatedArticles} artikelen nodig)`
).join('\n')}
` : '';

  const prompt = `Je bent een SEO expert die topical authority maps creëert.

Niche: ${niche}
${websiteContext}
${existingSummary}

Genereer ${targetCount} HOOFDPILAREN (pillar topics) voor deze niche. Dit zijn de BREDE, FUNDAMENTELE onderwerpen die de basis vormen van topical authority.
${websiteAnalysis ? '\nFOCUS: Richt je vooral op de geïdentificeerde content gaps en ontbrekende topics.' : ''}

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

  const aiResponse = await chatCompletion({
    model: 'claude-sonnet-4-20250514',
    messages: [
      {
        role: 'system',
        content: 'Je bent een SEO expert die gestructureerde topical authority maps genereert in JSON formaat.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  // Extract content from AI response
  const content = aiResponse.choices?.[0]?.message?.content || '';
  if (!content) {
    throw new Error('No content in AI response');
  }

  // Parse AI response
  const parsed = parseAIResponse(content);
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
  options: { useDataForSEO: boolean; location: string; language: string },
  exactCount?: number // NEW: Force exact subtopic count
): Promise<any[]> {
  // FIXED: Use exactCount if provided, otherwise calculate
  const targetSubtopics = exactCount || Math.ceil(targetArticles / 9);
  
  console.log(`[Topical Authority]   Generating EXACTLY ${targetSubtopics} subtopics for: ${pillarTitle}`);

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

  const aiResponse = await chatCompletion({
    model: 'claude-sonnet-4-20250514',
    messages: [
      {
        role: 'system',
        content: 'Je bent een SEO expert die gestructureerde topical authority maps genereert in JSON formaat.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 6000,
  });

  const content = aiResponse.choices?.[0]?.message?.content || '';
  if (!content) {
    throw new Error('No content in AI response');
  }

  const parsed = parseAIResponse(content);
  let subtopicData: SubtopicData[] = parsed.subtopics || [];

  if (subtopicData.length === 0) {
    throw new Error(`Failed to generate subtopics for pillar: ${pillarTitle}`);
  }

  // FIXED: Ensure EXACTLY targetSubtopics count
  if (subtopicData.length < targetSubtopics) {
    console.warn(`[Topical Authority] AI generated ${subtopicData.length} subtopics, padding to ${targetSubtopics}`);
    // Pad with generic subtopics
    while (subtopicData.length < targetSubtopics) {
      subtopicData.push({
        title: `${pillarTitle} - Topic ${subtopicData.length + 1}`,
        description: `Additional subtopic for ${pillarTitle}`,
        keywords: [pillarTitle.toLowerCase()],
        priority: 5,
      });
    }
  } else if (subtopicData.length > targetSubtopics) {
    console.warn(`[Topical Authority] AI generated ${subtopicData.length} subtopics, trimming to ${targetSubtopics}`);
    // Trim excess subtopics
    subtopicData = subtopicData.slice(0, targetSubtopics);
  }

  console.log(`[Topical Authority]   ✅ Validated: ${subtopicData.length} subtopics (target: ${targetSubtopics})`);

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

  const aiResponse = await chatCompletion({
    model: 'claude-sonnet-4-20250514',
    messages: [
      {
        role: 'system',
        content: 'Je bent een SEO expert die gestructureerde content plans genereert in JSON formaat.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.8,
    max_tokens: 6000,
  });

  const content = aiResponse.choices?.[0]?.message?.content || '';
  if (!content) {
    throw new Error('No content in AI response');
  }

  const parsed = parseAIResponse(content);
  let articleData: ArticleData[] = (parsed.articles || []).map((a: any) => ({
    ...a,
    contentType: 'cluster' as const,
  }));

  if (articleData.length === 0) {
    throw new Error(`Failed to generate articles for subtopic: ${subtopicTitle}`);
  }

  // FIXED: Ensure EXACTLY targetCount articles
  if (articleData.length < targetCount) {
    console.warn(`[Topical Authority] AI generated ${articleData.length} articles, padding to ${targetCount}`);
    // Pad with generic articles
    while (articleData.length < targetCount) {
      articleData.push({
        title: `${subtopicTitle} - Article ${articleData.length + 1}`,
        description: `Additional article about ${subtopicTitle}`,
        keywords: [subtopicTitle.toLowerCase()],
        focusKeyword: subtopicTitle.toLowerCase(),
        contentType: 'cluster' as const,
        articleType: 'blog-post',
        priority: 5,
        wordCountTarget: 1500,
        searchIntent: 'informational',
      });
    }
  } else if (articleData.length > targetCount) {
    console.warn(`[Topical Authority] AI generated ${articleData.length} articles, trimming to ${targetCount}`);
    // Trim excess articles
    articleData = articleData.slice(0, targetCount);
  }

  console.log(`[Topical Authority]     ✅ Validated: ${articleData.length} articles (target: ${targetCount})`);

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
// Website Analysis (Preview Mode)
// ============================================================================

/**
 * Analyze website without generating map
 * This is useful for showing a preview before generating the full map
 */
export async function analyzeWebsiteForTopicalMap(
  projectId: string
): Promise<WebsiteAnalysisResult> {
  console.log(`[Topical Authority] Analyzing website for project: ${projectId}`);

  // Get project data
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      websiteUrl: true,
    },
  });

  if (!project || !project.websiteUrl) {
    throw new Error('Project not found or no website URL configured');
  }

  // Perform analysis
  const analysis = await WordPressWebsiteAnalyzer.analyze(projectId);

  console.log(`[Topical Authority] ✅ Analysis complete for: ${project.name}`);
  console.log(`[Topical Authority]    - Detected niche: ${analysis.niche}`);
  console.log(`[Topical Authority]    - Existing articles: ${analysis.existingArticleCount}`);
  console.log(`[Topical Authority]    - Content gaps: ${analysis.contentGaps.length}`);

  return analysis;
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
  analyzeWebsite: analyzeWebsiteForTopicalMap, // NEW: Preview analysis
};
