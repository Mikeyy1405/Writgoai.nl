import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/simplified/stats
 * Haal statistieken op voor de ingelogde gebruiker
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Tel projecten
    const totalProjects = await prisma.project.count({
      where: { clientId: client.id, isActive: true },
    });

    // Tel content deze maand
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const contentThisMonth = await prisma.savedContent.count({
      where: {
        clientId: client.id,
        createdAt: { gte: startOfMonth },
      },
    });

    // Tel gepubliceerde artikelen
    const publishedArticles = await prisma.savedContent.count({
      where: {
        clientId: client.id,
        publishedAt: { not: null },
      },
    });

    // Haal recente content op
    const recentContent = await prisma.savedContent.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        type: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      totalProjects,
      contentThisMonth,
      publishedArticles,
      recentContent,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
