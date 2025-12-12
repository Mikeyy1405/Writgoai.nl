import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

/**
 * GET /api/social
 * Get all social media posts for a project
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID verplicht' }, { status: 400 });
    }

    // Verify client owns this project
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project || project.clientId !== client.id) {
      return NextResponse.json({ error: 'Geen toegang tot dit project' }, { status: 403 });
    }

    // Get social media strategy for this project
    const strategy = await prisma.socialMediaStrategy.findFirst({
      where: { projectId }
    });

    if (!strategy) {
      return NextResponse.json([]);
    }

    // Get all posts for this strategy
    const posts = await prisma.socialMediaPost.findMany({
      where: { strategyId: strategy.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(posts);
  } catch (error: any) {
    console.error('GET /api/social error:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen social posts', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/social
 * Create a new social media post
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.projectId || !body.content) {
      return NextResponse.json(
        { error: 'Project en content zijn verplicht' },
        { status: 400 }
      );
    }

    // Verify client owns this project
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    const project = await prisma.project.findUnique({
      where: { id: body.projectId }
    });

    if (!project || project.clientId !== client.id) {
      return NextResponse.json({ error: 'Geen toegang tot dit project' }, { status: 403 });
    }

    // Get or create strategy for this project
    let strategy = await prisma.socialMediaStrategy.findFirst({
      where: { projectId: body.projectId }
    });

    if (!strategy) {
      // Create a default strategy
      strategy = await prisma.socialMediaStrategy.create({
        data: {
          projectId: body.projectId,
          platforms: [body.platform || 'instagram'],
          frequency: '3x-week',
          contentTypes: ['post'],
          tone: 'friendly',
          topics: [],
          status: 'active'
        }
      });
    }

    // Create the post
    const post = await prisma.socialMediaPost.create({
      data: {
        strategyId: strategy.id,
        platform: body.platform || 'instagram',
        content: body.content,
        title: body.title || null,
        hashtags: body.hashtags || [],
        mediaUrls: body.mediaUrls || [],
        scheduledDate: body.scheduledDate || null,
        status: body.status || 'pending'
      }
    });

    return NextResponse.json(post);
  } catch (error: any) {
    console.error('POST /api/social error:', error);
    return NextResponse.json(
      { error: 'Fout bij aanmaken social post', details: error.message },
      { status: 500 }
    );
  }
}
