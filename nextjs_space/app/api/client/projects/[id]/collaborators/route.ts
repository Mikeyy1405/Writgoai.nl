
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import crypto from 'crypto';


const inviteSchema = z.object({
  email: z.string().email('Ongeldig email adres'),
  name: z.string().optional(),
  notifyOnPublish: z.boolean().default(true),
});

// GET - Alle collaborators voor een project ophalen
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Check if client owns this project
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Get all collaborators for this project
    const collaborators = await prisma.projectCollaborator.findMany({
      where: {
        projectId: params.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ collaborators });
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het ophalen van de collaborators' },
      { status: 500 }
    );
  }
}

// POST - Nieuwe collaborator uitnodigen
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await req.json();
    const { email, name, notifyOnPublish } = inviteSchema.parse(body);

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Check if client owns this project
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Check if collaborator already exists
    const existing = await prisma.projectCollaborator.findUnique({
      where: {
        projectId_email: {
          projectId: params.id,
          email: email,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Deze persoon heeft al toegang tot dit project' },
        { status: 400 }
      );
    }

    // Generate unique access token
    const accessToken = crypto.randomBytes(32).toString('hex');

    // Create collaborator
    const collaborator = await prisma.projectCollaborator.create({
      data: {
        projectId: params.id,
        email,
        name,
        accessToken,
        notifyOnPublish,
        status: 'pending',
      },
    });

    // TODO: Send email with access link
    // const accessUrl = `${process.env.NEXTAUTH_URL}/project-view/${accessToken}`;
    
    return NextResponse.json({ 
      collaborator,
      message: 'Collaborator succesvol uitgenodigd',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error inviting collaborator:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het uitnodigen van de collaborator' },
      { status: 500 }
    );
  }
}

// DELETE - Collaborator verwijderen
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const collaboratorId = searchParams.get('collaboratorId');

    if (!collaboratorId) {
      return NextResponse.json({ error: 'Collaborator ID is verplicht' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Check if client owns this project
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Delete collaborator (or mark as revoked)
    await prisma.projectCollaborator.update({
      where: { id: collaboratorId },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Collaborator toegang ingetrokken' });
  } catch (error) {
    console.error('Error revoking collaborator:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het intrekken van de toegang' },
      { status: 500 }
    );
  }
}
