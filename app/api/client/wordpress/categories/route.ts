import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { fetchWordPressCategories } from '@/lib/wordpress-publisher';

// GET - Haal WordPress categorieën op voor een specifiek project
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is verplicht' }, { status: 400 });
    }

    // Get the project and verify it belongs to this client
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: {
          email: session.user.email
        }
      },
      select: {
        wordpressUrl: true,
        wordpressUsername: true,
        wordpressPassword: true,
      },
    });

    if (!project) {
      // Try legacy client config as fallback
      if (projectId === 'client-legacy') {
        const client = await prisma.client.findUnique({
          where: { email: session.user.email },
          select: {
            wordpressUrl: true,
            wordpressUsername: true,
            wordpressPassword: true,
          },
        });

        if (!client) {
          return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
        }

        if (!client.wordpressUrl || !client.wordpressUsername || !client.wordpressPassword) {
          return NextResponse.json(
            { error: 'WordPress niet geconfigureerd' },
            { status: 400 }
          );
        }

        const config = {
          siteUrl: client.wordpressUrl,
          username: client.wordpressUsername,
          applicationPassword: client.wordpressPassword,
        };

        const categories = await fetchWordPressCategories(config);
        return NextResponse.json({ categories });
      }

      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    if (!project.wordpressUrl || !project.wordpressUsername || !project.wordpressPassword) {
      return NextResponse.json(
        { error: 'WordPress niet geconfigureerd voor dit project' },
        { status: 400 }
      );
    }

    const config = {
      siteUrl: project.wordpressUrl,
      username: project.wordpressUsername,
      applicationPassword: project.wordpressPassword,
    };

    const categories = await fetchWordPressCategories(config);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching WordPress categories:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen categorieën' },
      { status: 500 }
    );
  }
}
