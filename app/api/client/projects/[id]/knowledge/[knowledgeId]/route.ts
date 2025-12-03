

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// PUT - Knowledge item bijwerken
export async function PUT(
  request: Request,
  { params }: { params: { id: string; knowledgeId: string } }
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

    // Controleer of project van deze client is
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        clientId: client.id
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Controleer of knowledge item bestaat
    const existingItem = await prisma.projectKnowledge.findFirst({
      where: {
        id: params.knowledgeId,
        projectId: params.id
      }
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Knowledge item niet gevonden' }, { status: 404 });
    }

    const data = await request.json();
    
    const updatedItem = await prisma.projectKnowledge.update({
      where: { id: params.knowledgeId },
      data: {
        title: data.title !== undefined ? data.title : undefined,
        content: data.content !== undefined ? data.content : undefined,
        type: data.type !== undefined ? data.type : undefined,
        category: data.category !== undefined ? data.category : undefined,
        tags: data.tags !== undefined ? data.tags : undefined,
        importance: data.importance !== undefined ? data.importance : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined
      }
    });

    return NextResponse.json({
      success: true,
      knowledgeItem: updatedItem
    });

  } catch (error: any) {
    console.error('Error updating knowledge item:', error);
    return NextResponse.json(
      { error: 'Fout bij bijwerken knowledge item' },
      { status: 500 }
    );
  }
}

// DELETE - Knowledge item verwijderen
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; knowledgeId: string } }
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

    // Controleer of project van deze client is
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        clientId: client.id
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Controleer of knowledge item bestaat
    const existingItem = await prisma.projectKnowledge.findFirst({
      where: {
        id: params.knowledgeId,
        projectId: params.id
      }
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Knowledge item niet gevonden' }, { status: 404 });
    }

    await prisma.projectKnowledge.delete({
      where: { id: params.knowledgeId }
    });

    return NextResponse.json({
      success: true,
      message: 'Knowledge item verwijderd'
    });

  } catch (error: any) {
    console.error('Error deleting knowledge item:', error);
    return NextResponse.json(
      { error: 'Fout bij verwijderen knowledge item' },
      { status: 500 }
    );
  }
}
