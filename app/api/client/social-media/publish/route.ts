
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { publishAyrsharePost } from '@/lib/ayrshare-api';

// Credit costs per platform
const PLATFORM_CREDITS: Record<string, number> = {
  linkedin: 5,
  facebook: 4,
  instagram: 4,
  twitter: 3,
  youtube: 5,
};

/**
 * POST /api/client/social-media/publish
 * Publish or schedule a social media post via Ayrshare
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get post and verify ownership
    const post = await prisma.socialMediaPost.findFirst({
      where: {
        id: postId,
        project: {
          clientId: client.id,
        },
      },
      include: {
        project: {
          include: {
            socialMediaConfig: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Get project config
    const config = post.project.socialMediaConfig;
    
    if (!config) {
      return NextResponse.json(
        { error: 'Social media configuratie niet gevonden. Configureer eerst je social media instellingen.' },
        { status: 400 }
      );
    }

    // Check if Ayrshare profile exists
    if (!config.ayrshareProfileKey) {
      return NextResponse.json(
        { error: 'Ayrshare profile niet gevonden. Run auto-setup eerst.' },
        { status: 400 }
      );
    }

    // Check if already published
    if (post.status === 'published') {
      return NextResponse.json(
        { error: 'Post is already published' },
        { status: 400 }
      );
    }

    const platforms = post.platforms || [];

    if (platforms.length === 0) {
      return NextResponse.json(
        { error: 'No platforms specified for this post' },
        { status: 400 }
      );
    }

    // Calculate total credits required for all platforms
    const creditsRequired = platforms.reduce((sum: number, platform: string) => {
      return sum + (PLATFORM_CREDITS[platform] || 5);
    }, 0);

    // Check if client has enough credits
    const totalAvailable = client.subscriptionCredits + client.topUpCredits;
    if (!client.isUnlimited && totalAvailable < creditsRequired) {
      return NextResponse.json(
        { error: 'Insufficient credits', required: creditsRequired, available: totalAvailable },
        { status: 400 }
      );
    }

    // Publish via Ayrshare
    let totalCreditsUsed = 0;
    const platformPostIds: any = {};
    const platformStatuses: any = {};
    const platformErrors: any = {};

    try {
      console.log('[Ayrshare] Publishing post to:', platforms.join(', '));
      
      // Prepare media URLs
      const mediaUrls = post.mediaUrl ? [post.mediaUrl] : undefined;
      
      const result = await publishAyrsharePost({
        profileKey: config.ayrshareProfileKey,
        platforms,
        post: post.content,
        mediaUrls,
        scheduleDate: post.scheduledFor || undefined,
        shorten: true, // Shorten URLs in post
      });

      if (result) {
        // Check if post was successful
        if (result.status === 'success' || result.status === 'scheduled') {
          // Mark all platforms as published/scheduled
          for (const platform of platforms) {
            platformStatuses[platform] = result.status === 'scheduled' ? 'scheduled' : 'published';
            // Store platform-specific post IDs if available
            if (result.postIds && result.postIds[platform]) {
              platformPostIds[platform] = result.postIds[platform];
            } else {
              platformPostIds[platform] = result.id;
            }
            totalCreditsUsed += PLATFORM_CREDITS[platform] || 5;
          }
        } else {
          // Handle errors
          for (const platform of platforms) {
            platformStatuses[platform] = 'failed';
            // Check if there are platform-specific errors
            if (result.errors && result.errors.length > 0) {
              const platformError = result.errors.find((e: any) => e.platform === platform);
              platformErrors[platform] = platformError?.message || 'Unknown error';
            } else {
              platformErrors[platform] = 'Failed to publish';
            }
          }
        }
      } else {
        // API call failed completely
        for (const platform of platforms) {
          platformStatuses[platform] = 'failed';
          platformErrors[platform] = 'API call failed';
        }
      }
    } catch (error: any) {
      console.error('[Ayrshare] Error publishing post:', error);
      for (const platform of platforms) {
        platformStatuses[platform] = 'failed';
        platformErrors[platform] = error.message || 'Unknown error';
      }
    }

    // Determine overall status
    const allPublished = Object.values(platformStatuses).every(s => s === 'published' || s === 'scheduled');
    const somePublished = Object.values(platformStatuses).some(s => s === 'published' || s === 'scheduled');
    const overallStatus = allPublished ? 'published' : somePublished ? 'partially_published' : 'failed';

    // Deduct credits (subscription first, then top-up)
    if (!client.isUnlimited && totalCreditsUsed > 0) {
      const subscriptionDeduct = Math.min(client.subscriptionCredits, totalCreditsUsed);
      const topUpDeduct = totalCreditsUsed - subscriptionDeduct;

      await prisma.client.update({
        where: { id: client.id },
        data: {
          subscriptionCredits: client.subscriptionCredits - subscriptionDeduct,
          topUpCredits: client.topUpCredits - topUpDeduct,
          totalCreditsUsed: { increment: totalCreditsUsed },
        },
      });
    }

    // Update post status with platform-specific data
    await prisma.socialMediaPost.update({
      where: { id: postId },
      data: {
        status: overallStatus,
        platformStatuses,
        platformPostIds,
        platformErrors: Object.keys(platformErrors).length > 0 ? platformErrors : null,
        publishedAt: somePublished ? new Date() : null,
        creditsUsed: totalCreditsUsed,
        error: overallStatus === 'failed' ? 'Failed to publish to all platforms' : null,
        retryCount: overallStatus === 'failed' ? { increment: 1 } : undefined,
      },
    });

    // Record credit transaction
    if (totalCreditsUsed > 0) {
      await prisma.creditTransaction.create({
        data: {
          clientId: client.id,
          amount: -totalCreditsUsed,
          type: 'usage',
          description: `Social media post op ${platforms.join(', ')}`,
          balanceAfter: totalAvailable - totalCreditsUsed,
        },
      });
    }

    const remainingCredits = client.isUnlimited ? 999999 : totalAvailable - totalCreditsUsed;

    return NextResponse.json({
      success: overallStatus !== 'failed',
      status: overallStatus,
      platformStatuses,
      platformErrors: Object.keys(platformErrors).length > 0 ? platformErrors : null,
      creditsUsed: totalCreditsUsed,
      remainingCredits,
    });
  } catch (error) {
    console.error('[Ayrshare] Error publishing social media post:', error);
    return NextResponse.json(
      { error: 'Failed to publish post' },
      { status: 500 }
    );
  }
}
