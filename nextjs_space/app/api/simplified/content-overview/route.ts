import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { fetchAllContent } from '@/lib/services/wordpress-content-fetcher';

export const dynamic = 'force-dynamic';

/**
 * GET /api/simplified/content-overview
 * Haal alle content op voor de ingelogde gebruiker
 * Inclusief WordPress content en gegenereerde content
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Je moet ingelogd zijn' },
        { status: 401 }
      );
    }

    console.log('[Content Overview API] Fetching content for:', session.user.email);

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found', message: 'Gebruiker niet gevonden' },
        { status: 404 }
      );
    }

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const projectId = searchParams.get('projectId');
    const limit = searchParams.get('limit');

    console.log('[Content Overview API] Filters:', { status, projectId, limit });

    // Haal alle content op (WordPress + Gegenereerd)
    let allContent = await fetchAllContent(client.id);

    // Apply filters
    if (status && status !== 'all') {
      allContent = allContent.filter(item => item.status === status);
    }

    if (projectId) {
      allContent = allContent.filter(item => item.projectId === projectId);
    }

    // Apply limit
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum)) {
        allContent = allContent.slice(0, limitNum);
      }
    }

    console.log('[Content Overview API] Returning', allContent.length, 'items');

    // Calculate statistics
    const stats = {
      total: allContent.length,
      generated: allContent.filter(c => c.source === 'generated').length,
      wordpress: allContent.filter(c => c.source === 'wordpress').length,
      published: allContent.filter(c => c.status === 'published').length,
      draft: allContent.filter(c => c.status === 'draft').length,
    };

    return NextResponse.json({
      success: true,
      data: allContent,
      stats,
      meta: {
        total: allContent.length,
        filters: { status, projectId, limit },
      },
    });
  } catch (error) {
    console.error('[Content Overview API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        error: 'Failed to fetch content',
        message: 'Er is een fout opgetreden bij het ophalen van content',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
