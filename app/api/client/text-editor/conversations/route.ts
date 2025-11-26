
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET conversations
export async function GET(req: NextRequest) {
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

    const conversations = await prisma.textEditorConversation.findMany({
      where: { clientId: client.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error('Load conversations error:', error);
    return NextResponse.json(
      { error: 'Fout bij laden van conversaties' },
      { status: 500 }
    );
  }
}

// DELETE conversation
export async function DELETE(req: NextRequest) {
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

    const { conversationId } = await req.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversatie ID is verplicht' },
        { status: 400 }
      );
    }

    // Verify ownership
    const conversation = await prisma.textEditorConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.clientId !== client.id) {
      return NextResponse.json(
        { error: 'Conversatie niet gevonden' },
        { status: 404 }
      );
    }

    // Delete messages first
    await prisma.textEditorMessage.deleteMany({
      where: { conversationId },
    });

    // Delete conversation
    await prisma.textEditorConversation.delete({
      where: { id: conversationId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete conversation error:', error);
    return NextResponse.json(
      { error: 'Fout bij verwijderen van conversatie' },
      { status: 500 }
    );
  }
}
