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
    const { projectId, posts } = body;

    if (!projectId || !posts || posts.length === 0) {
      return NextResponse.json({ error: 'ProjectId and posts are required' }, { status: 400 });
    }

    // Fetch project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.getlateProfileId) {
      return NextResponse.json({ error: 'Getlate not configured for this project' }, { status: 400 });
    }

    // TODO: Implement Getlate.dev API publishing
    // For now, just save to database
    const socialPosts = await Promise.all(
      posts.map((post: any) =>
        prisma.socialMediaPost.create({
          data: {
            projectId,
            clientId: project.clientId,
            content: post.content,
            platforms: [post.platform],
            status: 'published',
            publishedAt: new Date(),
            getlateStatus: 'published',
            getlatePostId: `mock-${Date.now()}-${post.platform}`, // Mock Getlate ID
          },
        })
      )
    );

    return NextResponse.json({ success: true, socialPosts });
  } catch (error) {
    console.error('Error publishing social posts:', error);
    return NextResponse.json({ error: 'Failed to publish social posts' }, { status: 500 });
  }
}
