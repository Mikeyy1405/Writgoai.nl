import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getGoogleUpdates, getProjectUpdateImpact, getRecentUpdates } from '@/lib/services/google-updates-tracker';

/**
 * GET /api/client/gsc/updates
 * Get Google algorithm updates and their impact
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
    const recentOnly = searchParams.get('recentOnly') === 'true';

    // If project ID provided, get impact analysis for that project
    if (projectId) {
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

      const impact = await getProjectUpdateImpact(projectId);
      return NextResponse.json({
        success: true,
        projectId,
        impact
      });
    }

    // Otherwise get all updates
    const updates = recentOnly ? await getRecentUpdates() : await getGoogleUpdates(50);

    return NextResponse.json({
      success: true,
      updates,
      totalUpdates: updates.length
    });
  } catch (error: any) {
    console.error('[API] Google Updates Error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
