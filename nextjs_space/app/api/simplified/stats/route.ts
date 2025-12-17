import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { fetchAllContent, getContentStats } from '@/lib/services/wordpress-content-fetcher';

export const dynamic = 'force-dynamic';

/**
 * GET /api/simplified/stats
 * Haal statistieken op voor de ingelogde gebruiker
 * Inclusief WordPress content via sitemap
 */
export async function GET(request: NextRequest) {
  try {
    // Check session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('[Stats API] No session or email found');
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Je moet ingelogd zijn om statistieken te bekijken' 
      }, { status: 401 });
    }

    console.log('[Stats API] Fetching stats for email:', session.user.email);

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      console.error('[Stats API] Client not found for email:', session.user.email);
      return NextResponse.json({ 
        error: 'Client not found',
        message: 'Gebruiker niet gevonden. Neem contact op met support.'
      }, { status: 404 });
    }

    console.log('[Stats API] Client found, ID:', client.id);

    // Tel projecten
    const totalProjects = await prisma.project.count({
      where: { 
        clientId: client.id,
        isActive: true,
      },
    });
    console.log('[Stats API] Total projects:', totalProjects);

    // Haal alle content op (WordPress + Gegenereerd) via de service
    const allContent = await fetchAllContent(client.id);
    const stats = await getContentStats(client.id);

    // Tel content deze maand (alleen gegenereerde content)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const contentThisMonth = allContent.filter(c => {
      const contentDate = c.createdAt || c.publishedDate;
      return contentDate && new Date(contentDate) >= startOfMonth;
    }).length;

    console.log('[Stats API] Content this month:', contentThisMonth);

    // Tel gepubliceerde artikelen (WordPress + Gegenereerd)
    const publishedArticles = stats.published;
    console.log('[Stats API] Published articles (WordPress + Generated):', publishedArticles);

    // Haal recente content op (top 5)
    const recentContent = allContent.slice(0, 5).map(item => ({
      id: item.id,
      title: item.title,
      status: item.status,
      publishedAt: item.publishedDate?.toISOString() || null,
      createdAt: item.createdAt?.toISOString() || item.publishedDate?.toISOString() || new Date().toISOString(),
      project: {
        name: item.projectName,
      },
    }));

    console.log('[Stats API] Recent content count:', recentContent.length);
    console.log('[Stats API] Successfully fetched all stats');
    
    return NextResponse.json({
      totalProjects,
      contentThisMonth,
      publishedArticles,
      recentContent,
    });
  } catch (error) {
    console.error('[Stats API] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[Stats API] Error details:', {
      message: errorMessage,
      stack: errorStack,
      type: error?.constructor?.name
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch stats',
        message: 'Er is een onverwachte fout opgetreden bij het ophalen van statistieken',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
