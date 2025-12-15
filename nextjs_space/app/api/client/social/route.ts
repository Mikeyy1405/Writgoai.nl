import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET - Fetch all social media posts with filters
 * Query params: projectId, status, platform, dateFrom, dateTo
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
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
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

    // Build filter query
    const where: any = { projectId };

    if (status) {
      where.status = status;
    }

    if (platform) {
      where.platform = platform;
    }

    if (dateFrom || dateTo) {
      where.scheduledFor = {};
      if (dateFrom) {
        where.scheduledFor.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.scheduledFor.lte = new Date(dateTo);
      }
    }

    // Get filtered posts
    const posts = await prisma.socialMediaPost.findMany({
      where,
      include: {
        sourceIdea: {
          select: {
            id: true,
            title: true,
            contentType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error('Error fetching social media posts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new social media post (with optional AI generation)
 * Body: { content, platform, scheduledFor, useAI?, topic?, tone?, includeHashtags? }
 */
export async function POST(req: NextRequest) {
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
    const { projectId, content, platform, platforms, scheduledFor, media, useAI, topic, tone, includeHashtags } = body;

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

    // If AI generation is requested
    if (useAI && topic) {
      // Generate content using AI
      const targetPlatforms = platforms || [platform];
      
      // TODO: Implement AI content generation
      // For now, return placeholder
      return NextResponse.json({ 
        success: true, 
        message: 'AI generation not yet implemented',
        posts: []
      });
    }

    // Create post directly
    if (!content || !platform) {
      return NextResponse.json({ error: 'Content and platform are required' }, { status: 400 });
    }

    const post = await prisma.socialMediaPost.create({
      data: {
        projectId,
        content,
        platform,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        status: scheduledFor ? 'scheduled' : 'draft',
        media: media || [],
      },
    });

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error('Error creating social media post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create post' },
      { status: 500 }
    );
  }
}
