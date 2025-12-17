import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { fetchAllContent, getContentStats } from '@/lib/services/wordpress-content-fetcher';

/**
 * GET /api/simplified/content
 * 
 * Haalt alle content op voor de ingelogde gebruiker
 * Combineert:
 * - Gegenereerde content (SavedContent tabel)
 * - Gepubliceerde WordPress posts (via sitemap)
 * 
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
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }

    console.log(`[Content API] Fetching all content for client ${client.id}`);

    // Haal alle content op (WordPress + Gegenereerd)
    const [allContent, stats] = await Promise.all([
      fetchAllContent(client.id),
      getContentStats(client.id),
    ]);

    console.log(`[Content API] Fetched ${allContent.length} total items (Generated: ${stats.generated}, WordPress: ${stats.wordpress})`);

    return NextResponse.json({
      success: true,
      content: allContent,
      stats: stats,
    });
  } catch (error) {
    console.error('[Content API] Error fetching content:', error);
    return NextResponse.json(
      { 
        error: 'Er is een fout opgetreden bij het ophalen van content',
        details: error instanceof Error ? error.message : 'Onbekende fout'
      },
      { status: 500 }
    );
  }
}
