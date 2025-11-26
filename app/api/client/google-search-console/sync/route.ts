
/**
 * Google Search Console Data Sync API
 * Synchroniseert performance data van GSC
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { syncProjectGSCData } from '@/lib/google-search-console';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId } = body;

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

    if (!project.googleSearchConsoleEnabled) {
      return NextResponse.json(
        { error: 'Google Search Console is niet ingeschakeld' },
        { status: 400 }
      );
    }

    // Sync GSC data
    await syncProjectGSCData(projectId, client.id);

    // Haal aantal gesyncte URLs op
    const performanceCount = await prisma.searchConsolePerformance.count({
      where: { projectId },
    });

    return NextResponse.json({
      success: true,
      message: `${performanceCount} URLs gesynchroniseerd`,
      syncedAt: new Date(),
      urlCount: performanceCount,
    });
  } catch (error: any) {
    console.error('GSC sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij synchroniseren data' },
      { status: 500 }
    );
  }
}
