import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getPerformanceAlerts, markAlertAsRead } from '@/lib/services/google-search-console-service';

/**
 * GET /api/client/gsc/alerts
 * Get performance alerts for a project
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
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

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

    // Get alerts
    const alerts = await getPerformanceAlerts(projectId, unreadOnly);

    return NextResponse.json({
      success: true,
      alerts,
      totalAlerts: alerts.length
    });
  } catch (error: any) {
    console.error('[API] GSC Alerts Error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/client/gsc/alerts
 * Mark alert as read
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const { alertId } = await req.json();

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is verplicht' },
        { status: 400 }
      );
    }

    // Verify alert ownership
    const alert = await prisma.performanceAlert.findUnique({
      where: { id: alertId },
      include: { project: true }
    });

    if (!alert || alert.project.client_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Alert niet gevonden' },
        { status: 404 }
      );
    }

    // Mark as read
    await markAlertAsRead(alertId);

    return NextResponse.json({
      success: true,
      message: 'Alert gemarkeerd als gelezen'
    });
  } catch (error: any) {
    console.error('[API] Mark Alert Read Error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
