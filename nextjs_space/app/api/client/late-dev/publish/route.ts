
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

const LATE_DEV_API_KEY = process.env.LATE_DEV_API_KEY;
const LATE_DEV_API_URL = 'https://getlate.dev/api/v1';

/**
 * Publish post to Late.dev connected accounts
 * POST /api/client/late-dev/publish
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const {
      projectId,
      postId,
      accountIds,
      content,
      mediaUrl,
      scheduledAt,
    } = await req.json();

    if (!projectId || (!postId && !content)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify project belongs to client
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get post if postId provided
    let post = null;
    let postContent = content;
    let postMediaUrl = mediaUrl;

    if (postId) {
      post = await prisma.socialMediaPost.findFirst({
        where: {
          id: postId,
          projectId: projectId,
        },
      });

      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }

      postContent = post.content;
      postMediaUrl = post.mediaUrl;
    }

    // Get selected accounts (or all if none specified)
    let accounts;
    if (accountIds && accountIds.length > 0) {
      accounts = await prisma.lateDevAccount.findMany({
        where: {
          id: { in: accountIds },
          projectId: projectId,
          clientId: client.id,
          isActive: true,
        },
      });
    } else {
      accounts = await prisma.lateDevAccount.findMany({
        where: {
          projectId: projectId,
          clientId: client.id,
          isActive: true,
        },
      });
    }

    if (accounts.length === 0) {
      return NextResponse.json(
        { error: 'No active accounts found for this project' },
        { status: 400 }
      );
    }

    // Extract profile IDs for Late.dev API
    const profileIds = accounts
      .map(acc => acc.lateDevProfileId)
      .filter(Boolean) as string[];

    if (profileIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid Late.dev profiles found' },
        { status: 400 }
      );
    }

    // Prepare Late.dev post data
    const lateDevPostData: any = {
      profileIds,
      text: postContent,
    };

    // Add media if present
    if (postMediaUrl) {
      lateDevPostData.media = [
        {
          url: postMediaUrl,
          type: 'image',
        },
      ];
    }

    // Add scheduling if present
    if (scheduledAt) {
      lateDevPostData.scheduledAt = scheduledAt;
    }

    // Publish via Late.dev API
    const response = await fetch(`${LATE_DEV_API_URL}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LATE_DEV_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lateDevPostData),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Late.dev] Post creation failed:', error);
      return NextResponse.json(
        { error: 'Failed to publish post' },
        { status: response.status }
      );
    }

    const publishResult = await response.json();

    // Update post status if postId provided
    if (postId) {
      await prisma.socialMediaPost.update({
        where: { id: postId },
        data: {
          status: scheduledAt ? 'scheduled' : 'published',
          publishedAt: scheduledAt ? null : new Date(),
          scheduledFor: scheduledAt ? new Date(scheduledAt) : null,
          platformPostIds: publishResult.posts || {},
        },
      });
    }

    // Update lastUsedAt for accounts
    await prisma.lateDevAccount.updateMany({
      where: {
        id: { in: accounts.map(acc => acc.id) },
      },
      data: {
        lastUsedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      lateDevPostId: publishResult.id,
      status: publishResult.status,
      posts: publishResult.posts,
    });
  } catch (error: any) {
    console.error('[Late.dev Publish] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
