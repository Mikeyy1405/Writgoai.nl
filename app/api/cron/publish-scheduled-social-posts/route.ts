

export const dynamic = "force-dynamic";
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createPost } from '@/lib/getlate';

/**
 * Cron job to automatically publish scheduled social media posts
 * Should be called every 15 minutes
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🕐 Starting scheduled social post publication...');

    // Get posts that should be published now
    const now = new Date();
    const scheduledPosts = await prisma.contentCalendarItem.findMany({
      where: {
        status: 'scheduled',
        scheduledFor: {
          lte: now,
        },
      },
      take: 10, // Process max 10 at a time
    });

    console.log(`Found ${scheduledPosts.length} posts to publish`);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Publish each post
    for (const post of scheduledPosts) {
      try {
        console.log(`📤 Publishing post ${post.id}: ${post.title}`);

        // Prepare media items
        const mediaItems = post.mediaUrl
          ? [
              {
                url: post.mediaUrl,
                type: (post.mediaType || 'image') as 'image' | 'video',
              },
            ]
          : undefined;

        // Create post via GetLate.dev
        const postData = {
          content: post.content,
          platforms: post.platforms,
          mediaItems,
        };

        const result = await createPost(postData);

        // Update post status
        await prisma.contentCalendarItem.update({
          where: { id: post.id },
          data: {
            status: 'published',
            publishedAt: now,
            lateDevPostId: result.id || result.postId,
            lateDevResponse: result,
            errorMessage: null,
          },
        });

        results.success++;
        console.log(`✅ Successfully published post ${post.id}`);
      } catch (error) {
        console.error(`❌ Error publishing post ${post.id}:`, error);

        // Update with error, increment retry count
        await prisma.contentCalendarItem.update({
          where: { id: post.id },
          data: {
            status: post.retryCount >= 3 ? 'failed' : 'scheduled',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            retryCount: { increment: 1 },
          },
        });

        results.failed++;
        results.errors.push(`Post ${post.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('✅ Scheduled post publication completed:', results);

    return NextResponse.json({
      success: true,
      processed: scheduledPosts.length,
      results,
    });
  } catch (error) {
    console.error('❌ Error in scheduled post publication:', error);
    return NextResponse.json(
      {
        error: 'Failed to publish scheduled posts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
