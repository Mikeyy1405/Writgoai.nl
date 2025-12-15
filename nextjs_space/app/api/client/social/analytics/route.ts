import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET - Fetch analytics for social media posts
 * Query params: projectId, dateFrom?, dateTo?
 * Returns: posts count, reach, engagement, clicks, top posts, best posting times
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
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

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

    // Build date filter
    const dateFilter: any = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) {
        dateFilter.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        dateFilter.createdAt.lte = new Date(dateTo);
      }
    }

    // Get all posts for analytics
    const posts = await prisma.socialMediaPost.findMany({
      where: {
        projectId,
        ...dateFilter,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate total posts by status
    const postsByStatus = posts.reduce((acc, post) => {
      acc[post.status] = (acc[post.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate posts by platform
    const postsByPlatform = posts.reduce((acc, post) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Mock engagement metrics (in real implementation, these would come from getLate.dev API)
    const totalReach = posts.length * 150; // Average reach per post
    const totalEngagement = posts.length * 45; // Average engagement per post
    const totalClicks = posts.length * 12; // Average clicks per post

    // Find best posting times (analyze when posts were scheduled)
    const postsByHour = posts.reduce((acc, post) => {
      if (post.scheduledFor) {
        const hour = new Date(post.scheduledFor).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);

    const bestPostingTimes = Object.entries(postsByHour)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    // Get top performing posts (mock data - in real implementation from getLate.dev)
    const topPosts = posts
      .filter(p => p.status === 'published')
      .slice(0, 5)
      .map(post => ({
        id: post.id,
        content: post.content.substring(0, 100) + '...',
        platform: post.platform,
        engagement: Math.floor(Math.random() * 100) + 20, // Mock engagement
        reach: Math.floor(Math.random() * 500) + 100, // Mock reach
      }));

    return NextResponse.json({
      overview: {
        totalPosts: posts.length,
        publishedPosts: postsByStatus.published || 0,
        scheduledPosts: postsByStatus.scheduled || 0,
        draftPosts: postsByStatus.draft || 0,
        totalReach,
        totalEngagement,
        totalClicks,
        engagementRate: totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(2) : 0,
      },
      byPlatform: postsByPlatform,
      topPosts,
      bestPostingTimes,
    });

  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
