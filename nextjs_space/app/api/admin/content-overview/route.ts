import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/content-overview - Get unified content overview
 * Returns all content (blogs, social posts, videos) from all clients
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email },
      select: { role: true }
    });
    
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    // Fetch all content from different tables
    const [savedContent, blogPosts, socialPosts] = await Promise.all([
      // SavedContent table
      prisma.savedContent.findMany({
        include: {
          client: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 1000, // Limit to prevent performance issues
      }),
      
      // BlogPost table (if exists)
      prisma.blogPost.findMany({
        include: {
          project: {
            include: {
              client: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }).catch(() => []), // Gracefully handle if table doesn't exist
      
      // SocialMediaPost table (if exists)
      prisma.socialMediaPost.findMany({
        include: {
          project: {
            include: {
              client: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }).catch(() => []), // Gracefully handle if table doesn't exist
    ]);
    
    // Normalize all content to a unified format
    const normalizedContent = [];
    
    // Add SavedContent items
    for (const item of savedContent) {
      normalizedContent.push({
        id: item.id,
        type: item.contentType || 'blog',
        title: item.title || 'Untitled',
        clientName: item.client.name,
        clientId: item.client.id,
        status: item.status || 'draft',
        createdAt: item.createdAt.toISOString(),
        publishedAt: item.publishedAt?.toISOString(),
        wordCount: item.wordCount,
      });
    }
    
    // Add BlogPost items
    for (const post of blogPosts) {
      if (post.project?.client) {
        normalizedContent.push({
          id: post.id,
          type: 'blog' as const,
          title: post.title || 'Untitled Blog',
          clientName: post.project.client.name,
          clientId: post.project.client.id,
          status: post.status || 'draft',
          createdAt: post.createdAt.toISOString(),
          publishedAt: post.publishedAt?.toISOString(),
          wordCount: post.wordCount,
        });
      }
    }
    
    // Add SocialMediaPost items
    for (const post of socialPosts) {
      if (post.project?.client) {
        normalizedContent.push({
          id: post.id,
          type: 'social' as const,
          title: post.caption?.substring(0, 50) || 'Social Post',
          clientName: post.project.client.name,
          clientId: post.project.client.id,
          status: post.status || 'draft',
          createdAt: post.createdAt.toISOString(),
          publishedAt: post.publishedAt?.toISOString(),
          platform: post.platform,
        });
      }
    }
    
    // Calculate stats
    const stats = {
      total: normalizedContent.length,
      blogs: normalizedContent.filter(c => c.type === 'blog').length,
      social: normalizedContent.filter(c => c.type === 'social').length,
      videos: normalizedContent.filter(c => c.type === 'video').length,
      published: normalizedContent.filter(c => c.status === 'published').length,
      draft: normalizedContent.filter(c => c.status === 'draft').length,
      scheduled: normalizedContent.filter(c => c.status === 'scheduled').length,
    };
    
    return NextResponse.json({
      content: normalizedContent,
      stats,
    });
  } catch (error) {
    console.error('Failed to fetch content overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content overview' },
      { status: 500 }
    );
  }
}
