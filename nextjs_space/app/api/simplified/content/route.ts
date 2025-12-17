import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';

/**
 * GET /api/simplified/content
 * 
 * Haalt alle content op voor de ingelogde gebruiker
 * Gebruikt voor de content overzicht pagina
 */
export async function GET(request: Request) {
  try {
    // Check authenticatie
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    // Vind client
    const client = await db.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }

    // Haal alle content op voor deze client
    const content = await db.savedContent.findMany({
      where: {
        project: {
          clientId: client.id,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            websiteUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limiteer tot laatste 100 items
    });

    return NextResponse.json({
      success: true,
      content: content.map(item => ({
        id: item.id,
        title: item.title,
        status: item.status,
        publishedAt: item.publishedAt,
        createdAt: item.createdAt,
        wordCount: item.wordCount,
        project: item.project,
      })),
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het ophalen van content' },
      { status: 500 }
    );
  }
}
