
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/client/social-media/posts
 * Get social media posts for a project
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status'); // draft, scheduled, published, failed

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Build query
    const where: any = { projectId };
    if (status) {
      where.status = status;
    }

    // Get posts
    const posts = await prisma.socialMediaPost.findMany({
      where,
      include: {
        sourceArticle: {
          select: {
            id: true,
            title: true,
            focusKeyword: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { scheduledFor: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching social media posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/client/social-media/posts
 * Create a new social media post (draft or scheduled)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId,
      platform,
      platforms,
      content,
      mediaUrl,
      linkUrl,
      contentType,
      sourceArticleId,
      scheduledFor,
      status = 'draft',
    } = body;

    // Support both single platform (old API) and multi-platform (new API)
    const platformList = platforms || (platform ? [platform] : []);

    if (!projectId || platformList.length === 0 || !content || !contentType) {
      return NextResponse.json(
        { error: 'Project ID, platforms, content, and content type are required' },
        { status: 400 }
      );
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create post with multi-platform support
    const post = await prisma.socialMediaPost.create({
      data: {
        projectId,
        platforms: platformList,
        content,
        mediaUrl: mediaUrl || null,
        linkUrl: linkUrl || null,
        contentType,
        sourceArticleId: sourceArticleId || null,
        status,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        creditsUsed: 0,
      },
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('Error creating social media post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/client/social-media/posts
 * Delete a social media post
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

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
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Don't allow deleting published posts
    if (post.status === 'published') {
      return NextResponse.json(
        { error: 'Cannot delete published posts' },
        { status: 400 }
      );
    }

    // Delete post
    await prisma.socialMediaPost.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting social media post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
