import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getArticleIdea, linkContentToIdea } from '@/lib/db/content-planning';
import { getProject } from '@/lib/db/projects';
import { deductCredits, hasEnoughCredits, CONTENT_PLANNING_CREDITS } from '@/lib/db/credits';
import { prisma } from '@/lib/db';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';
import { getBannedWordsInstructions } from '@/lib/banned-words';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export const runtime = 'nodejs';

/**
 * POST /api/ideas/[id]/generate
 * Generate content from an article idea
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const ideaId = resolvedParams.id;

  console.log('📝 [Generate] Starting content generation for idea:', ideaId);

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get client from email
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // 2. Get the article idea
    const idea = await getArticleIdea(ideaId);

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    if (idea.clientId !== client.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 3. Check if content already exists
    if (idea.hasContent && idea.contentId) {
      return NextResponse.json({
        error: 'Content already generated for this idea',
        contentId: idea.contentId,
      }, { status: 400 });
    }

    // 4. Determine credit cost based on content type
    let creditCost = CONTENT_PLANNING_CREDITS.BLOG_GENERATION;
    if (idea.contentType === 'pillar') {
      creditCost = CONTENT_PLANNING_CREDITS.PILLAR_PAGE_GENERATION;
    } else if (idea.contentType === 'cluster') {
      creditCost = CONTENT_PLANNING_CREDITS.CLUSTER_PAGE_GENERATION;
    }

    // 5. Check credits
    const hasCredits = await hasEnoughCredits(client.id, creditCost);
    if (!hasCredits) {
      return NextResponse.json({
        error: 'Niet genoeg credits',
        required: creditCost,
      }, { status: 402 });
    }

    // 6. Get project for additional context
    let projectContext = '';
    if (idea.projectId) {
      const project = await getProject(idea.projectId);
      if (project) {
        projectContext = `
Website: ${project.websiteUrl}
Niche: ${project.niche || 'Niet gespecificeerd'}
Target Audience: ${project.targetAudience || 'Niet gespecificeerd'}
Brand Voice: ${project.brandVoice || 'Professioneel en informatief'}
Writing Style: ${project.writingStyle || 'Duidelijk en toegankelijk'}
`;
      }
    }

    // 7. Build the generation prompt
    const wordCount = idea.targetWordCount || (idea.contentType === 'pillar' ? 2500 : idea.contentType === 'cluster' ? 1500 : 1200);
    
    const prompt = buildGenerationPrompt({
      title: idea.title,
      focusKeyword: idea.focusKeyword,
      secondaryKeywords: idea.secondaryKeywords || [],
      topic: idea.topic,
      contentType: idea.contentType || 'blog',
      searchIntent: idea.searchIntent || 'informational',
      outline: idea.contentOutline,
      wordCount,
      language: idea.language || 'NL',
      projectContext,
    });

    console.log('🤖 [Generate] Calling AI...');

    // 8. Generate content with AI
    const response = await chatCompletion({
      model: TEXT_MODELS.CLAUDE_4_SONNET,
      messages: [
        {
          role: 'system',
          content: `You are an expert SEO content writer. Write high-quality, engaging content optimized for search engines.
${getBannedWordsInstructions()}

IMPORTANT: 
- Write naturally and avoid keyword stuffing
- Include proper headings (H2, H3)
- Make the content scannable with bullet points where appropriate
- Include a compelling introduction and conclusion
- Output the content in HTML format with proper semantic tags`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 8000,
    });

    const generatedContent = response.message;

    // 9. Save content to SavedContent table
    const contentId = crypto.randomUUID ? crypto.randomUUID() : 
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

    const savedContent = await prisma.savedContent.create({
      data: {
        id: contentId,
        clientId: client.id,
        projectId: idea.projectId,
        type: idea.contentType || 'blog',
        title: idea.title,
        content: generatedContent,
        contentHtml: generatedContent,
        slug: idea.slug,
        keywords: [idea.focusKeyword, ...(idea.secondaryKeywords || [])],
        category: idea.category || idea.contentCategory,
        description: idea.topic,
        wordCount: countWords(generatedContent),
        characterCount: generatedContent.length,
        language: (idea.language || 'NL') as 'NL' | 'EN' | 'DE' | 'ES' | 'FR' | 'IT' | 'PT' | 'PL' | 'SV' | 'DA',
        generatorType: 'content-planner',
      },
    });

    // 10. Link content to idea
    await linkContentToIdea(ideaId, contentId);

    // 11. Deduct credits
    await deductCredits(
      client.id,
      creditCost,
      `Content generatie: ${idea.title}`,
      { model: TEXT_MODELS.CLAUDE_4_SONNET }
    );

    console.log('✅ [Generate] Content generated successfully');

    return NextResponse.json({
      success: true,
      content: savedContent,
      creditsUsed: creditCost,
    });

  } catch (error) {
    console.error('❌ [Generate] Error:', error);
    return NextResponse.json({
      error: 'Er is een fout opgetreden',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

function buildGenerationPrompt(options: {
  title: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  topic: string;
  contentType: string;
  searchIntent: string;
  outline: Record<string, unknown> | null;
  wordCount: number;
  language: string;
  projectContext: string;
}): string {
  const languageMap: Record<string, string> = {
    NL: 'Nederlands',
    EN: 'English',
    DE: 'Deutsch',
    ES: 'Español',
    FR: 'Français',
  };

  const contentTypeMap: Record<string, string> = {
    pillar: 'Pillar page (cornerstone content, comprehensive guide)',
    cluster: 'Cluster page (supporting content, specific topic)',
    blog: 'Blog post (fresh, engaging content)',
    homepage: 'Homepage content',
    landing: 'Landing page content',
  };

  let outlineSection = '';
  if (options.outline) {
    outlineSection = `
Content Outline:
${JSON.stringify(options.outline, null, 2)}

Follow this outline structure while writing.`;
  }

  return `Write a comprehensive ${contentTypeMap[options.contentType] || 'article'} in ${languageMap[options.language] || options.language}.

Title: ${options.title}
Focus Keyword: ${options.focusKeyword}
Secondary Keywords: ${options.secondaryKeywords.join(', ')}
Topic/Description: ${options.topic}
Search Intent: ${options.searchIntent}
Target Word Count: ${options.wordCount} words
${options.projectContext}
${outlineSection}

Requirements:
1. Write naturally and engagingly for the target audience
2. Include the focus keyword in the first paragraph, some H2 headings, and naturally throughout
3. Use secondary keywords naturally where relevant
4. Structure with proper H2 and H3 headings
5. Include bullet points or numbered lists where appropriate
6. Write a compelling introduction that hooks the reader
7. End with a clear conclusion or call-to-action
8. Optimize for the specified search intent
9. Make the content scannable and easy to read
10. Output in clean HTML format with semantic tags

Write the complete article now:`;
}

function countWords(html: string): number {
  // Remove HTML tags and count words
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.split(' ').filter(word => word.length > 0).length;
}
