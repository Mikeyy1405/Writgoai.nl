import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, post } = body;

    if (!projectId || !post) {
      return NextResponse.json({ error: 'ProjectId and post are required' }, { status: 400 });
    }

    // Fetch project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.wordpressUrl || !project.wordpressUsername || !project.wordpressPassword) {
      return NextResponse.json({ error: 'WordPress not configured for this project' }, { status: 400 });
    }

    // TODO: Implement WordPress API publishing
    // For now, just save to database
    const slug = post.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const blogPost = await prisma.blogPost.create({
      data: {
        projectId,
        clientId: project.clientId,
        title: post.title,
        slug,
        excerpt: post.excerpt,
        content: post.content,
        metaDescription: post.metaDescription,
        focusKeyword: post.focusKeyword,
        status: 'published',
        publishedAt: new Date(),
        wordpressStatus: 'published',
        wordpressPostId: `mock-${Date.now()}`, // Mock WordPress ID
      },
    });

    return NextResponse.json({ success: true, blogPost });
  } catch (error) {
    console.error('Error publishing blog post:', error);
    return NextResponse.json({ error: 'Failed to publish blog post' }, { status: 500 });
  }
}
