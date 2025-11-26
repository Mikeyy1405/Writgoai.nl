

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// PUT - WordPress instellingen opslaan
export async function PUT(
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

    // Controleer of project bestaat en van deze client is
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        clientId: client.id
      }
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    const data = await request.json();
    
    // Update WordPress instellingen
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        wordpressUrl: data.wordpressUrl || null,
        wordpressUsername: data.wordpressUsername || null,
        wordpressPassword: data.wordpressPassword || null,
        wordpressCategory: data.wordpressCategory || null,
        wordpressAutoPublish: data.wordpressAutoPublish || false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'WordPress instellingen opgeslagen',
      project: updatedProject
    });

  } catch (error: any) {
    console.error('Error saving WordPress settings:', error);
    return NextResponse.json(
      { error: 'Fout bij opslaan WordPress instellingen' },
      { status: 500 }
    );
  }
}

// DELETE - WordPress instellingen verwijderen
export async function DELETE(
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

    // Controleer of project bestaat en van deze client is
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        clientId: client.id
      }
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Verwijder WordPress instellingen
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        wordpressUrl: null,
        wordpressUsername: null,
        wordpressPassword: null,
        wordpressCategory: null,
        wordpressAutoPublish: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'WordPress instellingen verwijderd'
    });

  } catch (error: any) {
    console.error('Error deleting WordPress settings:', error);
    return NextResponse.json(
      { error: 'Fout bij verwijderen WordPress instellingen' },
      { status: 500 }
    );
  }
}
