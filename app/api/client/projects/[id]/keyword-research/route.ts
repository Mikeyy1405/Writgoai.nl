

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Haal keyword research op
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
      select: {
        id: true,
        name: true,
        keywordResearch: true,
        keywordResearchStatus: true,
        keywordResearchDate: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error: any) {
    console.error('Error fetching keyword research:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het ophalen van keyword research' },
      { status: 500 }
    );
  }
}

// POST - Sla keyword research op
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const body = await req.json();
    const { keywordResearch, status } = body;

    // Validatie
    if (!keywordResearch) {
      return NextResponse.json(
        { error: 'Keyword research data is verplicht' },
        { status: 400 }
      );
    }

    const validStatuses = ['not_started', 'in_progress', 'completed', 'needs_review'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Ongeldige status waarde' },
        { status: 400 }
      );
    }

    const project = await prisma.project.updateMany({
      where: {
        id: params.id,
        clientId: client.id,
      },
      data: {
        keywordResearch,
        keywordResearchStatus: status || 'completed',
        keywordResearchDate: new Date(),
      },
    });

    if (project.count === 0) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Haal updated project op
    const updatedProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
      select: {
        id: true,
        name: true,
        keywordResearch: true,
        keywordResearchStatus: true,
        keywordResearchDate: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Keyword research opgeslagen',
      project: updatedProject,
    });
  } catch (error: any) {
    console.error('Error saving keyword research:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het opslaan van keyword research' },
      { status: 500 }
    );
  }
}

// PATCH - Update alleen de status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const body = await req.json();
    const { status } = body;

    const validStatuses = ['not_started', 'in_progress', 'completed', 'needs_review'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Ongeldige status waarde' },
        { status: 400 }
      );
    }

    const project = await prisma.project.updateMany({
      where: {
        id: params.id,
        clientId: client.id,
      },
      data: {
        keywordResearchStatus: status,
      },
    });

    if (project.count === 0) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Status bijgewerkt',
    });
  } catch (error: any) {
    console.error('Error updating keyword research status:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het bijwerken van de status' },
      { status: 500 }
    );
  }
}
