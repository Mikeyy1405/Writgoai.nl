

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { fetchWordPressCategories } from '@/lib/wordpress-publisher';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is verplicht' }, { status: 400 });
    }

    // Find client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Get project with WordPress config
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
      select: {
        wordpressUrl: true,
        wordpressUsername: true,
        wordpressPassword: true,
      },
    });

    if (!project || !project.wordpressUrl || !project.wordpressUsername || !project.wordpressPassword) {
      return NextResponse.json({ 
        error: 'WordPress configuratie niet gevonden voor dit project',
        categories: [] 
      }, { status: 400 });
    }

    // Fetch categories from WordPress
    const categories = await fetchWordPressCategories({
      siteUrl: project.wordpressUrl,
      username: project.wordpressUsername,
      applicationPassword: project.wordpressPassword,
    });

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Error fetching WordPress categories:', error);
    return NextResponse.json({
      error: 'Fout bij ophalen van categorieën',
      details: error.message,
      categories: []
    }, { status: 500 });
  }
}
