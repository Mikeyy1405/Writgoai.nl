import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET - Fetch a specific social media post
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const postId = params.id;

    // Fetch post and verify ownership
    const post = await prisma.socialMediaPost.findUnique({
      where: { id: postId },
      include: {
        project: true,
        sourceIdea: {
          select: {
            id: true,
            title: true,
            contentType: true,
          },
        },
      },
    });

    if (!post || post.project.clientId !== client.id) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error: any) {
    console.error('Error fetching social media post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update a social media post
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const postId = params.id;
    const body = await req.json();

    // Verify post belongs to client's project
    const post = await prisma.socialMediaPost.findUnique({
      where: { id: postId },
      include: { project: true },
    });

    if (!post || post.project.clientId !== client.id) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    if (body.content !== undefined) updateData.content = body.content;
    if (body.scheduledFor !== undefined) updateData.scheduledFor = body.scheduledFor ? new Date(body.scheduledFor) : null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.platform !== undefined) updateData.platform = body.platform;
    if (body.media !== undefined) updateData.media = body.media;

    // Update the post
    const updatedPost = await prisma.socialMediaPost.update({
      where: { id: postId },
      data: updateData,
    });

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (error: any) {
    console.error('Error updating social media post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update post' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a social media post
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const postId = params.id;

    // Verify post belongs to client's project
    const post = await prisma.socialMediaPost.findUnique({
      where: { id: postId },
      include: { project: true },
    });

    if (!post || post.project.clientId !== client.id) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Delete the post
    await prisma.socialMediaPost.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting social media post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete post' },
      { status: 500 }
    );
  }
}
