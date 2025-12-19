'use server';

/**
 * 📝 Content Server Actions
 * 
 * Consolidates all content generation and management functionality:
 * - Unified content generator (blogs, reviews, comparisons, lists)
 * - Content library management (CRUD)
 * - Keyword research
 * - Article ideas management
 * 
 * Replaces 8+ API routes:
 * - /api/client/generate-article
 * - /api/client/generate-seo-blog
 * - /api/client/auto-content/generate
 * - /api/client/unified-content-writer/generate
 * - /api/ai-agent/generate-article
 * - /api/client/content-library
 * - /api/client/article-ideas
 * - /api/client/content-research
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { auth, getAuthenticatedClient } from '@/lib/auth';
import { hasEnoughCredits, deductCredits, CREDIT_COSTS } from '@/lib/credits';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';
import { generateBlog } from '@/lib/aiml-agent';
import type { ChatMessage } from '@/lib/aiml-api';

// ═════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═════════════════════════════════════════════════════════════════════

export interface GenerateContentInput {
  projectId: string;
  topic: string;
  keywords: string[];
  wordCount: number;
  tone: 'professional' | 'casual' | 'friendly' | 'expert';
  language: 'nl' | 'en' | 'de' | 'fr' | 'es';
  mode: 'quick' | 'research' | 'premium';
  contentType?: 'blog' | 'review' | 'comparison' | 'list';
  includeImages?: boolean;
  includeFAQ?: boolean;
  includeYouTube?: boolean;
  autoPublish?: boolean;
}

export interface GenerateContentResult {
  success: boolean;
  contentId: string;
  content: {
    title: string;
    html: string;
    metaDescription: string;
    wordCount: number;
  };
}

// ═════════════════════════════════════════════════════════════════════
// CONTENT GENERATION
// ═════════════════════════════════════════════════════════════════════

/**
 * 🚀 Unified Content Generator
 * 
 * Generates content using selected mode:
 * - quick: GPT-4o-mini (fast, cost-effective)
 * - research: Perplexity + GPT-4o (with web search)
 * - premium: Claude Sonnet 4.5 (highest quality)
 */
export async function generateContent(
  input: GenerateContentInput
): Promise<GenerateContentResult> {
  try {
    // Authenticate
    const session = await auth();
    const client = await getAuthenticatedClient();

    // Validate input
    if (!input.topic || input.topic.trim().length === 0) {
      throw new Error('Topic is verplicht');
    }

    if (!input.projectId) {
      throw new Error('Project ID is verplicht');
    }

    // Check project access
    const project = await prisma.project.findFirst({
      where: {
        id: input.projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      throw new Error('Project niet gevonden of geen toegang');
    }

    // Check credits
    const creditCost = calculateContentCreditCost(input.mode, input.wordCount);
    const hasCredits = await hasEnoughCredits(client.id, creditCost);
    
    if (!hasCredits) {
      throw new Error(
        `Niet genoeg credits. Deze actie kost ${creditCost} credits.`
      );
    }

    // Select model based on mode
    let model = TEXT_MODELS.FAST; // quick mode
    if (input.mode === 'premium') {
      model = TEXT_MODELS.CLAUDE_SONNET; // Claude Sonnet 4.5
    } else if (input.mode === 'research') {
      model = TEXT_MODELS.REASONING; // GPT-4o with search
    }

    console.log(`📝 Generating content: ${input.topic} (mode: ${input.mode}, model: ${model})`);

    // Generate content using AI agent
    const result = await generateBlog({
      topic: input.topic,
      keywords: input.keywords,
      minWords: input.wordCount - 200,
      maxWords: input.wordCount + 200,
      tone: input.tone,
      language: input.language,
      model,
      includeImages: input.includeImages,
      includeReferences: input.mode === 'research',
    });

    // Save to database
    const savedContent = await prisma.savedContent.create({
      data: {
        clientId: client.id,
        projectId: input.projectId,
        title: result.title,
        content: result.content,
        contentHtml: result.html,
        description: result.metaDescription,
        type: input.contentType || 'blog',
        category: 'generated',
        wordCount: result.wordCount,
        characterCount: result.content.length,
        status: input.autoPublish ? 'published' : 'draft',
        generatorType: input.mode,
        keywords: input.keywords,
        language: input.language,
      },
    });

    // Deduct credits
    await deductCredits(
      client.id,
      creditCost,
      `Content generatie: ${input.topic} (${input.mode})`,
      {
        model,
        tool: 'content_generator',
      }
    );

    // Revalidate content library
    revalidatePath('/client-portal/content-library');
    revalidatePath(`/client-portal/projects/${input.projectId}`);

    console.log(`✅ Content generated: ${savedContent.id}`);

    return {
      success: true,
      contentId: savedContent.id,
      content: {
        title: result.title,
        html: result.html,
        metaDescription: result.metaDescription,
        wordCount: result.wordCount,
      },
    };
  } catch (error: any) {
    console.error('❌ Error generating content:', error);
    throw new Error(error.message || 'Fout bij genereren van content');
  }
}

/**
 * Calculate credit cost based on mode and word count
 */
function calculateContentCreditCost(
  mode: 'quick' | 'research' | 'premium',
  wordCount: number
): number {
  const baseCredits = {
    quick: 50,
    research: 80,
    premium: 120,
  };

  // Add extra credits for longer content
  const extraCredits = Math.floor(wordCount / 1000) * 20;

  return baseCredits[mode] + extraCredits;
}

// ═════════════════════════════════════════════════════════════════════
// CONTENT LIBRARY MANAGEMENT
// ═════════════════════════════════════════════════════════════════════

/**
 * 📚 Get Content Library
 * 
 * List all saved content with filters
 */
export async function getContentLibrary(filters?: {
  projectId?: string;
  type?: string;
  category?: string;
  search?: string;
  favorite?: boolean;
  archived?: boolean;
}) {
  try {
    const client = await getAuthenticatedClient();

    const where: any = {
      clientId: client.id,
      isArchived: filters?.archived || false,
    };

    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.type) where.type = filters.type;
    if (filters?.category) where.category = filters.category;
    if (filters?.favorite) where.isFavorite = true;
    
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const content = await prisma.savedContent.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            websiteUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, content };
  } catch (error: any) {
    console.error('❌ Error fetching content library:', error);
    throw new Error('Fout bij ophalen van content library');
  }
}

/**
 * ✏️ Update Content
 * 
 * Update existing content
 */
export async function updateContent(contentId: string, updates: any) {
  try {
    const client = await getAuthenticatedClient();

    // Verify ownership
    const content = await prisma.savedContent.findFirst({
      where: {
        id: contentId,
        clientId: client.id,
      },
    });

    if (!content) {
      throw new Error('Content niet gevonden of geen toegang');
    }

    // Calculate word/character count if content changed
    if (updates.content || updates.contentHtml) {
      const text = updates.content || updates.contentHtml || '';
      updates.wordCount = text.split(/\s+/).filter((w: string) => w.length > 0).length;
      updates.characterCount = text.length;
    }

    const updated = await prisma.savedContent.update({
      where: { id: contentId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    revalidatePath('/client-portal/content-library');
    revalidatePath(`/client-portal/content/${contentId}`);

    return { success: true, content: updated };
  } catch (error: any) {
    console.error('❌ Error updating content:', error);
    throw new Error(error.message || 'Fout bij updaten van content');
  }
}

/**
 * 🗑️ Delete Content
 * 
 * Delete content from library
 */
export async function deleteContent(contentId: string) {
  try {
    const client = await getAuthenticatedClient();

    // Verify ownership
    const content = await prisma.savedContent.findFirst({
      where: {
        id: contentId,
        clientId: client.id,
      },
    });

    if (!content) {
      throw new Error('Content niet gevonden of geen toegang');
    }

    await prisma.savedContent.delete({
      where: { id: contentId },
    });

    revalidatePath('/client-portal/content-library');

    return { success: true };
  } catch (error: any) {
    console.error('❌ Error deleting content:', error);
    throw new Error('Fout bij verwijderen van content');
  }
}

// ═════════════════════════════════════════════════════════════════════
// KEYWORD RESEARCH
// ═════════════════════════════════════════════════════════════════════

/**
 * 🔍 Research Keywords
 * 
 * Use Perplexity to research trending keywords and topics
 */
export async function researchKeywords(input: {
  projectId: string;
  seedKeyword: string;
  language: string;
}) {
  try {
    const client = await getAuthenticatedClient();

    // Check credits
    const creditCost = CREDIT_COSTS.KEYWORD_RESEARCH;
    const hasCredits = await hasEnoughCredits(client.id, creditCost);
    
    if (!hasCredits) {
      throw new Error(`Niet genoeg credits. Deze actie kost ${creditCost} credits.`);
    }

    // Use Perplexity for research
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a keyword research expert. Provide comprehensive keyword research data in JSON format.`,
      },
      {
        role: 'user',
        content: `Research keywords related to "${input.seedKeyword}" in ${input.language}. 
        
Provide:
1. 10 related keywords with search volume estimates
2. 5 long-tail keyword opportunities
3. 3 trending topics in this niche
4. Content gap opportunities

Return as JSON with structure:
{
  "relatedKeywords": [{ "keyword": "", "volume": "", "difficulty": "" }],
  "longTail": [""],
  "trending": [""],
  "contentGaps": [""]
}`,
      },
    ];

    const response = await chatCompletion({
      model: 'perplexity/llama-3.1-sonar-large-128k-online',
      messages,
      temperature: 0.3,
    });

    // Parse response
    const result = JSON.parse(response.content || '{}');

    // Deduct credits
    await deductCredits(
      client.id,
      creditCost,
      `Keyword research: ${input.seedKeyword}`,
      {
        tool: 'keyword_research',
      }
    );

    return {
      success: true,
      keywords: result,
    };
  } catch (error: any) {
    console.error('❌ Error researching keywords:', error);
    throw new Error('Fout bij keyword research');
  }
}

// ═════════════════════════════════════════════════════════════════════
// ARTICLE IDEAS MANAGEMENT
// ═════════════════════════════════════════════════════════════════════

/**
 * 💡 Get Article Ideas
 * 
 * List all article ideas for a project
 */
export async function getArticleIdeas(projectId: string) {
  try {
    const client = await getAuthenticatedClient();

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      throw new Error('Project niet gevonden of geen toegang');
    }

    const ideas = await prisma.articleIdea.findMany({
      where: {
        projectId,
        clientId: client.id,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return { success: true, ideas };
  } catch (error: any) {
    console.error('❌ Error fetching article ideas:', error);
    throw new Error('Fout bij ophalen van article ideas');
  }
}

/**
 * ➕ Create Article Idea
 * 
 * Add a new article idea with AI enrichment
 */
export async function createArticleIdea(data: {
  title: string;
  projectId: string;
}) {
  try {
    const client = await getAuthenticatedClient();

    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Titel is verplicht');
    }

    // Get project info
    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      throw new Error('Project niet gevonden');
    }

    // Use AI to enrich the idea
    const { generateContentIdea } = await import('@/lib/intelligent-content-planner');
    const enrichedIdea = await generateContentIdea(
      data.title,
      project.niche || project.name || 'algemeen',
      project.targetAudience || 'Nederlandse lezers'
    );

    // Generate slug
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Create the idea
    const newIdea = await prisma.articleIdea.create({
      data: {
        clientId: client.id,
        projectId: data.projectId,
        title: enrichedIdea.title,
        slug,
        focusKeyword: enrichedIdea.focusKeyword,
        topic: enrichedIdea.description,
        secondaryKeywords: enrichedIdea.secondaryKeywords,
        searchIntent: enrichedIdea.searchIntent,
        difficulty: enrichedIdea.estimatedDifficulty,
        contentOutline: {
          sections: enrichedIdea.outline.map((h2: string) => ({
            heading: h2,
            subpoints: [],
          })),
        },
        contentType: enrichedIdea.contentType,
        priority: enrichedIdea.priority,
        aiScore: 75,
        trending: false,
        competitorGap: false,
        status: 'idea',
      },
    });

    // Auto-schedule if project settings allow
    const { scheduleNewIdea } = await import('@/lib/article-scheduler');
    await scheduleNewIdea(newIdea.id, data.projectId, client.id);

    revalidatePath(`/client-portal/projects/${data.projectId}`);

    return { success: true, idea: newIdea };
  } catch (error: any) {
    console.error('❌ Error creating article idea:', error);
    throw new Error(error.message || 'Fout bij toevoegen van article idea');
  }
}

/**
 * ✏️ Update Article Idea
 */
export async function updateArticleIdea(ideaId: string, updates: any) {
  try {
    const client = await getAuthenticatedClient();

    // Verify ownership
    const idea = await prisma.articleIdea.findFirst({
      where: {
        id: ideaId,
        clientId: client.id,
      },
    });

    if (!idea) {
      throw new Error('Idee niet gevonden of geen toegang');
    }

    const updated = await prisma.articleIdea.update({
      where: { id: ideaId },
      data: updates,
    });

    revalidatePath(`/client-portal/projects/${idea.projectId}`);

    return { success: true, idea: updated };
  } catch (error: any) {
    console.error('❌ Error updating article idea:', error);
    throw new Error('Fout bij updaten van article idea');
  }
}

/**
 * 🗑️ Delete Article Idea
 */
export async function deleteArticleIdea(ideaId: string) {
  try {
    const client = await getAuthenticatedClient();

    // Verify ownership
    const idea = await prisma.articleIdea.findFirst({
      where: {
        id: ideaId,
        clientId: client.id,
      },
    });

    if (!idea) {
      throw new Error('Idee niet gevonden of geen toegang');
    }

    await prisma.articleIdea.delete({
      where: { id: ideaId },
    });

    revalidatePath(`/client-portal/projects/${idea.projectId}`);

    return { success: true };
  } catch (error: any) {
    console.error('❌ Error deleting article idea:', error);
    throw new Error('Fout bij verwijderen van article idea');
  }
}
