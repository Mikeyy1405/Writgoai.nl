import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/client/content-research
 * Get existing content research/strategy for a project
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is verplicht' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client_id: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    // Get content strategy from project settings
    const projectSettings = await prisma.projectSettings.findFirst({
      where: {
        project_id: projectId,
      },
    });

    // Get article ideas from saved content
    const articleIdeas = await prisma.savedContent.findMany({
      where: {
        project_id: projectId,
        client_id: session.user.id,
        status: 'idea',
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 50,
    });

    const contentStrategy = projectSettings?.content_strategy || project.content_strategy || null;

    return NextResponse.json({
      success: true,
      hasData: !!(contentStrategy || articleIdeas.length > 0),
      contentStrategy,
      articleIdeas,
      project: {
        id: project.id,
        name: project.name,
        website: project.website,
        keywords: project.target_keywords,
      },
    });
  } catch (error) {
    console.error('[API] Error fetching content research:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het ophalen van content research' },
      { status: 500 }
    );
  }
}
