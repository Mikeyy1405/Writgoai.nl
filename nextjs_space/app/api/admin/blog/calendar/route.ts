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

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // Format: YYYY-MM
    const year = searchParams.get('year');

    let startDate: Date;
    let endDate: Date;

    if (month) {
      // Get posts for specific month
      const [yearNum, monthNum] = month.split('-').map(Number);
      startDate = new Date(yearNum, monthNum - 1, 1);
      endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);
    } else if (year) {
      // Get posts for specific year
      const yearNum = parseInt(year);
      startDate = new Date(yearNum, 0, 1);
      endDate = new Date(yearNum, 11, 31, 23, 59, 59);
    } else {
      // Get posts for current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // Get published posts
    const publishedPosts = await prisma.blogPost.findMany({
      where: {
        publishedAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'published',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        publishedAt: true,
        status: true,
        category: true,
      },
      orderBy: { publishedAt: 'asc' },
    });

    // Get scheduled posts
    const scheduledPosts = await prisma.blogPost.findMany({
      where: {
        scheduledFor: {
          gte: startDate,
          lte: endDate,
        },
        status: 'scheduled',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        scheduledFor: true,
        status: true,
        category: true,
      },
      orderBy: { scheduledFor: 'asc' },
    });

    // Get blog ideas with due dates
    const ideas = await prisma.blogIdea.findMany({
      where: {
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        status: true,
        priority: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json({
      publishedPosts,
      scheduledPosts,
      ideas,
      period: {
        start: startDate,
        end: endDate,
      },
    });
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
