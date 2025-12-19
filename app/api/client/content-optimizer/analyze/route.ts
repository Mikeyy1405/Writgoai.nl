export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Analyze WordPress Posts API
 * Analyzes all posts in a project for SEO optimization opportunities
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { analyzeProjectPosts } from '@/lib/autopilot/content-optimizer';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { projectId, postId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true },
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
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Analyze posts
    const posts = await analyzeProjectPosts(projectId);

    // Filter by specific post if provided
    const filteredPosts = postId
      ? posts.filter((post) => post.id === parseInt(postId))
      : posts;

    return NextResponse.json({
      posts: filteredPosts,
      total: filteredPosts.length,
      optimizable: filteredPosts.filter((post) => post.canOptimize).length,
    });
  } catch (error: any) {
    console.error('Error analyzing posts:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to analyze posts',
      },
      { status: 500 }
    );
  }
}
