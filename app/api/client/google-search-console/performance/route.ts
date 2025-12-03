
/**
 * Google Search Console Performance Data API
 * Haalt performance data op voor een project
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getProjectPerformance } from '@/lib/google-search-console';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const projectId = req.nextUrl.searchParams.get('projectId');
    const sortBy = (req.nextUrl.searchParams.get('sortBy') || 'clicks') as any;
    const order = (req.nextUrl.searchParams.get('order') || 'desc') as any;

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

    // Haal performance data op
    const performance = await getProjectPerformance(projectId, sortBy, order);

    // Bereken totalen
    const totals = {
      clicks: performance.reduce((sum, p) => sum + p.clicks, 0),
      impressions: performance.reduce((sum, p) => sum + p.impressions, 0),
      averageCTR: 0,
      averagePosition: 0,
    };

    if (performance.length > 0) {
      totals.averageCTR = performance.reduce((sum, p) => sum + p.ctr, 0) / performance.length;
      totals.averagePosition = performance.reduce((sum, p) => sum + p.averagePosition, 0) / performance.length;
    }

    return NextResponse.json({
      performance,
      totals,
      lastSync: project.googleSearchConsoleLastSync,
    });
  } catch (error: any) {
    console.error('GSC performance fetch error:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen performance data' },
      { status: 500 }
    );
  }
}
