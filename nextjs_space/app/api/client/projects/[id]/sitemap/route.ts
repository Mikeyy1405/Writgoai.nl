
export const dynamic = "force-dynamic";
/**
 * Project Sitemap API
 * GET: Load sitemap URLs
 * POST: Rescan website for updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient, isAuthError } from '@/lib/auth-helpers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { scanWebsite } from '@/lib/website-scanner';

// Helper functie voor client en project validatie
async function validateClientAndProject(email: string, projectId: string) {
  const client = await prisma.client.findUnique({
    where: { email },
  });

  if (!client) {
    return { error: 'Client niet gevonden', status: 404 };
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      clientId: client.id,
    },
  });

  if (!project) {
    return { error: 'Project niet gevonden', status: 404 };
  }

  return { client, project };
}

// GET - Load sitemap URLs
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthenticatedClient();
    
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.error }, 
        { status: auth.status }
      );
    }

    // Use client.id (from Client table), NOT session.user.id
    const clientId = auth.client.id;
    const projectId = params.id;

    // Get project with sitemap URL
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        clientId, // Ensure user owns this project
      },
      select: {
        websiteUrl: true,
        sitemapScannedAt: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    // Determine sitemap URL (always use default sitemap.xml path)
    const sitemapUrl = project.websiteUrl ? `${project.websiteUrl}/sitemap.xml` : null;

    if (!sitemapUrl) {
      return NextResponse.json(
        { error: 'Geen sitemap URL geconfigureerd voor dit project' },
        { status: 400 }
      );
    }

    console.log('📄 Loading sitemap:', sitemapUrl);

    // Fetch and parse sitemap
    const response = await fetch(sitemapUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch sitemap');
    }

    const xmlText = await response.text();
    
    // Simple XML parsing to extract URLs
    const urlMatches = xmlText.match(/<loc>(.*?)<\/loc>/g);
    const urls = urlMatches
      ? urlMatches.map(match => match.replace(/<\/?loc>/g, '').trim())
      : [];

    console.log(`✅ Found ${urls.length} URLs in sitemap`);

    return NextResponse.json({
      success: true,
      urls,
      sitemapUrl,
      lastScanned: project.sitemapScannedAt,
      total: urls.length,
    });

  } catch (error: any) {
    console.error('Sitemap load error:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij laden van sitemap' },
      { status: 500 }
    );
  }
}

// POST - Rescan website for updates
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const validation = await validateClientAndProject(session.user.email, params.id);
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { project } = validation;

    // Check action parameter
    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get('action') || 'scan';

    if (action === 'scan' || action === 'rescan') {
      // Scan website
      const scanResult = await scanWebsite(project.websiteUrl);
      
      // Update project with scan results
      await prisma.project.update({
        where: { id: project.id },
        data: {
          targetAudience: scanResult.websiteAnalysis.targetAudience,
          brandVoice: scanResult.websiteAnalysis.toneOfVoice,
          niche: scanResult.nicheAnalysis.primaryNiche,
          keywords: scanResult.nicheAnalysis.keywords,
          contentPillars: scanResult.contentStrategy.contentPillars,
          sitemapScannedAt: new Date(),
        },
      });
      
      return NextResponse.json({
        success: true,
        message: 'Website opnieuw gescand!',
        scanResult,
        scannedAt: new Date(),
      });
    }

    return NextResponse.json(
      { error: 'Ongeldige action parameter' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error rescanning website:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het scannen' },
      { status: 500 }
    );
  }
}
