import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { publishToWordPressEnhanced } from '@/lib/wordpress-publisher-enhanced';
import { createPostWithFallback } from '@/lib/getlate-enhanced';

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300; // 5 minutes

/**
 * Publish Scheduled Articles Cron Job
 * Publishes articles that are scheduled for current time
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log('[Publish Scheduled] ❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    console.log(`[Publish Scheduled] 🚀 Starting scheduled publish at ${now.toISOString()}`);

    // Find blog posts scheduled to be published now or in the past
    const scheduledPosts = await prisma.blogPost.findMany({
      where: {
        status: 'scheduled',
        scheduledPublishDate: {
          lte: now,
        },
      },
      include: {
        client: true,
        project: true,
      },
    });

    console.log(`[Publish Scheduled] Found ${scheduledPosts.length} posts to publish`);

    const results = [];

    for (const post of scheduledPosts) {
      try {
        console.log(`[Publish Scheduled] Publishing: ${post.title}`);

        // Get WordPress config from project or client
        const wordpressConfig = {
          siteUrl: post.project?.wordpressUrl || post.client?.wordpressUrl || '',
          username: post.project?.wordpressUsername || post.client?.wordpressUsername || '',
          applicationPassword: post.project?.wordpressPassword || post.client?.wordpressPassword || '',
        };

        if (!wordpressConfig.siteUrl || !wordpressConfig.username || !wordpressConfig.applicationPassword) {
          console.error(`[Publish Scheduled] ❌ No WordPress config for post ${post.id}`);
          
          // Update post status to failed
          await prisma.blogPost.update({
            where: { id: post.id },
            data: {
              status: 'failed',
              publishError: 'WordPress configuratie niet gevonden',
            },
          });

          results.push({
            postId: post.id,
            title: post.title,
            status: 'failed',
            error: 'WordPress configuratie niet gevonden',
          });
          continue;
        }

        // Publish to WordPress
        const wpResult = await publishToWordPressEnhanced(wordpressConfig, {
          title: post.title,
          content: post.content || '',
          excerpt: post.excerpt,
          categories: post.categories || [],
          status: 'publish',
          featuredImageUrl: post.featuredImage || undefined,
          seoTitle: post.seoTitle || undefined,
          seoDescription: post.seoDescription || undefined,
          focusKeyword: post.keywords?.[0],
          tags: post.keywords || [],
        });

        if (wpResult.success) {
          console.log(`[Publish Scheduled] ✅ Published to WordPress: ${wpResult.link}`);

          // Update blog post status
          await prisma.blogPost.update({
            where: { id: post.id },
            data: {
              status: 'published',
              publishedAt: now,
              wordpressUrl: wpResult.link,
              wordpressPostId: wpResult.postId?.toString(),
            },
          });

          // Try to publish to social media (non-blocking)
          if (post.autoPublishToSocial && post.project) {
            console.log(`[Publish Scheduled] 📱 Publishing to social media...`);
            
            try {
              const socialResult = await createPostWithFallback({
                content: `${post.title}\n\n${wpResult.link}`,
                platforms: ['twitter', 'linkedin', 'facebook'],
                mediaItems: post.featuredImage ? [{
                  url: post.featuredImage,
                  type: 'image',
                }] : undefined,
              });

              if (socialResult.success && !socialResult.fallbackToManual) {
                console.log(`[Publish Scheduled] ✅ Social media post created`);
              } else {
                console.log(`[Publish Scheduled] ⚠️ Social media post skipped (optional)`);
              }
            } catch (socialError) {
              console.error(`[Publish Scheduled] ⚠️ Social media failed (non-critical):`, socialError);
            }
          }

          results.push({
            postId: post.id,
            title: post.title,
            status: 'published',
            wordpressUrl: wpResult.link,
          });
        } else {
          console.error(`[Publish Scheduled] ❌ WordPress publish failed: ${wpResult.error}`);

          // Update post status
          await prisma.blogPost.update({
            where: { id: post.id },
            data: {
              status: 'failed',
              publishError: wpResult.error,
            },
          });

          results.push({
            postId: post.id,
            title: post.title,
            status: 'failed',
            error: wpResult.error,
          });
        }

      } catch (error: any) {
        console.error(`[Publish Scheduled] ❌ Error publishing post ${post.id}:`, error);

        // Update post status
        await prisma.blogPost.update({
          where: { id: post.id },
          data: {
            status: 'failed',
            publishError: error.message,
          },
        });

        results.push({
          postId: post.id,
          title: post.title,
          status: 'error',
          error: error.message,
        });
      }

      // Small delay between posts
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`[Publish Scheduled] ✅ Completed. Published ${results.filter(r => r.status === 'published').length}/${scheduledPosts.length} posts`);

    return NextResponse.json({
      success: true,
      message: 'Scheduled publish completed',
      timestamp: now.toISOString(),
      found: scheduledPosts.length,
      results,
    });

  } catch (error: any) {
    console.error('[Publish Scheduled] ❌ Fatal error:', error);
    return NextResponse.json(
      { 
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'dev-secret';
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get count of scheduled posts
  const scheduledCount = await prisma.blogPost.count({
    where: {
      status: 'scheduled',
      scheduledPublishDate: {
        lte: new Date(),
      },
    },
  });

  return NextResponse.json({
    status: 'operational',
    scheduledPosts: scheduledCount,
    message: 'Use POST to publish scheduled posts',
  });
}
