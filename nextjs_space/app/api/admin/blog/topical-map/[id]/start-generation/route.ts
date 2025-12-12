import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * POST /api/admin/blog/topical-map/:id/start-generation
 * 
 * Starts the batch generation process for a topical authority map
 * Creates a batch job and begins generating articles
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { batchSize = 20, selectedArticleIds } = body;

    // Get the map
    const map = await prisma.topicalAuthorityMap.findUnique({
      where: { id },
    });

    if (!map) {
      return NextResponse.json({ error: 'Map not found' }, { status: 404 });
    }

    // Check if already generating
    if (map.status === 'generating') {
      return NextResponse.json(
        { error: 'Generation already in progress' },
        { status: 400 }
      );
    }

    // Get articles to generate
    let articlesToGenerate;
    if (selectedArticleIds && selectedArticleIds.length > 0) {
      // Generate only selected articles
      articlesToGenerate = await prisma.topicalMapArticle.findMany({
        where: {
          mapId: id,
          id: { in: selectedArticleIds },
          status: { in: ['pending', 'failed'] },
        },
        orderBy: { priority: 'desc' },
      });
    } else {
      // Generate all pending/failed articles
      articlesToGenerate = await prisma.topicalMapArticle.findMany({
        where: {
          mapId: id,
          status: { in: ['pending', 'failed'] },
        },
        orderBy: { priority: 'desc' },
      });
    }

    if (articlesToGenerate.length === 0) {
      return NextResponse.json(
        { error: 'No articles to generate' },
        { status: 400 }
      );
    }

    console.log(`[Start Generation API] Starting generation for ${articlesToGenerate.length} articles`);

    // Calculate batches
    const totalBatches = Math.ceil(articlesToGenerate.length / batchSize);

    // Create batch job
    const batchJob = await prisma.batchJob.create({
      data: {
        mapId: id,
        type: 'article_generation',
        status: 'queued',
        totalItems: articlesToGenerate.length,
        completedItems: 0,
        failedItems: 0,
        progressPercentage: 0,
        batchSize,
        currentBatch: 0,
        totalBatches,
        errorLog: [],
      },
    });

    // Update map status
    await prisma.topicalAuthorityMap.update({
      where: { id },
      data: {
        status: 'generating',
        currentBatchId: batchJob.id,
      },
    });

    console.log(`[Start Generation API] Created batch job: ${batchJob.id}`);
    console.log(`[Start Generation API] Total batches: ${totalBatches}`);

    // Start background processing (don't wait for it)
    // In production, this should use a proper job queue (Bull, BullMQ, etc.)
    // For now, we'll use a simple async function
    processBatchGeneration(id, batchJob.id, articlesToGenerate, batchSize).catch((error) => {
      console.error('[Background Processing] Error:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Batch generation started',
      batchJob: {
        id: batchJob.id,
        totalItems: batchJob.totalItems,
        totalBatches,
        batchSize,
      },
    });

  } catch (error: any) {
    console.error('[Start Generation API] Error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error.message,
    }, { status: 500 });
  }
}

/**
 * Background function to process batch generation
 * This runs asynchronously and updates progress in the database
 */
async function processBatchGeneration(
  mapId: string,
  batchJobId: string,
  articles: any[],
  batchSize: number
) {
  console.log(`[Background Processing] Starting for ${articles.length} articles`);

  try {
    // Update batch job to processing
    await prisma.batchJob.update({
      where: { id: batchJobId },
      data: {
        status: 'processing',
        startedAt: new Date(),
      },
    });

    const { generateArticleContent } = await import('@/lib/topical-authority-ai-service');
    const map = await prisma.topicalAuthorityMap.findUnique({ where: { id: mapId } });
    
    if (!map) {
      throw new Error('Map not found');
    }

    let completedCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    // Process articles in batches
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      const currentBatchNumber = Math.floor(i / batchSize) + 1;

      console.log(`[Background Processing] Processing batch ${currentBatchNumber}/${Math.ceil(articles.length / batchSize)}`);

      // Update current batch
      await prisma.batchJob.update({
        where: { id: batchJobId },
        data: { currentBatch: currentBatchNumber },
      });

      // Process articles in this batch (in parallel but with limit)
      const batchPromises = batch.map(async (article: any) => {
        try {
          // Update article status to generating
          await prisma.topicalMapArticle.update({
            where: { id: article.id },
            data: { status: 'generating' },
          });

          // Get parent pillar if this is a cluster
          let parentPillar = null;
          if (article.type === 'cluster' && article.parentId) {
            parentPillar = await prisma.topicalMapArticle.findUnique({
              where: { id: article.parentId },
            });
          }

          // Generate article content
          const content = await generateArticleContent(
            article,
            {
              niche: map.niche,
              targetAudience: map.targetAudience,
              language: map.language,
              tone: map.tone,
              keywords: map.keywords || [],
              totalArticles: map.totalArticles,
              pillarClusterRatio: map.pillarClusterRatio,
            },
            parentPillar
          );

          // Create blog post
          const blogPost = await prisma.blogPost.create({
            data: {
              title: content.title,
              slug: generateSlug(content.title),
              excerpt: content.excerpt,
              content: content.content,
              status: 'draft',
              featured: article.type === 'pillar',
              seoTitle: content.title,
              seoDescription: content.excerpt,
              seoKeywords: [article.primaryKeyword, ...article.secondaryKeywords],
            },
          });

          // Update article status
          await prisma.topicalMapArticle.update({
            where: { id: article.id },
            data: {
              status: 'generated',
              blogPostId: blogPost.id,
              generatedAt: new Date(),
            },
          });

          completedCount++;
          console.log(`[Background Processing] ✅ Generated: ${article.title}`);

        } catch (error: any) {
          console.error(`[Background Processing] ❌ Failed: ${article.title}`, error);
          
          failedCount++;
          errors.push({
            articleId: article.id,
            title: article.title,
            error: error.message,
            timestamp: new Date().toISOString(),
          });

          // Update article with error
          await prisma.topicalMapArticle.update({
            where: { id: article.id },
            data: {
              status: 'failed',
              errorMessage: error.message,
              retryCount: (article.retryCount || 0) + 1,
            },
          });
        }
      });

      // Wait for batch to complete
      await Promise.all(batchPromises);

      // Update progress
      const progress = Math.round(((completedCount + failedCount) / articles.length) * 100);
      const etaMinutes = Math.ceil(((articles.length - completedCount - failedCount) / batchSize) * 2); // Estimate 2 min per batch

      await prisma.batchJob.update({
        where: { id: batchJobId },
        data: {
          completedItems: completedCount,
          failedItems: failedCount,
          progressPercentage: progress,
          etaMinutes,
          errorLog: errors,
        },
      });

      // Update map progress
      await prisma.topicalAuthorityMap.update({
        where: { id: mapId },
        data: {
          generationProgress: progress,
          articlesGenerated: completedCount,
          articlesFailed: failedCount,
        },
      });

      // Small delay between batches to avoid rate limits
      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Mark as completed
    await prisma.batchJob.update({
      where: { id: batchJobId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        progressPercentage: 100,
        etaMinutes: 0,
      },
    });

    await prisma.topicalAuthorityMap.update({
      where: { id: mapId },
      data: {
        status: 'completed',
        generationProgress: 100,
        completedAt: new Date(),
      },
    });

    console.log(`[Background Processing] ✅ Completed! ${completedCount} success, ${failedCount} failed`);

  } catch (error: any) {
    console.error('[Background Processing] Fatal error:', error);
    
    // Mark batch as failed
    await prisma.batchJob.update({
      where: { id: batchJobId },
      data: {
        status: 'failed',
        errorLog: [{
          error: error.message,
          timestamp: new Date().toISOString(),
        }],
      },
    });

    await prisma.topicalAuthorityMap.update({
      where: { id: mapId },
      data: { status: 'failed' },
    });
  }
}

/**
 * Generate URL-safe slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}
