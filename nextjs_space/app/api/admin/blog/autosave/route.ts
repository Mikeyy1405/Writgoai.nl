import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { postId, title, content, excerpt } = body;

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Create a version backup
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const nextVersionNumber = post.versions.length > 0 
      ? post.versions[0].versionNumber + 1 
      : 1;

    // Save version
    await prisma.blogVersion.create({
      data: {
        blogPostId: postId,
        title: title || post.title,
        content: content || post.content,
        versionNumber: nextVersionNumber,
        createdBy: session.user?.email || null,
      },
    });

    // Update the post
    const updatedPost = await prisma.blogPost.update({
      where: { id: postId },
      data: {
        title: title || post.title,
        content: content || post.content,
        excerpt: excerpt || post.excerpt,
      },
    });

    return NextResponse.json({
      success: true,
      post: updatedPost,
      versionNumber: nextVersionNumber,
    });
  } catch (error) {
    console.error('Error auto-saving post:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
