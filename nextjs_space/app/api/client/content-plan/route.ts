/**
 * Content Plan API Route
 * 
 * GET: Retrieve existing content plan and article ideas for a project
 * Wrapper for the planning API to maintain backward compatibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/client/content-plan?projectId=xxx
 * Retrieve existing content plan and ideas
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId, clientId: client.id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get article ideas for this project
    const ideas = await prisma.articleIdea.findMany({
      where: {
        clientId: client.id,
        projectId: projectId
      },
      include: {
        savedContent: {
          select: {
            id: true,
            publishedUrl: true,
            publishedAt: true,
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { aiScore: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        websiteUrl: project.websiteUrl,
        niche: project.niche,
      },
      ideas,
      hasData: ideas.length > 0,
    });

  } catch (error: any) {
    console.error('[content-plan] Get error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get content plan',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
