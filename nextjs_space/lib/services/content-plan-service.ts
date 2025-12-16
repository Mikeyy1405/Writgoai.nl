/**
 * Content Plan Shared Service Layer
 * 
 * Consolidates duplicate functionality from:
 * - /api/client/content-plan/*
 * - /api/simplified/content-plan/*
 * 
 * Provides unified interface for:
 * - Client/Project authentication & validation
 * - AI-powered content idea generation
 * - Database operations for article ideas
 * - WordPress content fetching
 * - Robust JSON parsing
 */

import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-utils';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Content Plan Topic (gebruikt door beide API sets)
 */
export interface ContentPlanTopic {
  title: string;
  description: string;
  keywords: string[];
  priority: 'high' | 'medium' | 'low';
  reason?: string;
  // Extended fields for detailed format
  focusKeyword?: string;
  secondaryKeywords?: string[];
  searchIntent?: string;
  estimatedDifficulty?: number;
  contentType?: string;
  outline?: string[];
}

/**
 * WordPress Post Type
 */
export interface WordPressPost {
  id: number;
  title: { rendered: string };
  excerpt?: { rendered: string };
  categories?: number[];
  tags?: number[];
}

/**
 * Validation Result
 */
export interface ValidationResult {
  client: any;
  project?: any;
}

/**
 * Generation Options
 */
export interface GenerateContentIdeasOptions {
  keywords?: string[];
  keyword?: string;
  projectContext?: {
    name: string;
    websiteUrl?: string;
    niche?: string;
  };
  language?: string;
  count?: number;
  temperature?: number;
}

// ============================================================================
// Authentication & Validation
// ============================================================================

/**
 * Validate client authentication
 * @throws Error with code if not authenticated or client not found
 */
export async function validateClient(session: any): Promise<any> {
  if (!session?.user?.email) {
    throw new Error('UNAUTHORIZED');
  }

  const client = await prisma.client.findUnique({
    where: { email: session.user.email },
  });

  if (!client) {
    throw new Error('CLIENT_NOT_FOUND');
  }

  return client;
}

/**
 * Validate project ownership
 * @throws Error with code if project not found or not owned by client
 */
export async function validateProject(
  projectId: string,
  clientId: string
): Promise<any> {
  const project = await prisma.project.findUnique({
    where: { id: projectId, clientId: clientId }
  });

  if (!project) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  return project;
}

/**
 * Combined validation for client and project
 * Convenience function for routes that need both
 */
export async function validateClientAndProject(
  session: any,
  projectId: string
): Promise<ValidationResult> {
  const client = await validateClient(session);
  const project = await validateProject(projectId, client.id);
  
  return { client, project };
}

// ============================================================================
// AI Content Generation
// ============================================================================

/**
 * Generate content ideas using AI
 * Unified function for all content generation use cases
 */
export async function generateContentIdeas(
  options: GenerateContentIdeasOptions
): Promise<ContentPlanTopic[]> {
  const {
    keywords = [],
    keyword,
    projectContext,
    language = 'NL',
    count = 10,
    temperature = 0.7,
  } = options;

  // Build prompt based on context
  let prompt = '';
  
  if (keyword) {
    // Single keyword mode (simplified API)
    prompt = buildKeywordPrompt(keyword, projectContext, count);
  } else if (keywords.length > 0) {
    // Multiple keywords mode (client API)
    prompt = buildKeywordsPrompt(keywords, count);
  } else {
    throw new Error('Either keyword or keywords must be provided');
  }

  // Call AI with unified interface
  const aiResponse = await chatCompletion(
    [
      { 
        role: 'system', 
        content: 'Je bent een SEO expert die gestructureerde JSON content plannen genereert.' 
      },
      { role: 'user', content: prompt }
    ],
    {
      model: 'claude-sonnet-4-20250514',
      temperature,
      max_tokens: 4000,
    }
  );

  // Parse with robust error handling
  const topics = parseAIResponse(aiResponse);
  
  if (!Array.isArray(topics) || topics.length === 0) {
    throw new Error('NO_TOPICS_GENERATED');
  }

  return topics;
}

/**
 * Build prompt for single keyword
 */
function buildKeywordPrompt(
  keyword: string,
  projectContext?: GenerateContentIdeasOptions['projectContext'],
  count: number = 10
): string {
  const contextInfo = projectContext 
    ? `Context: Dit is voor de website "${projectContext.name}" (${projectContext.websiteUrl || 'geen URL'}) in de niche "${projectContext.niche || 'algemeen'}"`
    : '';

  return `Je bent een expert SEO content strategist. Genereer een uitgebreid content plan voor het keyword: "${keyword}".

${contextInfo}

Genereer ${count} artikel topics die:
1. Gerelateerd zijn aan het hoofdkeyword
2. Verschillende zoekintents dekken (informationeel, transactioneel, navigational)
3. Long-tail variaties bevatten
4. Content gaps adresseren

Geef je antwoord als een JSON object in dit formaat:
{
  "topics": [
    {
      "title": "Artikel titel",
      "description": "Korte beschrijving van wat het artikel behandelt",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "priority": "high|medium|low",
      "reason": "Waarom dit topic belangrijk is"
    }
  ]
}

BELANGRIJK: Gebruik alleen "high", "medium", of "low" voor priority.
Geef ALLEEN de JSON terug, geen extra tekst of markdown formatting.`;
}

/**
 * Build prompt for multiple keywords
 */
function buildKeywordsPrompt(
  keywords: string[],
  count: number = 10
): string {
  return `Generate ${count} high-quality content ideas based on these keywords: ${keywords.join(', ')}

For each idea, provide:
- A compelling title
- A brief description (1-2 sentences)
- Focus keyword
- 3-5 secondary keywords
- Search intent (informational/commercial/navigational/transactional)
- Estimated difficulty (0-100)
- Content type (blog-post/how-to/guide/listicle/review/comparison)
- 5-7 H2 outline points

IMPORTANT: Respond with ONLY valid JSON in this exact format:
{
  "topics": [
    {
      "title": "string",
      "description": "string",
      "focusKeyword": "string",
      "secondaryKeywords": ["string"],
      "searchIntent": "informational|commercial|navigational|transactional",
      "estimatedDifficulty": number,
      "contentType": "blog-post|how-to|guide|listicle|review|comparison",
      "outline": ["string"],
      "priority": number (1-10)
    }
  ]
}

Do not include any markdown formatting, code blocks, or explanations. Return only the raw JSON object.`;
}

/**
 * Generate content gap analysis for WordPress site
 */
export async function analyzeWordPressContentGaps(
  project: any,
  existingPosts: WordPressPost[]
): Promise<ContentPlanTopic[]> {
  const existingTitles = existingPosts.map(post => post.title.rendered).slice(0, 30);
  const contentSummary = existingTitles.length > 0
    ? `Bestaande artikelen:\n${existingTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
    : 'Geen bestaande content gevonden of site niet toegankelijk';

  const prompt = `Je bent een expert SEO content strategist. Analyseer de WordPress website en genereer een content plan.

Website: ${project.name} (${project.websiteUrl})
Niche: ${project.niche || 'Niet gespecificeerd'}

${contentSummary}

Gebaseerd op de bestaande content (of het ontbreken daarvan), genereer 8-12 nieuwe artikel topics die:
1. Content gaps invullen die nog niet gedekt zijn
2. De niche en doelgroep aanspreken
3. Verschillende zoekintents dekken
4. SEO-vriendelijk zijn met goede zoekvolume potentie
5. Complementair zijn aan bestaande content

BELANGRIJK: Geef je antwoord ALLEEN als een geldig JSON object, zonder extra tekst, uitleg of markdown formatting.

Exact formaat (volg dit exact):
{
  "topics": [
    {
      "title": "Artikel titel",
      "description": "Korte beschrijving van het artikel",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "priority": "high",
      "reason": "Waarom dit topic een content gap invult"
    }
  ]
}

Gebruik alleen deze priority waarden: "high", "medium", of "low".
Geef minimaal 8 en maximaal 12 topics.
Antwoord direct met de JSON, geen tekst ervoor of erna.`;

  const aiResponse = await chatCompletion(
    [
      { 
        role: 'system', 
        content: 'Je bent een SEO expert die WordPress sites analyseert en gestructureerde JSON content plannen genereert.' 
      },
      { role: 'user', content: prompt }
    ],
    {
      model: 'claude-sonnet-4-20250514',
      temperature: 0.7,
      max_tokens: 4000,
    }
  );

  return parseAIResponse(aiResponse);
}

// ============================================================================
// JSON Parsing (Robust)
// ============================================================================

/**
 * Parse AI response with 4 fallback strategies
 * Based on analyze-wordpress implementation (most robust)
 */
export function parseAIResponse(aiResponse: string): ContentPlanTopic[] {
  let topics: ContentPlanTopic[] = [];
  
  try {
    // Strategy 1: Try direct JSON parse
    try {
      const parsed = JSON.parse(aiResponse);
      topics = parsed.topics || parsed.ideas || parsed.contentIdeas || [];
      console.log('[content-plan-service] Strategy 1 success: Direct JSON parse');
      return topics;
    } catch (e1) {
      // Strategy 2: Remove markdown code blocks
      try {
        const withoutCodeBlocks = aiResponse
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();
        const parsed = JSON.parse(withoutCodeBlocks);
        topics = parsed.topics || parsed.ideas || parsed.contentIdeas || [];
        console.log('[content-plan-service] Strategy 2 success: Removed markdown code blocks');
        return topics;
      } catch (e2) {
        // Strategy 3: Extract JSON from text using regex
        try {
          const jsonMatch = aiResponse.match(/\{[\s\S]*"topics"[\s\S]*\}/);
          if (!jsonMatch) {
            // Try alternative keys
            const altMatch = aiResponse.match(/\{[\s\S]*"(ideas|contentIdeas)"[\s\S]*\}/);
            if (altMatch) {
              const parsed = JSON.parse(altMatch[0]);
              topics = parsed.ideas || parsed.contentIdeas || [];
              console.log('[content-plan-service] Strategy 3 success: Regex JSON extraction (alt key)');
              return topics;
            }
            throw new Error('No JSON object found in response');
          }
          const parsed = JSON.parse(jsonMatch[0]);
          topics = parsed.topics || parsed.ideas || parsed.contentIdeas || [];
          console.log('[content-plan-service] Strategy 3 success: Regex JSON extraction');
          return topics;
        } catch (e3) {
          // Strategy 4: Try to find array directly
          try {
            const topicsMatch = aiResponse.match(/"(topics|ideas|contentIdeas)"\s*:\s*(\[[\s\S]*?\])\s*\}/);
            if (!topicsMatch) {
              throw new Error('No topics array found in response');
            }
            topics = JSON.parse(topicsMatch[2]);
            console.log('[content-plan-service] Strategy 4 success: Direct topics array extraction');
            return topics;
          } catch (e4) {
            // All strategies failed - log for debugging
            console.error('[content-plan-service] All parsing strategies failed');
            console.error('[content-plan-service] Raw AI response length:', aiResponse.length);
            console.error('[content-plan-service] Raw AI response (first 1000 chars):', aiResponse.substring(0, 1000));
            console.error('[content-plan-service] Raw AI response (last 500 chars):', aiResponse.substring(Math.max(0, aiResponse.length - 500)));
            
            throw new Error('Failed to parse AI response after trying all strategies');
          }
        }
      }
    }
  } catch (parseError: any) {
    console.error('[content-plan-service] Complete parsing failure');
    console.error('[content-plan-service] Parse error:', parseError);
    throw new Error(`AI_PARSE_ERROR: ${parseError.message}`);
  }
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Save article ideas to database
 * Handles both upsert and insert operations
 */
export async function saveArticleIdeas(
  topics: ContentPlanTopic[] | any[],
  clientId: string,
  projectId: string | null,
  options: {
    targetKeyword?: string;
    useUpsert?: boolean;
  } = {}
): Promise<any[]> {
  const { targetKeyword, useUpsert = true } = options;
  const savedIdeas = [];

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    
    try {
      // Normalize topic data (handle both ContentPlanTopic and detailed formats)
      const ideaData = normalizeTopicData(topic, clientId, projectId, targetKeyword, i);
      
      let saved;
      if (useUpsert) {
        saved = await prisma.articleIdea.upsert({
          where: {
            clientId_slug: {
              clientId: clientId,
              slug: ideaData.slug,
            }
          },
          update: {
            secondaryKeywords: ideaData.secondaryKeywords,
            contentOutline: ideaData.contentOutline,
            aiScore: ideaData.aiScore,
            trending: ideaData.trending,
            competitorGap: ideaData.competitorGap,
            keywords: ideaData.keywords,
            priority: ideaData.priority,
            description: ideaData.description,
          },
          create: ideaData,
        });
      } else {
        saved = await prisma.articleIdea.create({
          data: ideaData,
        });
      }
      
      savedIdeas.push(saved);
    } catch (error) {
      console.error('[content-plan-service] Error saving idea:', error);
      // Continue with other ideas
    }
  }

  return savedIdeas;
}

/**
 * Normalize topic data to database format
 * Handles both simple ContentPlanTopic and detailed formats
 */
function normalizeTopicData(
  topic: any,
  clientId: string,
  projectId: string | null,
  targetKeyword?: string,
  index: number = 0
): any {
  const slug = generateSlug(topic.title);
  
  // Check if this is detailed format (from add-ideas route)
  const isDetailedFormat = 'focusKeyword' in topic || 'outline' in topic;
  
  if (isDetailedFormat) {
    // Client API format (from add-ideas)
    return {
      clientId,
      projectId,
      title: topic.title,
      slug,
      focusKeyword: topic.focusKeyword || topic.keywords?.[0] || '',
      topic: topic.description || topic.title,
      secondaryKeywords: topic.secondaryKeywords || [],
      searchIntent: topic.searchIntent || 'informational',
      difficulty: topic.estimatedDifficulty || 50,
      contentOutline: {
        sections: (topic.outline || []).map((h2: string) => ({
          heading: h2,
          subpoints: []
        }))
      },
      contentType: topic.contentType || 'blog-post',
      priority: typeof topic.priority === 'number' ? topic.priority : 5,
      aiScore: typeof topic.priority === 'number' ? topic.priority * 10 : 70,
      status: 'idea',
      trending: topic.trending,
      competitorGap: topic.competitorGap,
    };
  } else {
    // Simplified API format
    return {
      clientId,
      projectId,
      title: topic.title,
      slug,
      description: topic.description,
      keywords: topic.keywords || [],
      priority: topic.priority || 'medium',
      reason: topic.reason,
      targetKeyword: targetKeyword || topic.keywords?.[0],
      aiScore: 1.0 - (index * 0.05),
      searchVolume: 0,
      focusKeyword: topic.keywords?.[0] || '',
      searchIntent: 'informational',
      difficulty: 50,
      contentType: 'blog-post',
      status: 'idea',
    };
  }
}

/**
 * Get article ideas for a project or client
 */
export async function getArticleIdeas(
  clientId: string,
  projectId?: string,
  options: {
    limit?: number;
    orderBy?: any;
    includeSavedContent?: boolean;
  } = {}
): Promise<any[]> {
  const { 
    limit, 
    orderBy = [
      { priority: 'desc' },
      { aiScore: 'desc' },
      { createdAt: 'desc' }
    ],
    includeSavedContent = true
  } = options;
  
  const where: any = { clientId };
  if (projectId) {
    where.projectId = projectId;
  }

  return prisma.articleIdea.findMany({
    where,
    include: includeSavedContent ? {
      savedContent: {
        select: {
          id: true,
          publishedUrl: true,
          publishedAt: true,
        }
      }
    } : undefined,
    orderBy,
    take: limit,
  });
}

// ============================================================================
// WordPress Integration
// ============================================================================

/**
 * Fetch WordPress posts from site
 */
export async function fetchWordPressPosts(
  websiteUrl: string,
  options: {
    perPage?: number;
    timeout?: number;
  } = {}
): Promise<WordPressPost[]> {
  const { perPage = 50, timeout = 10000 } = options;
  
  try {
    const wpApiUrl = `${websiteUrl}/wp-json/wp/v2/posts?per_page=${perPage}&_fields=id,title,excerpt,categories,tags`;
    
    const response = await fetch(wpApiUrl, {
      headers: {
        'User-Agent': 'WritGoAI Content Planner/1.0',
      },
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      console.warn(`[content-plan-service] Failed to fetch WordPress posts: ${response.status}`);
      return [];
    }

    const posts = await response.json();
    console.log(`[content-plan-service] Fetched ${posts.length} WordPress posts`);
    return posts;
    
  } catch (error: any) {
    console.warn(`[content-plan-service] Error fetching WordPress content:`, error.message);
    return [];
  }
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Map service errors to HTTP responses
 */
export function mapServiceError(error: any): {
  status: number;
  error: string;
  message: string;
  details?: string;
} {
  const errorMessage = error.message || 'Unknown error';
  
  // Map known errors
  const errorMap: Record<string, { status: number; error: string; message: string }> = {
    'UNAUTHORIZED': {
      status: 401,
      error: 'Unauthorized',
      message: 'Je moet ingelogd zijn'
    },
    'CLIENT_NOT_FOUND': {
      status: 404,
      error: 'Client not found',
      message: 'Gebruiker niet gevonden'
    },
    'PROJECT_NOT_FOUND': {
      status: 404,
      error: 'Project not found',
      message: 'Project niet gevonden'
    },
    'NO_TOPICS_GENERATED': {
      status: 500,
      error: 'No topics generated',
      message: 'Geen topics gegenereerd. Probeer het opnieuw.'
    },
  };

  // Check for specific error types
  for (const [key, response] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
      return { ...response, details: errorMessage };
    }
  }

  // Check for AI parse errors
  if (errorMessage.includes('AI_PARSE_ERROR')) {
    return {
      status: 500,
      error: 'Failed to parse AI response',
      message: 'Kan AI response niet parsen',
      details: errorMessage
    };
  }

  // Default error response
  return {
    status: 500,
    error: 'Internal server error',
    message: 'Er is een fout opgetreden',
    details: errorMessage
  };
}
