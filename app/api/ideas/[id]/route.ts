import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { 
  getArticleIdea, 
  updateArticleIdea, 
  deleteArticleIdea 
} from '@/lib/db/content-planning';
import { prisma } from '@/lib/db';
import type { UpdateArticleIdea, ArticleStatus, ContentType, Priority, SearchIntent } from '@/types/database';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ideas/[id]
 * Get a single article idea
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const ideaId = resolvedParams.id;

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get client from email
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // 2. Get idea
    const idea = await getArticleIdea(ideaId);

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    // 3. Check ownership
    if (idea.clientId !== client.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      idea,
    });

  } catch (error) {
    console.error('[Idea GET] Error:', error);
    return NextResponse.json({
      error: 'Er is een fout opgetreden',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * PUT /api/ideas/[id]
 * Update an article idea
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const ideaId = resolvedParams.id;

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get client from email
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // 2. Get existing idea to verify ownership
    const existingIdea = await getArticleIdea(ideaId);

    if (!existingIdea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    if (existingIdea.clientId !== client.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 3. Parse request body
    const body = await req.json();
    const updates: UpdateArticleIdea = {};

    // Only include fields that were provided
    if (body.title !== undefined) updates.title = body.title;
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.focusKeyword !== undefined) updates.focusKeyword = body.focusKeyword;
    if (body.topic !== undefined) updates.topic = body.topic;
    if (body.secondaryKeywords !== undefined) updates.secondaryKeywords = body.secondaryKeywords;
    if (body.searchIntent !== undefined) updates.searchIntent = body.searchIntent as SearchIntent;
    if (body.searchVolume !== undefined) updates.searchVolume = body.searchVolume;
    if (body.difficulty !== undefined) updates.difficulty = body.difficulty;
    if (body.contentOutline !== undefined) updates.contentOutline = body.contentOutline;
    if (body.targetWordCount !== undefined) updates.targetWordCount = body.targetWordCount;
    if (body.contentType !== undefined) updates.contentType = body.contentType as ContentType;
    if (body.contentCategory !== undefined) updates.contentCategory = body.contentCategory;
    if (body.priority !== undefined) updates.priority = body.priority as Priority;
    if (body.category !== undefined) updates.category = body.category;
    if (body.cluster !== undefined) updates.cluster = body.cluster;
    if (body.scheduledFor !== undefined) updates.scheduledFor = body.scheduledFor;
    if (body.status !== undefined) updates.status = body.status as ArticleStatus;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.hasContent !== undefined) updates.hasContent = body.hasContent;
    if (body.contentId !== undefined) updates.contentId = body.contentId;

    // 4. Update idea
    const updatedIdea = await updateArticleIdea(ideaId, updates);

    return NextResponse.json({
      success: true,
      idea: updatedIdea,
    });

  } catch (error) {
    console.error('[Idea PUT] Error:', error);
    return NextResponse.json({
      error: 'Er is een fout opgetreden',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * DELETE /api/ideas/[id]
 * Delete an article idea
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const ideaId = resolvedParams.id;

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get client from email
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // 2. Get existing idea to verify ownership
    const existingIdea = await getArticleIdea(ideaId);

    if (!existingIdea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    if (existingIdea.clientId !== client.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 3. Delete idea
    await deleteArticleIdea(ideaId);

    return NextResponse.json({
      success: true,
      message: 'Idea deleted successfully',
    });

  } catch (error) {
    console.error('[Idea DELETE] Error:', error);
    return NextResponse.json({
      error: 'Er is een fout opgetreden',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
