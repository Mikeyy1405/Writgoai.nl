
/**
 * Google Search Console Trends API
 * Haalt historische performance data op voor grafieken
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const projectId = req.nextUrl.searchParams.get('projectId');
    const startDate = req.nextUrl.searchParams.get('startDate');
    const endDate = req.nextUrl.searchParams.get('endDate');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID ontbreekt' }, { status: 400 });
    }

    // Zoek client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Valideer project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Parse dates
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Haal performance data op gegroepeerd per dag
    const trends = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE(dataDate) as date,
        SUM(clicks) as clicks,
        SUM(impressions) as impressions,
        AVG(ctr) as ctr,
        AVG(averagePosition) as averagePosition
      FROM SearchConsolePerformance
      WHERE projectId = ${projectId}
        AND dataDate >= ${start}
        AND dataDate <= ${end}
      GROUP BY DATE(dataDate)
      ORDER BY DATE(dataDate) ASC
    `;

    // Format data voor frontend
    const formattedTrends = trends.map((trend: any) => ({
      date: trend.date instanceof Date 
        ? trend.date.toISOString().split('T')[0]
        : trend.date,
      clicks: Number(trend.clicks) || 0,
      impressions: Number(trend.impressions) || 0,
      ctr: Number(trend.ctr) || 0,
      averagePosition: Number(trend.averagePosition) || 0,
    }));

    return NextResponse.json({
      success: true,
      trends: formattedTrends,
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
    });
  } catch (error: any) {
    console.error('Error fetching GSC trends:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij ophalen trends' },
      { status: 500 }
    );
  }
}
