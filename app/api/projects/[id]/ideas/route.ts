import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { 
  getArticleIdeas, 
  createArticleIdea, 
  generateSlug 
} from '@/lib/db/content-planning';
import { getProjectForClient } from '@/lib/db/projects';
import { prisma } from '@/lib/db';
import type { ArticleIdeaFilters, ArticleStatus, ContentType, Priority, SearchIntent } from '@/types/database';

export const dynamic = 'force-dynamic';

/**
 * GET /api/projects/[id]/ideas
 * Get all article ideas for a project with optional filters
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const projectId = resolvedParams.id;

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

    // 2. Check project access
    const project = await getProjectForClient(projectId, client.id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 3. Parse filters from query params
    const { searchParams } = new URL(req.url);
    const filters: ArticleIdeaFilters = {
      projectId,
    };

    const status = searchParams.get('status');
    if (status) {
      filters.status = status.split(',') as ArticleStatus[];
    }

    const contentType = searchParams.get('contentType');
    if (contentType) {
      filters.contentType = contentType.split(',') as ContentType[];
    }

    const priority = searchParams.get('priority');
    if (priority) {
      filters.priority = priority.split(',') as Priority[];
    }

    const category = searchParams.get('category');
    if (category) {
      filters.category = category;
    }

    const cluster = searchParams.get('cluster');
    if (cluster) {
      filters.cluster = cluster;
    }

    const hasContent = searchParams.get('hasContent');
    if (hasContent !== null) {
      filters.hasContent = hasContent === 'true';
    }

    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      filters.searchQuery = searchQuery;
    }

    // 4. Get ideas
    const ideas = await getArticleIdeas(client.id, filters);

    // 5. Group by status for Kanban
    const groupByStatus = searchParams.get('groupByStatus') === 'true';
    if (groupByStatus) {
      const grouped: Record<ArticleStatus, typeof ideas> = {
        idea: [],
        planned: [],
        writing: [],
        review: [],
        published: [],
      };

      for (const idea of ideas) {
        const status = idea.status as ArticleStatus;
        if (grouped[status]) {
          grouped[status].push(idea);
        }
      }

      return NextResponse.json({
        success: true,
        ideas: grouped,
        total: ideas.length,
      });
    }

    return NextResponse.json({
      success: true,
      ideas,
      total: ideas.length,
    });

  } catch (error) {
    console.error('[Ideas GET] Error:', error);
    return NextResponse.json({
      error: 'Er is een fout opgetreden',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * POST /api/projects/[id]/ideas
 * Create a new article idea
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const projectId = resolvedParams.id;

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

    // 2. Check project access
    const project = await getProjectForClient(projectId, client.id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 3. Parse request body
    const body = await req.json();
    const {
      title,
      focusKeyword,
      topic,
      slug,
      secondaryKeywords,
      searchIntent,
      searchVolume,
      difficulty,
      contentOutline,
      targetWordCount,
      contentType,
      contentCategory,
      priority,
      category,
      cluster,
      scheduledFor,
      notes,
      language,
    } = body;

    // Validate required fields
    if (!title || !focusKeyword) {
      return NextResponse.json({
        error: 'Titel en focus keyword zijn verplicht',
      }, { status: 400 });
    }

    // 4. Create idea
    const idea = await createArticleIdea({
      clientId: client.id,
      projectId,
      title,
      slug: slug || generateSlug(title),
      focusKeyword,
      topic: topic || title,
      secondaryKeywords: secondaryKeywords || [],
      searchIntent: searchIntent as SearchIntent,
      searchVolume,
      difficulty,
      contentOutline,
      targetWordCount,
      contentType: contentType as ContentType,
      contentCategory,
      priority: (priority as Priority) || 'medium',
      category,
      cluster,
      scheduledFor,
      notes,
      language: language || project.language || 'NL',
    });

    return NextResponse.json({
      success: true,
      idea,
    });

  } catch (error) {
    console.error('[Ideas POST] Error:', error);
    return NextResponse.json({
      error: 'Er is een fout opgetreden',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
