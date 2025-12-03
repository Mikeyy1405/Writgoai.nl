
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Statistieken van content library
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Get counts per type
    const contentByType = await prisma.savedContent.groupBy({
      by: ['type'],
      where: {
        clientId: client.id,
        isArchived: false,
      },
      _count: true,
    });

    // Get total stats
    const totalContent = await prisma.savedContent.count({
      where: {
        clientId: client.id,
        isArchived: false,
      },
    });

    const totalFavorites = await prisma.savedContent.count({
      where: {
        clientId: client.id,
        isFavorite: true,
        isArchived: false,
      },
    });

    const totalArchived = await prisma.savedContent.count({
      where: {
        clientId: client.id,
        isArchived: true,
      },
    });

    // Get total word count
    const wordCountStats = await prisma.savedContent.aggregate({
      where: {
        clientId: client.id,
        isArchived: false,
      },
      _sum: {
        wordCount: true,
      },
    });

    const stats = {
      total: totalContent,
      favorites: totalFavorites,
      archived: totalArchived,
      totalWords: wordCountStats._sum.wordCount || 0,
      byType: contentByType.reduce((acc: any, item: any) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het ophalen van statistieken' },
      { status: 500 }
    );
  }
}
