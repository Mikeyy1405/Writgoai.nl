
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getWordPressConfig, publishToWordPress } from '@/lib/wordpress-publisher';
import { deductCredits, CREDIT_COSTS } from '@/lib/credits';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { contentId, projectId, clientId } = body;

    if (!contentId) {
      return NextResponse.json({ error: 'Content ID is required' }, { status: 400 });
    }

    let client;

    // Support both authenticated session and direct clientId (for cron jobs)
    if (clientId) {
      // Direct authentication via clientId (used by cron jobs)
      client = await prisma.client.findUnique({
        where: { id: clientId },
      });
      
      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
    } else {
      // Session-based authentication (used by regular API calls)
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      client = await prisma.client.findUnique({
        where: { email: session.user.email },
      });

      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
    }

    // Get content
    const content = await prisma.savedContent.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Check if already published
    if (content.publishedUrl) {
      return NextResponse.json({
        success: true,
        publishedUrl: content.publishedUrl,
        message: 'Content already published',
      });
    }

    // Get WordPress config
    const wpConfig = await getWordPressConfig({
      clientEmail: client.email,
      projectId: projectId || undefined,
    });

    if (!wpConfig) {
      return NextResponse.json(
        { error: 'WordPress not configured for this project' },
        { status: 400 }
      );
    }

    // Deduct credits for publishing
    // Note: We use BLOG_POST cost since publishing is included in the generation cost
    // If you want separate pricing for publishing, add a new cost constant
    const creditsToDeduct = 10; // Small cost for WordPress publishing
    const deductionResult = await deductCredits(client.id, creditsToDeduct, 'Autopilot WordPress publicatie');
    
    if (!deductionResult.success) {
      return NextResponse.json({ 
        error: deductionResult.error || 'Insufficient credits' 
      }, { status: 402 });
    }

    try {
      // Prepare excerpt from content if not available
      let excerpt = content.description || content.metaDesc || '';
      if (!excerpt && content.contentHtml) {
        // Extract first paragraph as excerpt
        const firstPMatch = content.contentHtml.match(/<p[^>]*>(.*?)<\/p>/is);
        if (firstPMatch) {
          excerpt = firstPMatch[1]
            .replace(/<[^>]+>/g, '')
            .substring(0, 155)
            .trim();
          if (excerpt.length === 155) {
            excerpt += '...';
          }
        }
      }

      // Prepare WordPress categories array
      const wpCategories: number[] = [];
      if (content.wordpressCategory) {
        // Convert string category ID to number
        const categoryId = parseInt(content.wordpressCategory, 10);
        if (!isNaN(categoryId)) {
          wpCategories.push(categoryId);
          console.log(`✅ Using WordPress category: ${categoryId}`);
        }
      }

      // Publish to WordPress with full content, FEATURED IMAGE, and AUTO-SELECTED CATEGORY
      const result = await publishToWordPress(wpConfig, {
        title: content.title,
        content: content.contentHtml || content.content,
        excerpt: excerpt,
        status: 'publish',
        tags: content.tags || [],
        categories: wpCategories.length > 0 ? wpCategories : undefined, // ✅ AUTO-SELECT CATEGORY
        featuredImageUrl: content.thumbnailUrl || (content.imageUrls && content.imageUrls[0]) || undefined, // ✅ SET FEATURED IMAGE
        seoTitle: content.title,
        seoDescription: content.metaDesc || excerpt,
        focusKeyword: content.keywords?.[0] || undefined,
        useGutenberg: true,
      });

      // Update content with published URL
      await prisma.savedContent.update({
        where: { id: contentId },
        data: {
          publishedUrl: result.link,
          publishedAt: new Date(),
        },
      });

      // Update article idea status if linked
      const linkedArticle = await prisma.articleIdea.findFirst({
        where: { contentId: contentId },
      });

      if (linkedArticle) {
        await prisma.articleIdea.update({
          where: { id: linkedArticle.id },
          data: {
            status: 'published',
            publishedAt: new Date(),
          },
        });

        // Update AutopilotJob if exists
        const autopilotJob = await prisma.autopilotJob.findFirst({
          where: {
            articleId: linkedArticle.id,
            status: { in: ['generating', 'publishing'] }
          },
          orderBy: { startedAt: 'desc' },
        });

        if (autopilotJob) {
          await prisma.autopilotJob.update({
            where: { id: autopilotJob.id },
            data: {
              status: 'completed',
              progress: 100,
              currentStep: 'Gepubliceerd naar WordPress!',
              publishedUrl: result.link,
              completedAt: new Date(),
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        publishedUrl: result.link,
        wordpressId: result.id,
        message: 'Content published successfully',
      });

    } catch (error: any) {
      // If publishing fails, we don't refund credits as the content was generated
      // You could implement a partial refund policy here if desired
      throw error;
    }

  } catch (error: any) {
    console.error('Error in autopilot publish:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
