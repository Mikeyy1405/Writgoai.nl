export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Field mapping voor verschillende research types
const FIELD_MAPPING = {
  analysis: {
    content: 'contentAnalysis',
    status: 'contentAnalysisStatus',
    date: 'contentAnalysisDate',
  },
  strategy: {
    content: 'contentStrategy',
    status: 'contentStrategyStatus',
    date: 'contentStrategyDate',
  },
  keywords: {
    content: 'keywordResearch',
    status: 'keywordResearchStatus',
    date: 'keywordResearchDate',
  },
} as const;

type ResearchType = keyof typeof FIELD_MAPPING;

const VALID_STATUSES = ['not_started', 'in_progress', 'completed', 'needs_review'] as const;

// Helper functie voor client en project validatie
async function validateClientAndProject(email: string, projectId: string) {
  const client = await prisma.client.findUnique({
    where: { email },
  });

  if (!client) {
    return { error: 'Client niet gevonden', status: 404 };
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      clientId: client.id,
    },
  });

  if (!project) {
    return { error: 'Project niet gevonden', status: 404 };
  }

  return { client, project };
}

// GET - Haal research data op
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; type: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const type = params.type as ResearchType;
    const mapping = FIELD_MAPPING[type];

    if (!mapping) {
      return NextResponse.json(
        { error: `Ongeldig research type. Kies: ${Object.keys(FIELD_MAPPING).join(', ')}` },
        { status: 400 }
      );
    }

    const validation = await validateClientAndProject(session.user.email, params.id);
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { client } = validation;

    // Haal project op met de juiste velden
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
      select: {
        id: true,
        name: true,
        [mapping.content]: true,
        [mapping.status]: true,
        [mapping.date]: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error: any) {
    console.error(`Error fetching ${params.type} research:`, error);
    return NextResponse.json(
      { error: `Er ging iets mis bij het ophalen van ${params.type} data` },
      { status: 500 }
    );
  }
}

// POST - Sla research data op
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; type: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const type = params.type as ResearchType;
    const mapping = FIELD_MAPPING[type];

    if (!mapping) {
      return NextResponse.json(
        { error: `Ongeldig research type. Kies: ${Object.keys(FIELD_MAPPING).join(', ')}` },
        { status: 400 }
      );
    }

    const validation = await validateClientAndProject(session.user.email, params.id);
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { client } = validation;

    const body = await req.json();
    const { data, status } = body;

    // Validatie
    if (!data) {
      return NextResponse.json(
        { error: 'Research data is verplicht' },
        { status: 400 }
      );
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Ongeldige status waarde. Kies: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Dynamisch update object maken
    const updateData: any = {
      [mapping.content]: data,
      [mapping.status]: status || 'completed',
      [mapping.date]: new Date(),
    };

    const project = await prisma.project.updateMany({
      where: {
        id: params.id,
        clientId: client.id,
      },
      data: updateData,
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
        [mapping.content]: true,
        [mapping.status]: true,
        [mapping.date]: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${type} opgeslagen`,
      project: updatedProject,
    });
  } catch (error: any) {
    console.error(`Error saving ${params.type} research:`, error);
    return NextResponse.json(
      { error: `Er ging iets mis bij het opslaan van ${params.type} data` },
      { status: 500 }
    );
  }
}

// PATCH - Update alleen de status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; type: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const type = params.type as ResearchType;
    const mapping = FIELD_MAPPING[type];

    if (!mapping) {
      return NextResponse.json(
        { error: `Ongeldig research type. Kies: ${Object.keys(FIELD_MAPPING).join(', ')}` },
        { status: 400 }
      );
    }

    const validation = await validateClientAndProject(session.user.email, params.id);
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { client } = validation;

    const body = await req.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Ongeldige status waarde. Kies: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const project = await prisma.project.updateMany({
      where: {
        id: params.id,
        clientId: client.id,
      },
      data: {
        [mapping.status]: status,
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
    console.error(`Error updating ${params.type} status:`, error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het bijwerken van de status' },
      { status: 500 }
    );
  }
}
