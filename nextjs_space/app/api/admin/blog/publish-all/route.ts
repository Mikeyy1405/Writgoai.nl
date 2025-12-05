import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * POST /api/admin/blog/publish-all
 * Publishes all draft BlogPost records and sets publishedAt if not set
 * Admin only endpoint
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Niet geauthenticeerd' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isAdmin = session.user.email === 'info@writgo.nl' || session.user.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Alleen admins hebben toegang tot deze functie' },
        { status: 403 }
      );
    }

    // Define the condition for posts that need publishing
    const needsPublishingCondition = {
      OR: [
        { status: { not: 'published' } },
        { publishedAt: null },
      ],
    };

    // Get all posts that need to be published
    const postsToPublish = await prisma.blogPost.findMany({
      where: needsPublishingCondition,
      select: {
        id: true,
        title: true,
        status: true,
        publishedAt: true,
      },
    });

    console.log(`[Publish All] Found ${postsToPublish.length} posts to update`);

    // Update all posts
    const publishedCount = await prisma.blogPost.updateMany({
      where: needsPublishingCondition,
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    });

    console.log(`[Publish All] Updated ${publishedCount.count} posts to published status`);

    return NextResponse.json({
      success: true,
      published: publishedCount.count,
      posts: postsToPublish.map(p => ({
        id: p.id,
        title: p.title,
        previousStatus: p.status,
        hadPublishedAt: !!p.publishedAt,
      })),
      message: `${publishedCount.count} artikelen succesvol gepubliceerd`,
    });
  } catch (error: any) {
    console.error('[Publish All] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Kon artikelen niet publiceren',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
