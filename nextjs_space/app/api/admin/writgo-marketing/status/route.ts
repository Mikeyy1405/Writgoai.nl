import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { isUserAdmin } from '@/lib/navigation-config';

/**
 * GET /api/admin/writgo-marketing/status
 * Gets the status of Writgo.nl marketing setup and automation
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isUserAdmin(session.user.email, session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find Writgo.nl client
    const writgoClient = await prisma.client.findFirst({
      where: {
        OR: [
          { email: 'marketing@writgo.nl' },
          { companyName: 'Writgo.nl' }
        ]
      },
      include: {
        lateDevAccounts: {
          where: { isActive: true }
        }
      }
    });

    if (!writgoClient) {
      return NextResponse.json({
        isSetup: false,
        hasContentPlan: false,
        hasSocialAccounts: false,
        automationActive: false,
        stats: {
          blogsThisMonth: 0,
          socialPostsThisMonth: 0,
          totalBlogs: 0,
          totalSocialPosts: 0
        }
      });
    }

    // Get blog post count from BlogPost table
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const blogsThisMonth = await prisma.blogPost.count({
      where: {
        authorName: 'Writgo.nl',
        createdAt: {
          gte: firstDayOfMonth
        }
      }
    });

    const totalBlogs = await prisma.blogPost.count({
      where: {
        authorName: 'Writgo.nl'
      }
    });

    // Get social posts count
    const socialPostsThisMonth = await prisma.contentPiece.count({
      where: {
        clientId: writgoClient.id,
        contentType: 'social',
        createdAt: {
          gte: firstDayOfMonth
        }
      }
    });

    const totalSocialPosts = await prisma.contentPiece.count({
      where: {
        clientId: writgoClient.id,
        contentType: 'social'
      }
    });

    // Get recent content
    const recentBlogs = await prisma.blogPost.findMany({
      where: {
        authorName: 'Writgo.nl'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        publishedAt: true
      }
    });

    const recentSocial = await prisma.contentPiece.findMany({
      where: {
        clientId: writgoClient.id,
        contentType: 'social'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        title: true,
        platform: true,
        status: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      isSetup: true,
      hasContentPlan: !!writgoClient.contentPlan,
      hasSocialAccounts: writgoClient.lateDevAccounts.length > 0,
      automationActive: writgoClient.automationActive,
      lastPlanGenerated: writgoClient.lastPlanGenerated,
      stats: {
        blogsThisMonth,
        socialPostsThisMonth,
        totalBlogs,
        totalSocialPosts
      },
      recentContent: {
        blogs: recentBlogs,
        social: recentSocial
      },
      client: {
        id: writgoClient.id,
        email: writgoClient.email,
        name: writgoClient.name,
        website: writgoClient.website,
        automationActive: writgoClient.automationActive,
        automationStartDate: writgoClient.automationStartDate
      }
    });
  } catch (error) {
    console.error('Error fetching Writgo marketing status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
