import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Prisma } from '@/lib/supabase';

/**
 * POST /api/client/social/schedule
 * Plan een nieuwe social media post in
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { content, platform, scheduledAt, projectId } = body;

    // Validatie
    if (!content || !platform || !scheduledAt || !projectId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Valideer dat project bij client hoort
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Maak scheduled post
    const scheduledPost = await prisma.scheduledPost.create({
      data: {
        content,
        platform,
        scheduledAt: new Date(scheduledAt),
        status: 'scheduled',
        projectId,
        clientId: client.id,
      },
    });

    return NextResponse.json({
      success: true,
      post: scheduledPost,
    });
  } catch (error: any) {
    console.error('Error scheduling post:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to schedule post' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/client/social/schedule
 * Haal alle geplande posts op voor een project
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause with proper typing
    const where: Prisma.ScheduledPostWhereInput = {
      clientId: client.id,
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    if (platform) {
      where.platform = platform;
    }

    if (startDate && endDate) {
      where.scheduledAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Haal posts op
    const posts = await prisma.scheduledPost.findMany({
      where,
      orderBy: {
        scheduledAt: 'asc',
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      posts,
    });
  } catch (error: any) {
    console.error('Error fetching scheduled posts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch scheduled posts' },
      { status: 500 }
    );
  }
}
