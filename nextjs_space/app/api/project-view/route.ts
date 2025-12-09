
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';


// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Helper function to validate token and get collaborator
async function validateToken(token: string) {
  const collaborator = await prisma.projectCollaborator.findUnique({
    where: { accessToken: token },
    include: {
      project: {
        include: {
          client: {
            select: {
              id: true,
              name: true,
              companyName: true,
            },
          },
        },
      },
    },
  });

  if (!collaborator) {
    return { error: 'Ongeldige access token', status: 404 };
  }

  if (collaborator.status === 'revoked') {
    return { error: 'Toegang is ingetrokken', status: 403 };
  }

  // Update last access time
  await prisma.projectCollaborator.update({
    where: { id: collaborator.id },
    data: {
      lastAccessAt: new Date(),
      status: collaborator.status === 'pending' ? 'active' : collaborator.status,
      acceptedAt: collaborator.status === 'pending' ? new Date() : collaborator.acceptedAt,
    },
  });

  return { collaborator };
}

// GET - Haal project data op voor collaborator (via access token)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Access token is verplicht' }, { status: 400 });
    }

    // Validate token
    const validation = await validateToken(token);
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }
    const { collaborator } = validation;

    // Fetch full project data
    const project = await prisma.project.findUnique({
      where: { id: collaborator.project.id },
      include: {
        savedContent: {
          where: {
            isArchived: false,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        articleIdeas: {
          orderBy: {
            scheduledFor: 'asc',
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Filter data based on role
    const isClient = collaborator.role === 'client';
    
    // For clients, only show published content and scheduled articles
    const filteredContent = isClient
      ? project.savedContent.filter(c => c.type === 'published')
      : project.savedContent;
    
    const filteredPlanning = isClient
      ? project.articleIdeas.filter(
          idea => idea.status === 'idea' || idea.status === 'scheduled' || idea.hasContent
        )
      : project.articleIdeas;

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        websiteUrl: project.websiteUrl,
        description: project.description,
        contentStrategy: project.contentStrategy || null,
        contentStrategyDate: project.contentStrategyDate || null,
      },
      collaborator: {
        name: collaborator.name,
        email: collaborator.email,
        role: collaborator.role,
      },
      content: filteredContent,
      planning: filteredPlanning,
    });
  } catch (error) {
    console.error('Error fetching project view:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het ophalen van de project data' },
      { status: 500 }
    );
  }
}

// POST - Voeg nieuw artikel idee toe
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Access token is verplicht' }, { status: 400 });
    }

    // Validate token
    const validation = await validateToken(token);
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }
    const { collaborator } = validation;

    const body = await req.json();
    const { title, focusKeyword, scheduledFor, priority } = body;

    if (!title || !focusKeyword) {
      return NextResponse.json(
        { error: 'Titel en focus keyword zijn verplicht' },
        { status: 400 }
      );
    }

    // Create slug from title
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug already exists for this client
    const existingIdea = await prisma.articleIdea.findFirst({
      where: {
        clientId: collaborator.project.clientId,
        slug: slug,
      },
    });

    // If slug exists, append a number
    let finalSlug = slug;
    if (existingIdea) {
      const timestamp = Date.now();
      finalSlug = `${slug}-${timestamp}`;
    }

    const newIdea = await prisma.articleIdea.create({
      data: {
        clientId: collaborator.project.clientId,
        projectId: collaborator.project.id,
        title,
        slug: finalSlug,
        focusKeyword,
        topic: title,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        priority: priority || 'medium',
        status: 'idea',
        hasContent: false,
        secondaryKeywords: [],
        relatedArticles: [],
        imageIdeas: [],
        videoIdeas: [],
      },
    });

    return NextResponse.json(newIdea);
  } catch (error) {
    console.error('Error creating article idea:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het toevoegen van het artikel' },
      { status: 500 }
    );
  }
}

// PATCH - Update artikel idee
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const ideaId = searchParams.get('ideaId');

    if (!token) {
      return NextResponse.json({ error: 'Access token is verplicht' }, { status: 400 });
    }

    if (!ideaId) {
      return NextResponse.json({ error: 'Article ID is verplicht' }, { status: 400 });
    }

    // Validate token
    const validation = await validateToken(token);
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }
    const { collaborator } = validation;

    // Check if idea belongs to this project
    const idea = await prisma.articleIdea.findFirst({
      where: {
        id: ideaId,
        projectId: collaborator.project.id,
      },
    });

    if (!idea) {
      return NextResponse.json({ error: 'Artikel niet gevonden' }, { status: 404 });
    }

    const body = await req.json();
    const { title, focusKeyword, scheduledFor, priority } = body;

    // Update data object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (focusKeyword !== undefined) updateData.focusKeyword = focusKeyword;
    if (scheduledFor !== undefined) {
      updateData.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;
    }
    if (priority !== undefined) updateData.priority = priority;

    const updatedIdea = await prisma.articleIdea.update({
      where: { id: ideaId },
      data: updateData,
    });

    return NextResponse.json(updatedIdea);
  } catch (error) {
    console.error('Error updating article idea:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het bijwerken van het artikel' },
      { status: 500 }
    );
  }
}

// DELETE - Verwijder artikel idee
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const ideaId = searchParams.get('ideaId');

    if (!token) {
      return NextResponse.json({ error: 'Access token is verplicht' }, { status: 400 });
    }

    if (!ideaId) {
      return NextResponse.json({ error: 'Article ID is verplicht' }, { status: 400 });
    }

    // Validate token
    const validation = await validateToken(token);
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }
    const { collaborator } = validation;

    // Check if idea belongs to this project
    const idea = await prisma.articleIdea.findFirst({
      where: {
        id: ideaId,
        projectId: collaborator.project.id,
      },
    });

    if (!idea) {
      return NextResponse.json({ error: 'Artikel niet gevonden' }, { status: 404 });
    }

    // Delete the idea
    await prisma.articleIdea.delete({
      where: { id: ideaId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting article idea:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het verwijderen van het artikel' },
      { status: 500 }
    );
  }
}
