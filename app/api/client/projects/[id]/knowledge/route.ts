

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Knowledge base items ophalen
export async function GET(
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

    const knowledgeItems = await prisma.projectKnowledge.findMany({
      where: {
        projectId: params.id
      },
      orderBy: [
        { importance: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      knowledgeItems
    });

  } catch (error: any) {
    console.error('Error fetching knowledge items:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen knowledge base' },
      { status: 500 }
    );
  }
}

// POST - Nieuw knowledge item toevoegen
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

    const data = await request.json();
    
    // Validatie
    if (!data.title || !data.content || !data.type) {
      return NextResponse.json(
        { error: 'Titel, inhoud en type zijn verplicht' },
        { status: 400 }
      );
    }

    const knowledgeItem = await prisma.projectKnowledge.create({
      data: {
        projectId: params.id,
        title: data.title,
        type: data.type,
        content: data.content,
        category: data.category || null,
        tags: data.tags || [],
        importance: data.importance || 'normal',
        isActive: data.isActive !== false
      }
    });

    return NextResponse.json({
      success: true,
      knowledgeItem
    });

  } catch (error: any) {
    console.error('Error creating knowledge item:', error);
    return NextResponse.json(
      { error: 'Fout bij toevoegen knowledge item' },
      { status: 500 }
    );
  }
}
