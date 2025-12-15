
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// DELETE: Verwijder een article idea
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const ideaId = params.id;

    // Controleer of het idee bestaat en eigendom is van deze client
    const idea = await prisma.articleIdea.findUnique({
      where: { id: ideaId }
    });

    if (!idea) {
      return NextResponse.json({ error: 'Idee niet gevonden' }, { status: 404 });
    }

    if (idea.clientId !== client.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verwijder het idee
    await prisma.articleIdea.delete({
      where: { id: ideaId }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Content idee succesvol verwijderd' 
    });

  } catch (error: any) {
    console.error('Error deleting article idea:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij verwijderen van content idee' },
      { status: 500 }
    );
  }
}
