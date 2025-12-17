import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { syncGSCData } from '@/lib/services/google-search-console-service';

/**
 * POST /api/client/gsc/sync
 * Trigger GSC data sync for a project
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const { projectId } = await req.json();

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

    // Check if GSC is connected
    if (!project.google_search_console_token) {
      return NextResponse.json(
        { error: 'Google Search Console niet verbonden', needsConnection: true },
        { status: 400 }
      );
    }

    // Trigger sync
    const result = await syncGSCData(projectId);

    return NextResponse.json({
      success: true,
      message: 'GSC data sync gestart',
      ...result
    });
  } catch (error: any) {
    console.error('[API] GSC Sync Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden bij het synchroniseren' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/client/gsc/sync
 * Get sync status for a project
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

    // Get sync status
    const syncStatus = await prisma.gSCSyncStatus.findUnique({
      where: { projectId }
    });

    return NextResponse.json({
      success: true,
      syncStatus: syncStatus || null
    });
  } catch (error: any) {
    console.error('[API] GSC Sync Status Error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
