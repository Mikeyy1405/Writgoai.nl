import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET - Fetch queue of scheduled posts
 * Query params: projectId
 */
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Verify project belongs to client
    const project = await prisma.project.findUnique({
      where: { id: projectId, clientId: client.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get scheduled posts ordered by scheduled time
    const queue = await prisma.socialMediaPost.findMany({
      where: {
        projectId,
        status: 'scheduled',
        scheduledFor: {
          gte: new Date(), // Only future posts
        },
      },
      orderBy: { scheduledFor: 'asc' },
    });

    // Group by day (skip posts without scheduledFor date)
    const queueByDay = queue.reduce((acc, post) => {
      if (!post.scheduledFor) {
        return acc; // Skip posts without a scheduled date
      }
      const day = post.scheduledFor.toISOString().split('T')[0];
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(post);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      queue,
      queueByDay,
      totalScheduled: queue.length,
    });

  } catch (error: any) {
    console.error('Error fetching queue:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch queue' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Reorder queue (drag & drop)
 * Body: { projectId, postIds: string[] }
 */
export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    const { projectId, postIds } = body;

    if (!projectId || !Array.isArray(postIds)) {
      return NextResponse.json(
        { error: 'Project ID and postIds array are required' },
        { status: 400 }
      );
    }

    // Verify project belongs to client
    const project = await prisma.project.findUnique({
      where: { id: projectId, clientId: client.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get existing scheduled times
    const posts = await prisma.socialMediaPost.findMany({
      where: {
        id: { in: postIds },
        projectId,
        status: 'scheduled',
      },
      orderBy: { scheduledFor: 'asc' },
    });

    if (posts.length !== postIds.length) {
      return NextResponse.json(
        { error: 'Some posts not found or not scheduled' },
        { status: 404 }
      );
    }

    // Extract all scheduled times
    const scheduledTimes = posts.map(p => p.scheduledFor).filter(Boolean);

    // Reorder: assign new scheduled times based on new order
    const updates = postIds.map((postId, index) => {
      return prisma.socialMediaPost.update({
        where: { id: postId },
        data: { scheduledFor: scheduledTimes[index] },
      });
    });

    await Promise.all(updates);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error reordering queue:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reorder queue' },
      { status: 500 }
    );
  }
}
