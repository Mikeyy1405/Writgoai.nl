import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getTopPerformingUrls, getUrlPerformance } from '@/lib/services/google-search-console-service';

/**
 * GET /api/client/gsc/performance
 * Get GSC performance data for a project
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
    const url = searchParams.get('url');
    const days = parseInt(searchParams.get('days') || '30');
    const limit = parseInt(searchParams.get('limit') || '50');

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

    // If specific URL requested, get its performance
    if (url) {
      const urlPerformance = await getUrlPerformance(projectId, url, days);
      return NextResponse.json({
        success: true,
        url,
        performance: urlPerformance
      });
    }

    // Otherwise get top performing URLs
    const topUrls = await getTopPerformingUrls(projectId, days, limit);

    return NextResponse.json({
      success: true,
      topUrls,
      dateRange: {
        days,
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      }
    });
  } catch (error: any) {
    console.error('[API] GSC Performance Error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
