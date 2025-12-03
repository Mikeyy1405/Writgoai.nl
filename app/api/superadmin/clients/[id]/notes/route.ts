
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.email !== 'info@writgo.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notes = await prisma.adminNote.findMany({
      where: { clientId: params.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ notes });

  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.email !== 'info@writgo.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { note } = body;

    if (!note) {
      return NextResponse.json({ error: 'Note is required' }, { status: 400 });
    }

    const newNote = await prisma.adminNote.create({
      data: {
        clientId: params.id,
        adminEmail: session.user.email,
        note
      }
    });

    // Log activity
    await prisma.clientActivityLog.create({
      data: {
        clientId: params.id,
        action: 'admin_note_added',
        description: 'Admin added a note',
        metadata: { noteId: newNote.id }
      }
    });

    return NextResponse.json({ note: newNote });

  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
