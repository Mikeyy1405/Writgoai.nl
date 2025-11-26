

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createPost, uploadMediaFromUrl } from '@/lib/latedev';

/**
 * POST /api/client/latedev/post
 * Create and schedule a post to multiple social media platforms via Late.dev
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      content,
      mediaUrls = [],
      platforms = [], // Array of platform names: ['instagram', 'tiktok', 'youtube']
      scheduledFor,
      publishNow = false,
      isDraft = false,
      platformSpecificData = {}, // Object with platform-specific settings
    } = body;

    // Get client with Late.dev accounts
    const client = await prisma.client.findUnique({
      where: { id: session.user.id },
      include: {
        lateDevAccounts: {
          where: { isActive: true },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (!client.lateDevProfileId) {
      return NextResponse.json(
        { error: 'No Late.dev profile configured' },
        { status: 400 }
      );
    }

    if (client.lateDevAccounts.length === 0) {
      return NextResponse.json(
        { error: 'No social media accounts connected' },
        { status: 400 }
      );
    }

    // Upload media to Late.dev if provided
    const mediaItems: Array<{ type: string; url: string }> = [];
    
    if (mediaUrls && mediaUrls.length > 0) {
      for (const url of mediaUrls) {
        try {
          const uploaded = await uploadMediaFromUrl(url);
          mediaItems.push({
            type: uploaded.type,
            url: uploaded.url,
          });
        } catch (error) {
          console.error(`Failed to upload media ${url}:`, error);
          // Continue with other media
        }
      }
    }

    // Build platforms array with account IDs
    const platformsToPost: Array<{
      platform: string;
      accountId: string;
      platformSpecificData?: any;
    }> = [];

    // If specific platforms requested, use only those
    const targetPlatforms = platforms.length > 0 
      ? platforms 
      : client.lateDevAccounts.map(acc => acc.platform);

    for (const platformName of targetPlatforms) {
      const account = client.lateDevAccounts.find(
        acc => acc.platform.toLowerCase() === platformName.toLowerCase()
      );

      if (account) {
        const platformData: any = {
          platform: account.platform,
          accountId: account.lateDevProfileId,
        };

        // Add platform-specific data
        if (platformSpecificData[platformName]) {
          platformData.platformSpecificData = platformSpecificData[platformName];
        } else {
          // Set defaults based on platform
          if (platformName.toLowerCase() === 'instagram' && mediaItems.length > 0) {
            platformData.platformSpecificData = {
              contentType: mediaItems[0].type === 'video' ? 'reel' : 'post',
            };
          } else if (platformName.toLowerCase() === 'tiktok') {
            platformData.platformSpecificData = {
              tiktokPrivacy: 'PUBLIC_TO_EVERYONE' as const,
              disableComment: false,
              disableDuet: false,
              disableStitch: false,
            };
          } else if (platformName.toLowerCase() === 'youtube' && mediaItems.length > 0) {
            platformData.platformSpecificData = {
              title: content?.substring(0, 100) || 'Video Post',
              description: content || '',
              youtubePrivacy: 'public' as const,
              categoryId: '22', // People & Blogs
              madeForKids: false,
            };
          }
        }

        platformsToPost.push(platformData);
      }
    }

    if (platformsToPost.length === 0) {
      return NextResponse.json(
        { error: 'No matching social media accounts found for requested platforms' },
        { status: 400 }
      );
    }

    // Create post on Late.dev
    const postData: any = {
      content,
      platforms: platformsToPost,
      publishNow,
      isDraft,
      timezone: 'Europe/Amsterdam',
    };

    if (mediaItems.length > 0) {
      postData.mediaItems = mediaItems;
    }

    if (scheduledFor && !publishNow) {
      postData.scheduledFor = scheduledFor;
    }

    const result = await createPost(postData);

    return NextResponse.json({
      success: true,
      postId: result._id,
      platforms: result.platforms,
      message: publishNow 
        ? 'Post published successfully!' 
        : scheduledFor 
        ? `Post scheduled for ${scheduledFor}` 
        : 'Post saved as draft',
    });
  } catch (error: any) {
    console.error('Late.dev post error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create post', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
