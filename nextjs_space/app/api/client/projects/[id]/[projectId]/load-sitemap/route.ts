

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { updateProjectSitemap } from '@/lib/sitemap-loader';
import { prisma } from '@/lib/db';


export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: { projects: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const projectId = params.projectId || params.id;
    const project = client.projects.find(p => p.id === projectId);

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden of geen toegang' }, { status: 404 });
    }

    console.log('Loading sitemap for project:', project.name);

    // Load and save sitemap
    const sitemapData = await updateProjectSitemap(projectId);

    return NextResponse.json({
      success: true,
      sitemap: sitemapData,
      message: `Sitemap geladen: ${sitemapData.totalPages} pagina's gevonden`,
    });

  } catch (error: any) {
    console.error('Error loading sitemap:', error);
    return NextResponse.json(
      { 
        error: 'Sitemap laden mislukt', 
        details: error?.message || 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: { projects: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const projectId = params.projectId || params.id;
    const project = client.projects.find(p => p.id === projectId);

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden of geen toegang' }, { status: 404 });
    }

    // Return current sitemap data
    return NextResponse.json({
      sitemap: project.sitemap,
      sitemapScannedAt: project.sitemapScannedAt,
      hasData: !!project.sitemap,
    });

  } catch (error: any) {
    console.error('Error getting sitemap:', error);
    return NextResponse.json(
      { error: 'Sitemap ophalen mislukt' },
      { status: 500 }
    );
  }
}
