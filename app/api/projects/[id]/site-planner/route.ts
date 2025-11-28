import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';
import { getBannedWordsInstructions } from '@/lib/banned-words';
import { getProjectForClient } from '@/lib/db/projects';
import { upsertSitePlan, getSitePlan } from '@/lib/db/content-planning';
import { createArticleIdeas, generateId, generateSlug } from '@/lib/db/content-planning';
import { deductCredits, hasEnoughCredits, CONTENT_PLANNING_CREDITS } from '@/lib/db/credits';
import { prisma } from '@/lib/db';
import type { PillarPage, ClusterPage, BlogPostIdea, SearchIntent, Priority } from '@/types/database';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export const runtime = 'nodejs';

interface SitePlanContent {
  homepage: {
    title: string;
    metaDescription: string;
    focusKeyword: string;
    secondaryKeywords: string[];
    sections: Array<{ title: string; description: string; cta?: string }>;
  };
  pillarPages: Array<{
    title: string;
    slug: string;
    focusKeyword: string;
    secondaryKeywords: string[];
    description: string;
    searchIntent: string;
    estimatedWordCount: number;
    priority: string;
    clusterTopics: string[];
  }>;
  clusterPages: Array<{
    title: string;
    slug: string;
    focusKeyword: string;
    secondaryKeywords: string[];
    description: string;
    searchIntent: string;
    estimatedWordCount: number;
    priority: string;
    parentPillarSlug: string;
  }>;
  blogPosts: Array<{
    title: string;
    slug: string;
    focusKeyword: string;
    secondaryKeywords: string[];
    description: string;
    searchIntent: string;
    estimatedWordCount: number;
    priority: string;
    category?: string;
    cluster?: string;
  }>;
}

/**
 * POST /api/projects/[id]/site-planner
 * Generate a complete site plan with AI
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🗺️ [Site Planner] API called');
  const resolvedParams = await params;
  const projectId = resolvedParams.id;

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('❌ [Site Planner] Not authenticated');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    console.log('✅ [Site Planner] Authenticated:', session.user.email);

    // Get client from email
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // 2. Parse request
    let body;
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { forceRegenerate = false, keywords = [], targetAudience = '', language = 'NL' } = body;
    console.log('📦 [Site Planner] Request:', { projectId, forceRegenerate, keywords, language });

    // 3. Fetch project
    const project = await getProjectForClient(projectId, client.id);
    if (!project) {
      console.error('❌ [Site Planner] Project not found or access denied');
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    console.log('✅ [Site Planner] Project loaded:', project.name);

    // 4. Check for existing plan if not force regenerating
    if (!forceRegenerate) {
      const existingPlan = await getSitePlan(projectId);
      if (existingPlan) {
        console.log('✅ [Site Planner] Existing plan found, returning it');
        return NextResponse.json({
          success: true,
          sitePlan: existingPlan,
          isExisting: true,
        });
      }
    }

    // 5. Check credits
    const creditCost = CONTENT_PLANNING_CREDITS.SITE_PLAN_GENERATION;
    const hasCredits = await hasEnoughCredits(client.id, creditCost);
    if (!hasCredits) {
      return NextResponse.json({
        error: 'Niet genoeg credits',
        required: creditCost,
      }, { status: 402 });
    }

    // 6. Generate site plan with AI
    const projectKeywords = keywords.length > 0 ? keywords : project.keywords || [];
    const projectTargetAudience = targetAudience || project.targetAudience || '';
    const projectNiche = project.niche || '';

    const prompt = buildSitePlanPrompt({
      websiteUrl: project.websiteUrl,
      name: project.name,
      description: project.description || '',
      niche: projectNiche,
      targetAudience: projectTargetAudience,
      keywords: projectKeywords,
      language,
    });

    console.log('🤖 [Site Planner] Generating with Claude...');
    const response = await chatCompletion({
      model: TEXT_MODELS.CLAUDE_SONNET,
      messages: [
        {
          role: 'system',
          content: `You are an expert SEO content strategist. Generate comprehensive site plans in JSON format.
${getBannedWordsInstructions()}

CRITICAL: Your response MUST be valid JSON only, no other text. Follow the exact structure provided.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 8000,
    });

    // 7. Parse AI response
    let sitePlanContent: SitePlanContent;
    try {
      const jsonMatch = response.message.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      sitePlanContent = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('❌ [Site Planner] Failed to parse AI response:', parseError);
      return NextResponse.json({
        error: 'Fout bij verwerken AI respons',
      }, { status: 500 });
    }

    // 8. Transform to proper types
    const pillarPages: PillarPage[] = sitePlanContent.pillarPages.map((p, idx) => ({
      id: generateId(),
      title: p.title,
      slug: p.slug || generateSlug(p.title),
      focusKeyword: p.focusKeyword,
      secondaryKeywords: p.secondaryKeywords || [],
      description: p.description,
      searchIntent: (p.searchIntent as SearchIntent) || 'informational',
      estimatedWordCount: p.estimatedWordCount || 2500,
      priority: (p.priority as Priority) || 'high',
      clusterTopics: p.clusterTopics || [],
    }));

    // Create a map from pillar slug to pillar ID
    const pillarSlugToId: Record<string, string> = {};
    pillarPages.forEach(p => {
      pillarSlugToId[p.slug] = p.id;
    });

    const clusterPages: ClusterPage[] = sitePlanContent.clusterPages.map(c => ({
      id: generateId(),
      title: c.title,
      slug: c.slug || generateSlug(c.title),
      focusKeyword: c.focusKeyword,
      secondaryKeywords: c.secondaryKeywords || [],
      description: c.description,
      searchIntent: (c.searchIntent as SearchIntent) || 'informational',
      estimatedWordCount: c.estimatedWordCount || 1500,
      priority: (c.priority as Priority) || 'medium',
      parentPillarId: pillarSlugToId[c.parentPillarSlug] || pillarPages[0]?.id || '',
    }));

    const blogPosts: BlogPostIdea[] = sitePlanContent.blogPosts.map(b => ({
      id: generateId(),
      title: b.title,
      slug: b.slug || generateSlug(b.title),
      focusKeyword: b.focusKeyword,
      secondaryKeywords: b.secondaryKeywords || [],
      description: b.description,
      searchIntent: (b.searchIntent as SearchIntent) || 'informational',
      estimatedWordCount: b.estimatedWordCount || 1200,
      priority: (b.priority as Priority) || 'medium',
      category: b.category,
      cluster: b.cluster,
    }));

    // 9. Save site plan
    const savedPlan = await upsertSitePlan({
      clientId: client.id,
      projectId,
      name: `Content Strategy - ${project.name}`,
      homepage: sitePlanContent.homepage,
      pillarPages,
      clusterPages,
      blogPosts,
      keywords: projectKeywords,
      targetAudience: projectTargetAudience,
      language,
      status: 'active',
    });

    // 10. Create article ideas from the plan
    const articleIdeas = [
      ...pillarPages.map(p => ({
        clientId: client.id,
        projectId,
        title: p.title,
        slug: p.slug,
        focusKeyword: p.focusKeyword,
        topic: p.description,
        secondaryKeywords: p.secondaryKeywords,
        searchIntent: p.searchIntent,
        targetWordCount: p.estimatedWordCount,
        contentType: 'pillar' as const,
        priority: p.priority,
        language,
      })),
      ...clusterPages.map(c => ({
        clientId: client.id,
        projectId,
        title: c.title,
        slug: c.slug,
        focusKeyword: c.focusKeyword,
        topic: c.description,
        secondaryKeywords: c.secondaryKeywords,
        searchIntent: c.searchIntent,
        targetWordCount: c.estimatedWordCount,
        contentType: 'cluster' as const,
        priority: c.priority,
        cluster: c.parentPillarId,
        language,
      })),
      ...blogPosts.map(b => ({
        clientId: client.id,
        projectId,
        title: b.title,
        slug: b.slug,
        focusKeyword: b.focusKeyword,
        topic: b.description,
        secondaryKeywords: b.secondaryKeywords,
        searchIntent: b.searchIntent,
        targetWordCount: b.estimatedWordCount,
        contentType: 'blog' as const,
        priority: b.priority,
        category: b.category,
        cluster: b.cluster,
        language,
      })),
    ];

    await createArticleIdeas(articleIdeas);

    // 11. Deduct credits
    await deductCredits(
      client.id,
      creditCost,
      `Site Plan generatie voor ${project.name}`,
      { model: TEXT_MODELS.CLAUDE_SONNET }
    );

    console.log('✅ [Site Planner] Site plan generated and saved');

    return NextResponse.json({
      success: true,
      sitePlan: savedPlan,
      articleIdeasCount: articleIdeas.length,
      creditsUsed: creditCost,
    });

  } catch (error) {
    console.error('❌ [Site Planner] Error:', error);
    return NextResponse.json({
      error: 'Er is een fout opgetreden',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

function buildSitePlanPrompt(options: {
  websiteUrl: string;
  name: string;
  description: string;
  niche: string;
  targetAudience: string;
  keywords: string[];
  language: string;
}): string {
  const languageMap: Record<string, string> = {
    NL: 'Nederlands',
    EN: 'English',
    DE: 'Deutsch',
    ES: 'Español',
    FR: 'Français',
  };

  return `Generate a complete SEO content strategy for the following website:

Website: ${options.websiteUrl}
Name: ${options.name}
Description: ${options.description}
Niche: ${options.niche}
Target Audience: ${options.targetAudience}
Main Keywords: ${options.keywords.join(', ')}
Language: ${languageMap[options.language] || options.language}

Create a comprehensive content plan with:
1. Homepage optimization suggestions
2. 3-5 Pillar pages (cornerstone content, 2500+ words)
3. 15-20 Cluster pages (supporting content, 1500+ words)
4. 30-40 Blog posts (fresh content, 1000-1500 words)

For each content piece, include:
- Title (SEO optimized in ${languageMap[options.language] || options.language})
- URL slug (lowercase, hyphens, no special characters)
- Focus keyword
- Secondary keywords (3-5)
- Brief description
- Search intent (informational, navigational, transactional, or commercial)
- Estimated word count
- Priority (high, medium, low)

For pillar pages, also include cluster topics.
For cluster pages, include the parent pillar slug.
For blog posts, include category and cluster if applicable.

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "homepage": {
    "title": "string",
    "metaDescription": "string",
    "focusKeyword": "string",
    "secondaryKeywords": ["string"],
    "sections": [{"title": "string", "description": "string", "cta": "string"}]
  },
  "pillarPages": [
    {
      "title": "string",
      "slug": "string",
      "focusKeyword": "string",
      "secondaryKeywords": ["string"],
      "description": "string",
      "searchIntent": "informational",
      "estimatedWordCount": 2500,
      "priority": "high",
      "clusterTopics": ["string"]
    }
  ],
  "clusterPages": [
    {
      "title": "string",
      "slug": "string",
      "focusKeyword": "string",
      "secondaryKeywords": ["string"],
      "description": "string",
      "searchIntent": "informational",
      "estimatedWordCount": 1500,
      "priority": "medium",
      "parentPillarSlug": "string"
    }
  ],
  "blogPosts": [
    {
      "title": "string",
      "slug": "string",
      "focusKeyword": "string",
      "secondaryKeywords": ["string"],
      "description": "string",
      "searchIntent": "informational",
      "estimatedWordCount": 1200,
      "priority": "medium",
      "category": "string",
      "cluster": "string"
    }
  ]
}`;
}
