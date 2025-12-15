

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH: Update conversation (rename, pin, archive)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const conversationId = params.id;

    // Verify ownership
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversatie niet gevonden' }, { status: 404 });
    }

    if (conversation.clientId !== client.id) {
      return NextResponse.json({ error: 'Geen toegang tot deze conversatie' }, { status: 403 });
    }

    const body = await req.json();
    const { title, isPinned, isArchived } = body;

    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...(title !== undefined && { title }),
        ...(isPinned !== undefined && { isPinned }),
        ...(isArchived !== undefined && { isArchived }),
      },
    });

    return NextResponse.json({ conversation: updatedConversation });
  } catch (error: any) {
    console.error('Update conversation error:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij bijwerken conversatie' },
      { status: 500 }
    );
  }
}

// DELETE: Delete conversation
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const conversationId = params.id;

    // Verify ownership
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversatie niet gevonden' }, { status: 404 });
    }

    if (conversation.clientId !== client.id) {
      return NextResponse.json({ error: 'Geen toegang tot deze conversatie' }, { status: 403 });
    }

    // Delete conversation (messages will be cascade deleted)
    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete conversation error:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij verwijderen conversatie' },
      { status: 500 }
    );
  }
}
