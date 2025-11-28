import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getSitePlan } from '@/lib/db/content-planning';
import { getProjectForClient } from '@/lib/db/projects';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/projects/[id]/site-plan
 * Get the site plan for a project
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const projectId = resolvedParams.id;

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get client from email
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // 2. Check project access
    const project = await getProjectForClient(projectId, client.id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 3. Get site plan
    const sitePlan = await getSitePlan(projectId);

    if (!sitePlan) {
      return NextResponse.json({
        success: true,
        sitePlan: null,
        message: 'No site plan found for this project',
      });
    }

    return NextResponse.json({
      success: true,
      sitePlan,
    });

  } catch (error) {
    console.error('[Site Plan GET] Error:', error);
    return NextResponse.json({
      error: 'Er is een fout opgetreden',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
