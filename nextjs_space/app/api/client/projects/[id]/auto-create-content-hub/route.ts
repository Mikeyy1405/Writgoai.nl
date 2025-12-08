export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { WordPressClient } from '@/lib/content-hub/wordpress-client';

/**
 * POST - Auto-create ContentHubSite from project's WordPress configuration
 * This endpoint has access to the stored password and can create the ContentHubSite
 * without exposing the password to the client.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Get the project with WordPress credentials
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        clientId: client.id
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Verify WordPress is configured
    if (!project.wordpressUrl || !project.wordpressUsername || !project.wordpressPassword) {
      return NextResponse.json({ 
        error: 'WordPress is niet volledig geconfigureerd voor dit project' 
      }, { status: 400 });
    }

    // Check if ContentHubSite already exists for this project
    const existingSite = await prisma.contentHubSite.findFirst({
      where: {
        projectId: params.id
      }
    });

    if (existingSite) {
      return NextResponse.json({ 
        success: true,
        site: existingSite,
        message: 'ContentHubSite bestaat al'
      });
    }

    // Test WordPress connection
    const wpClient = new WordPressClient({
      siteUrl: project.wordpressUrl,
      username: project.wordpressUsername,
      applicationPassword: project.wordpressPassword,
    });

    const testResult = await wpClient.testConnection();

    if (!testResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: `WordPress verbinding mislukt: ${testResult.message}` 
        },
        { status: 400 }
      );
    }

    // Get existing pages count
    let existingPages = 0;
    try {
      const posts = await wpClient.getPosts({ per_page: 1 });
      existingPages = posts.total;
    } catch (error) {
      console.error('Failed to get posts count:', error);
    }

    // Create ContentHubSite
    const site = await prisma.contentHubSite.create({
      data: {
        wordpressUrl: project.wordpressUrl,
        clientId: client.id,
        projectId: params.id,
        isConnected: true,
        existingPages,
        totalArticles: 0,
        completedArticles: 0,
        niche: project.niche || null,
      },
    });

    return NextResponse.json({
      success: true,
      site
    });

  } catch (error: any) {
    console.error('Error auto-creating ContentHubSite:', error);
    return NextResponse.json(
      { error: 'Fout bij aanmaken Content Hub verbinding' },
      { status: 500 }
    );
  }
}
