
/**
 * Project Sitemap Loader API
 * Loads sitemap URLs for a specific project
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.id;

    // Get project with sitemap URL
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        clientId: session.user.id, // Ensure user owns this project
      },
      select: {
        websiteUrl: true,
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
    });

  } catch (error: any) {
    console.error('Sitemap load error:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij laden van sitemap' },
      { status: 500 }
    );
  }
}
