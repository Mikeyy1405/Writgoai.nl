export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { schedulePost, publishPost } from '@/lib/getlate-api';

/**
 * POST /api/client/late-dev/schedule
 * 
 * Schedule een social media post via Getlate
 * 
 * Body:
 * {
 *   projectId: string
 *   postId: string (optional - link naar SocialMediaPost in database)
 *   content: string
 *   platforms: string[] (e.g., ['linkedin', 'twitter', 'instagram'])
 *   scheduledFor?: string (ISO date string, optional voor direct publiceren)
 *   mediaUrl?: string (optional)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const { projectId, postId, content, platforms, scheduledFor, mediaUrl } = await req.json();

    if (!projectId || !content || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Project ID, content en platforms zijn verplicht' },
        { status: 400 }
      );
    }

    // Haal project en config op
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: {
          email: session.user.email,
        },
      },
      include: {
        socialMediaConfig: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    if (!project.socialMediaConfig?.getlateEnabled || !project.socialMediaConfig?.getlateProfileId) {
      return NextResponse.json(
        { error: 'Getlate niet ingesteld voor dit project' },
        { status: 400 }
      );
    }

    // Check if we have connected accounts
    if (!project.socialMediaConfig.getlateAccountIds || project.socialMediaConfig.getlateAccountIds.length === 0) {
      return NextResponse.json(
        { error: 'Geen social media accounts verbonden. Verbind eerst accounts via Getlate dashboard.' },
        { status: 400 }
      );
    }

    // Map platform names to account IDs
    const connectedAccounts = project.socialMediaConfig.getlateConnectedAccounts as Record<string, any> || {};
    const platformData = platforms.map((platform: string) => {
      const normalizedPlatform = platform.toLowerCase();
      const accountInfo = connectedAccounts[normalizedPlatform];
      
      if (!accountInfo) {
        throw new Error(`Geen account verbonden voor platform: ${platform}`);
      }

      return {
        platform: normalizedPlatform,
        accountId: accountInfo.id,
      };
    });

    // Prepare media items if media URL is provided
    const mediaItems = mediaUrl ? [{
      type: 'image' as const,
      url: mediaUrl,
    }] : undefined;

    // Schedule or publish post via Getlate
    let getlatePost;
    if (scheduledFor) {
      const scheduleDate = new Date(scheduledFor);
      getlatePost = await schedulePost(
        content,
        platformData,
        scheduleDate,
        mediaItems,
        project.socialMediaConfig.getlateProfileId
      );
    } else {
      getlatePost = await publishPost(
        content,
        platformData,
        mediaItems,
        project.socialMediaConfig.getlateProfileId
      );
    }

    // Update database if postId is provided
    if (postId) {
      await prisma.socialMediaPost.update({
        where: { id: postId },
        data: {
          status: scheduledFor ? 'scheduled' : 'published',
          scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
          publishedAt: scheduledFor ? undefined : new Date(),
          platformPostIds: {
            getlate: getlatePost.id,
          },
          platformStatuses: {
            getlate: getlatePost.status,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      getlatePost: {
        id: getlatePost.id,
        status: getlatePost.status,
        scheduledFor: getlatePost.scheduledFor,
        publishedAt: getlatePost.publishedAt,
      },
      postId,
    });
  } catch (error: any) {
    console.error('Getlate schedule error:', error);
    return NextResponse.json(
      { error: error.message || 'Post scheduling gefaald' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/client/late-dev/schedule?projectId=xxx
 * 
 * Haal geplande posts op van Getlate
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const projectId = req.nextUrl.searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is verplicht' },
        { status: 400 }
      );
    }

    // Haal project en config op
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: {
          email: session.user.email,
        },
      },
      include: {
        socialMediaConfig: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    if (!project.socialMediaConfig?.getlateEnabled || !project.socialMediaConfig?.getlateProfileId) {
      return NextResponse.json({
        posts: [],
        message: 'Getlate niet ingesteld voor dit project',
      });
    }

    // Haal scheduled posts op van database (deze zijn via Getlate gepubliceerd)
    const posts = await prisma.socialMediaPost.findMany({
      where: {
        projectId,
        status: {
          in: ['scheduled', 'published'],
        },
        platformPostIds: {
          path: ['getlate'],
          not: null,
        },
      },
      orderBy: {
        scheduledFor: 'asc',
      },
      take: 50,
    });

    return NextResponse.json({
      posts,
      profileId: project.socialMediaConfig.getlateProfileId,
    });
  } catch (error: any) {
    console.error('Getlate get posts error:', error);
    return NextResponse.json(
      { error: error.message || 'Posts ophalen gefaald' },
      { status: 500 }
    );
  }
}
