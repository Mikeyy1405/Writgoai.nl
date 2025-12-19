/**
 * AutoPilot Orchestrator
 * Main orchestration engine for autonomous content generation
 * Coordinates: Research → Writing → Image Gen → Publishing
 */

import { writeArticleWithClaude, ClaudeArticle } from '../ai-services/claude-writer';
import { researchTopicWithPerplexity, PerplexityResearchResult } from '../ai-services/perplexity-research';
import { generateArticleImageWithRetry } from '../ai-services/flux-image-generator';
import { publishArticleToWordPress } from '../wordpress-publisher';
import { deductCredits, CREDIT_COSTS } from '../credits';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AutoPilotJob {
  id: string;
  clientId: string;
  projectId: string;
  articleIdeaId: string;
  status: 'pending' | 'researching' | 'writing' | 'generating_image' | 'publishing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  error?: string;
  result?: {
    articleId: string;
    wordpressPostId: number;
    wordpressUrl: string;
  };
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Run a complete AutoPilot job
 * Steps: Research → Write → Generate Image → Publish → Notify
 */
export async function runAutoPilotJob(
  articleIdeaId: string,
  clientId: string
): Promise<AutoPilotJob> {
  console.log(`🚀 Starting AutoPilot job for article: ${articleIdeaId}`);

  // Create job record in database
  const job = await prisma.autoPilotJob.create({
    data: {
      clientId,
      projectId: '', // Will be filled from ArticleIdea
      articleIdeaId,
      status: 'pending',
      progress: 0,
      currentStep: 'Initializing...',
      startedAt: new Date(),
    },
  });

  try {
    // Step 1: Load ArticleIdea from database
    await updateJobProgress(job.id, 5, 'researching', 'Loading article details...');
    
    const articleIdea = await prisma.articleIdea.findUnique({
      where: { id: articleIdeaId },
      include: {
        client: {
          include: {
            projects: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!articleIdea) {
      throw new Error(`ArticleIdea not found: ${articleIdeaId}`);
    }

    const project = articleIdea.client.projects[0];
    if (!project) {
      throw new Error('No primary project found for client');
    }

    // Update projectId
    await prisma.autoPilotJob.update({
      where: { id: job.id },
      data: { projectId: project.id },
    });

    // Step 2: Research with Perplexity
    await updateJobProgress(job.id, 15, 'researching', 'Researching topic with Perplexity...');
    
    let researchData: PerplexityResearchResult | undefined;
    
    // Check if we have cached research
    if (articleIdea.perplexityResearch && articleIdea.researchedAt) {
      const researchAge = Date.now() - new Date(articleIdea.researchedAt).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (researchAge < maxAge) {
        console.log('📦 Using cached Perplexity research');
        researchData = articleIdea.perplexityResearch as any;
      }
    }

    // Perform new research if no cache
    if (!researchData) {
      researchData = await researchTopicWithPerplexity({
        query: articleIdea.topic,
        niche: articleIdea.category || project.niche || undefined,
        includeStats: true,
        includeTrends: true,
      });

      // Cache the research
      await prisma.articleIdea.update({
        where: { id: articleIdeaId },
        data: {
          perplexityResearch: researchData as any,
          researchedAt: new Date(),
        },
      });

      // Deduct research credits
      await deductCredits(clientId, CREDIT_COSTS.WEB_SEARCH, 'AutoPilot: Perplexity Research');
    }

    // Step 3: Write article with Claude Sonnet 4.5
    await updateJobProgress(job.id, 35, 'writing', 'Writing article with Claude AI...');

    const keywords = [
      articleIdea.focusKeyword,
      ...articleIdea.secondaryKeywords,
    ].filter(Boolean);

    const article = await writeArticleWithClaude({
      topic: articleIdea.title,
      keywords,
      wordCount: articleIdea.targetWordCount || 1500,
      tone: (project.writingStyle as any) || 'professional',
      includeHeadings: true,
      includeFAQ: true,
      researchData,
      language: 'nl', // TODO: Make this configurable
    });

    console.log(`✅ Article written: ${article.wordCount} words`);

    // Deduct writing credits
    await deductCredits(clientId, CREDIT_COSTS.BLOG_POST, 'AutoPilot: Article Writing');

    // Step 4: Generate featured image with Flux Pro
    await updateJobProgress(job.id, 60, 'generating_image', 'Generating featured image...');

    let featuredImageUrl: string | null = null;
    
    try {
      const imageResult = await generateArticleImageWithRetry(
        article.title,
        keywords,
        {
          style: 'photorealistic',
          aspectRatio: '16:9',
        }
      );

      featuredImageUrl = imageResult.imageUrl;
      console.log(`✅ Featured image generated: ${featuredImageUrl}`);

      // Deduct image credits
      await deductCredits(clientId, CREDIT_COSTS.IMAGE_PREMIUM, 'AutoPilot: Featured Image');
    } catch (imageError) {
      console.error('⚠️ Failed to generate image, continuing without:', imageError);
      // Continue without image - don't fail the entire job
    }

    // Step 5: Save to content library
    await updateJobProgress(job.id, 75, 'publishing', 'Saving to content library...');

    const savedContent = await prisma.savedContent.create({
      data: {
        clientId,
        projectId: project.id,
        type: 'blog',
        title: article.title,
        content: article.markdown,
        contentHtml: article.content,
        category: articleIdea.category || 'general',
        tags: keywords,
        keywords,
        metaDesc: article.metaDescription,
        slug: slugify(article.title),
        thumbnailUrl: featuredImageUrl,
        imageUrls: featuredImageUrl ? [featuredImageUrl] : [],
        wordCount: article.wordCount,
        characterCount: article.content.length,
      },
    });

    console.log(`✅ Content saved to library: ${savedContent.id}`);

    // Step 6: Publish to WordPress
    await updateJobProgress(job.id, 85, 'publishing', 'Publishing to WordPress...');

    let wordpressPostId: number | null = null;
    let wordpressUrl: string | null = null;

    try {
      const publishResult = await publishArticleToWordPress({
        title: article.title,
        content: article.content,
        excerpt: article.metaDescription,
        status: project.wordpressAutoPublish ? 'publish' : 'draft',
        featuredImageUrl,
        seoTitle: article.title,
        seoDescription: article.metaDescription,
        focusKeyword: article.focusKeyword,
        useGutenberg: true,
        projectId: project.id,
      });

      wordpressPostId = publishResult.id;
      wordpressUrl = publishResult.link;

      console.log(`✅ Published to WordPress: ${wordpressUrl}`);

      // Update saved content with WordPress info
      await prisma.savedContent.update({
        where: { id: savedContent.id },
        data: {
          publishedUrl: wordpressUrl,
          publishedAt: new Date(),
        },
      });
    } catch (publishError) {
      console.error('⚠️ Failed to publish to WordPress:', publishError);
      // Don't fail the job - content is still saved
    }

    // Step 7: Update ArticleIdea status
    await prisma.articleIdea.update({
      where: { id: articleIdeaId },
      data: {
        status: 'completed',
        hasContent: true,
        contentId: savedContent.id,
        generatedAt: new Date(),
        publishedAt: wordpressUrl ? new Date() : null,
      },
    });

    // Update autopilot scheduling
    if (articleIdea.autopilotFrequency && articleIdea.autopilotFrequency !== 'once') {
      const nextRun = calculateNextRun(articleIdea.autopilotFrequency);
      await prisma.articleIdea.update({
        where: { id: articleIdeaId },
        data: {
          autopilotLastRun: new Date(),
          autopilotRunCount: (articleIdea.autopilotRunCount || 0) + 1,
          autopilotNextRun: nextRun,
        },
      });
    }

    // Step 8: Send email notification
    await updateJobProgress(job.id, 95, 'completed', 'Sending notification...');

    try {
      await sendCompletionEmail(clientId, {
        articleTitle: article.title,
        wordCount: article.wordCount,
        wordpressUrl,
        contentLibraryId: savedContent.id,
      });
    } catch (emailError) {
      console.error('⚠️ Failed to send email:', emailError);
      // Don't fail the job
    }

    // Complete the job
    await updateJobProgress(job.id, 100, 'completed', 'Completed successfully!');

    const completedJob = await prisma.autoPilotJob.update({
      where: { id: job.id },
      data: {
        status: 'completed',
        progress: 100,
        currentStep: 'Completed',
        completedAt: new Date(),
        result: {
          articleId: savedContent.id,
          wordpressPostId: wordpressPostId || 0,
          wordpressUrl: wordpressUrl || '',
        },
      },
    });

    console.log(`✅ AutoPilot job completed: ${job.id}`);

    return completedJob as any;
  } catch (error: any) {
    console.error('❌ AutoPilot job failed:', error);

    await prisma.autoPilotJob.update({
      where: { id: job.id },
      data: {
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

/**
 * Update job progress
 */
async function updateJobProgress(
  jobId: string,
  progress: number,
  status: AutoPilotJob['status'],
  currentStep: string
): Promise<void> {
  await prisma.autoPilotJob.update({
    where: { id: jobId },
    data: {
      progress,
      status,
      currentStep,
    },
  });

  console.log(`📊 Progress: ${progress}% - ${currentStep}`);
}

/**
 * Calculate next run time based on frequency
 */
function calculateNextRun(frequency: string): Date {
  const now = new Date();
  
  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to daily
  }
}

/**
 * Send completion email notification
 */
async function sendCompletionEmail(
  clientId: string,
  details: {
    articleTitle: string;
    wordCount: number;
    wordpressUrl: string | null;
    contentLibraryId: string;
  }
): Promise<void> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { email: true, name: true },
  });

  if (!client) {
    console.warn('Client not found for email notification');
    return;
  }

  // TODO: Implement email sending
  // For now, just log
  console.log(`📧 Would send email to ${client.email}:`);
  console.log(`   Article: ${details.articleTitle}`);
  console.log(`   Word count: ${details.wordCount}`);
  console.log(`   WordPress: ${details.wordpressUrl || 'Not published'}`);
}

/**
 * Convert string to URL-friendly slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

/**
 * Get job status
 */
export async function getAutoPilotJobStatus(jobId: string): Promise<AutoPilotJob | null> {
  const job = await prisma.autoPilotJob.findUnique({
    where: { id: jobId },
  });

  return job as any;
}

/**
 * List jobs for a client
 */
export async function listAutoPilotJobs(
  clientId: string,
  limit: number = 10
): Promise<AutoPilotJob[]> {
  const jobs = await prisma.autoPilotJob.findMany({
    where: { clientId },
    orderBy: { startedAt: 'desc' },
    take: limit,
  });

  return jobs as any;
}
