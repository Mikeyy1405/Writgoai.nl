
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * Linkbuilding Settings API
 * GET/POST /api/client/linkbuilding/settings
 * 
 * Beheer linkbuilding instellingen voor de client
 */

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        linkbuildingEnabled: true,
        linkbuildingLinksGiven: {
          select: {
            id: true,
            targetArticleTitle: true,
            targetArticleUrl: true,
            anchorText: true,
            creditsCharged: true,
            insertedAt: true,
            status: true,
          },
          orderBy: { insertedAt: 'desc' },
          take: 20,
        },
        linkbuildingLinksReceived: {
          select: {
            id: true,
            sourceArticleTitle: true,
            sourceArticleUrl: true,
            anchorText: true,
            insertedAt: true,
            status: true,
          },
          orderBy: { insertedAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Bereken statistieken
    const stats = {
      linksGiven: client.linkbuildingLinksGiven.length,
      linksReceived: client.linkbuildingLinksReceived.length,
      totalCreditsSpent: client.linkbuildingLinksGiven.reduce((sum, link) => sum + link.creditsCharged, 0),
      activeLinksGiven: client.linkbuildingLinksGiven.filter(l => l.status === 'active').length,
      activeLinksReceived: client.linkbuildingLinksReceived.filter(l => l.status === 'active').length,
    };

    return NextResponse.json({
      success: true,
      enabled: client.linkbuildingEnabled,
      stats,
      linksGiven: client.linkbuildingLinksGiven,
      linksReceived: client.linkbuildingLinksReceived,
    });

  } catch (error: any) {
    console.error('Get linkbuilding settings error:', error);
    return NextResponse.json({
      error: 'Er is een fout opgetreden',
      details: error.message,
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const body = await req.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Ongeldige waarde voor enabled' }, { status: 400 });
    }

    await prisma.client.update({
      where: { id: client.id },
      data: { linkbuildingEnabled: enabled },
    });

    return NextResponse.json({
      success: true,
      message: enabled ? 'Linkbuilding ingeschakeld' : 'Linkbuilding uitgeschakeld',
      enabled,
    });

  } catch (error: any) {
    console.error('Update linkbuilding settings error:', error);
    return NextResponse.json({
      error: 'Er is een fout opgetreden',
      details: error.message,
    }, { status: 500 });
  }
}
