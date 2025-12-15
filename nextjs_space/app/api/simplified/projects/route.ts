import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/simplified/projects
 * Haal alle projecten op voor de ingelogde gebruiker
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Haal projecten op
    const projects = await prisma.project.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        websiteUrl: true,
        description: true,
        wordpressUrl: true,
        wordpressUsername: true,
        wordpressAutoPublish: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/simplified/projects
 * Maak een nieuw project aan
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, websiteUrl, wordpressUrl, wordpressUsername, wordpressPassword, getLateDevApiKey, description } = body;

    // Only name is required
    if (!name) {
      return NextResponse.json(
        { error: 'Project naam is verplicht' },
        { status: 400 }
      );
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Test WordPress connectie alleen als alle credentials aanwezig zijn
    if (wordpressUrl && wordpressUsername && wordpressPassword) {
      try {
        const wpTestUrl = `${wordpressUrl}/wp-json/wp/v2/posts?per_page=1`;
        const wpResponse = await fetch(wpTestUrl, {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${wordpressUsername}:${wordpressPassword}`).toString('base64')}`,
          },
        });

        if (!wpResponse.ok) {
          throw new Error('WordPress connection failed');
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'WordPress connection failed. Check your credentials.' },
          { status: 400 }
        );
      }
    }

    // Maak project aan (werkt nu ook zonder WordPress)
    const project = await prisma.project.create({
      data: {
        clientId: client.id,
        name,
        websiteUrl: websiteUrl || wordpressUrl || null,
        description: description || null,
        wordpressUrl: wordpressUrl || null,
        wordpressUsername: wordpressUsername || null,
        wordpressPassword: wordpressPassword || null,
        isActive: true,
        isPrimary: false,
      },
    });

    // Update client met GetLate API key als die is meegegeven
    if (getLateDevApiKey) {
      await prisma.client.update({
        where: { id: client.id },
        data: { lateDevProfileId: getLateDevApiKey },
      });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
