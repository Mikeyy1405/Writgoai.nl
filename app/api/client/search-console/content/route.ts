
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {
  getPerformanceData,
  getTopPages,
  getUrlInspectionData,
  type ExistingPageData
} from '@/lib/google-search-console';

/**
 * GET /api/client/search-console/content
 * 
 * Haalt alle existing content op van de website via Google Search Console:
 * - Welke pagina's bestaan er al?
 * - Hoe scoren ze (clicks, impressions, positie)?
 * - Welke keywords gebruiken ze?
 * - Welke pagina's moeten verbeterd worden?
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Haal projectId op uit query params
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Haal project op met GSC configuratie
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.websiteUrl) {
      return NextResponse.json(
        {
          error: 'Geen website URL gevonden',
          needsSetup: true,
          message: 'Configureer eerst een website URL voor dit project'
        },
        { status: 400 }
      );
    }

    // Normalize website URL for GSC (Google uses format: sc-domain:example.com or https://example.com)
    const siteUrl = project.websiteUrl.startsWith('http') 
      ? project.websiteUrl 
      : `https://${project.websiteUrl}`;

    console.log('[GSC Content] Fetching content for:', siteUrl);

    // Haal top pages op (laatste 90 dagen)
    const topPages = await getTopPages(siteUrl, 90, 100);

    if (!topPages || topPages.length === 0) {
      return NextResponse.json({
        success: true,
        pages: [],
        message: 'Geen content gevonden in Google Search Console. Dit kan betekenen dat je website nog geen traffic heeft of dat GSC nog data verzamelt.',
        needsWait: true
      });
    }

    // Verrijk elke pagina met extra data
    const enrichedPages: ExistingPageData[] = [];
    
    for (const page of topPages.slice(0, 50)) { // Limiteer tot 50 om performance te garanderen
      try {
        // Haal performance data op voor deze specifieke URL
        const perfData = await getPerformanceData(siteUrl, 90, page.url);
        
        // Haal URL inspection data op
        let inspectionData;
        try {
          inspectionData = await getUrlInspectionData(siteUrl, page.url);
        } catch (e) {
          console.log('[GSC Content] URL inspection failed for:', page.url);
          inspectionData = null;
        }

        enrichedPages.push({
          url: page.url,
          title: inspectionData?.pageTitle || page.url.split('/').pop() || 'Unknown',
          clicks: page.clicks,
          impressions: page.impressions,
          ctr: page.ctr,
          averagePosition: page.position,
          indexStatus: inspectionData?.indexStatus || 'UNKNOWN',
          lastCrawlTime: inspectionData?.lastCrawlTime,
          topKeywords: perfData?.topQueries.slice(0, 5).map(q => q.query) || [],
          isDuplicate: false, // TODO: Implement duplicate detection
          duplicateScore: 0
        });
      } catch (error) {
        console.error('[GSC Content] Error enriching page:', page.url, error);
        // Add page with basic data
        enrichedPages.push({
          url: page.url,
          title: page.url.split('/').pop() || 'Unknown',
          clicks: page.clicks,
          impressions: page.impressions,
          ctr: page.ctr,
          averagePosition: page.position,
          indexStatus: 'UNKNOWN',
          topKeywords: [],
          isDuplicate: false,
          duplicateScore: 0
        });
      }
    }

    // Sorteer op performance (clicks * impressions score)
    enrichedPages.sort((a, b) => {
      const scoreA = a.clicks * Math.log(a.impressions + 1);
      const scoreB = b.clicks * Math.log(b.impressions + 1);
      return scoreB - scoreA;
    });

    // Categoriseer content
    const highPerformers = enrichedPages.filter(
      p => p.clicks > 100 || p.averagePosition < 10
    );
    const needsImprovement = enrichedPages.filter(
      p => p.impressions > 100 && p.clicks < 10 && p.averagePosition > 20
    );
    const lowVisibility = enrichedPages.filter(
      p => p.impressions < 50
    );

    console.log('[GSC Content] Successfully fetched:', {
      total: enrichedPages.length,
      highPerformers: highPerformers.length,
      needsImprovement: needsImprovement.length,
      lowVisibility: lowVisibility.length
    });

    return NextResponse.json({
      success: true,
      pages: enrichedPages,
      summary: {
        totalPages: enrichedPages.length,
        highPerformers: highPerformers.length,
        needsImprovement: needsImprovement.length,
        lowVisibility: lowVisibility.length,
        totalClicks: enrichedPages.reduce((sum, p) => sum + p.clicks, 0),
        totalImpressions: enrichedPages.reduce((sum, p) => sum + p.impressions, 0),
        averageCTR: enrichedPages.reduce((sum, p) => sum + p.ctr, 0) / enrichedPages.length,
        averagePosition: enrichedPages.reduce((sum, p) => sum + p.averagePosition, 0) / enrichedPages.length
      },
      categories: {
        highPerformers,
        needsImprovement,
        lowVisibility
      }
    });

  } catch (error) {
    console.error('[GSC Content] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch content from Google Search Console',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
