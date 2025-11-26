
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Fetch all social media ideas for a project
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Verify project belongs to client
    const project = await prisma.project.findUnique({
      where: { id: projectId, clientId: client.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get all ideas for the project
    const ideas = await prisma.socialMediaIdea.findMany({
      where: { projectId },
      include: {
        generatedPost: {
          select: {
            id: true,
            status: true,
            platforms: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ ideas });
  } catch (error: any) {
    console.error('Error fetching social media ideas:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ideas' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a social media idea
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const ideaId = searchParams.get('ideaId');

    if (!ideaId) {
      return NextResponse.json({ error: 'Idea ID is required' }, { status: 400 });
    }

    // Verify idea belongs to client's project
    const idea = await prisma.socialMediaIdea.findUnique({
      where: { id: ideaId },
      include: { project: true },
    });

    if (!idea || idea.project.clientId !== client.id) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    // Delete the idea
    await prisma.socialMediaIdea.delete({
      where: { id: ideaId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting social media idea:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete idea' },
      { status: 500 }
    );
  }
}

// PATCH - Update a social media idea
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await req.json();
    const { ideaId, ...updates } = body;

    if (!ideaId) {
      return NextResponse.json({ error: 'Idea ID is required' }, { status: 400 });
    }

    // Verify idea belongs to client's project
    const idea = await prisma.socialMediaIdea.findUnique({
      where: { id: ideaId },
      include: { project: true },
    });

    if (!idea || idea.project.clientId !== client.id) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    // Update the idea
    const updatedIdea = await prisma.socialMediaIdea.update({
      where: { id: ideaId },
      data: updates,
    });

    return NextResponse.json({ success: true, idea: updatedIdea });
  } catch (error: any) {
    console.error('Error updating social media idea:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update idea' },
      { status: 500 }
    );
  }
}
