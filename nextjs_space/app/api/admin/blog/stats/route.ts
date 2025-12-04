import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get counts by status
    const [totalPosts, publishedPosts, draftPosts, scheduledPosts] = await Promise.all([
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { status: 'published' } }),
      prisma.blogPost.count({ where: { status: 'draft' } }),
      prisma.blogPost.count({ where: { status: 'scheduled' } }),
    ]);

    // Get total views
    const viewsResult = await prisma.blogPost.aggregate({
      _sum: {
        views: true,
      },
    });
    const totalViews = viewsResult._sum.views || 0;

    // Get top performers (by views)
    const topPosts = await prisma.blogPost.findMany({
      where: { status: 'published' },
      orderBy: { views: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        views: true,
        publishedAt: true,
      },
    });

    // Get recent posts
    const recentPosts = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        createdAt: true,
      },
    });

    // Get posts by category
    const postsByCategory = await prisma.blogPost.groupBy({
      by: ['category'],
      _count: true,
    });

    return NextResponse.json({
      overview: {
        totalPosts,
        publishedPosts,
        draftPosts,
        scheduledPosts,
        totalViews,
      },
      topPosts,
      recentPosts,
      postsByCategory,
    });
  } catch (error) {
    console.error('Error fetching blog stats:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
