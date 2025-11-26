

export const dynamic = "force-dynamic";
/**
 * 💬 Conversations Management API
 * 
 * Manage chat conversations (list, create, delete, clear)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all conversations for a client
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: { 
        clientId: session.user.id,
        isArchived: false,
      },
      orderBy: [
        { isPinned: 'desc' },
        { lastMessageAt: 'desc' },
      ],
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      conversations,
      count: conversations.length,
    });

  } catch (error: any) {
    console.error('Get conversations error:', error);
    await prisma.$disconnect();
    
    return NextResponse.json(
      { error: 'Kon gesprekken niet ophalen', details: error.message },
      { status: 500 }
    );
  }
}

// Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title = 'Nieuw gesprek' } = body;

    const conversation = await prisma.conversation.create({
      data: {
        clientId: session.user.id,
        title,
        isPinned: false,
        isArchived: false,
        lastMessageAt: new Date(),
      },
      include: {
        messages: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      conversation,
    });

  } catch (error: any) {
    console.error('Create conversation error:', error);
    await prisma.$disconnect();
    
    return NextResponse.json(
      { error: 'Kon gesprek niet aanmaken', details: error.message },
      { status: 500 }
    );
  }
}

// Update a conversation (title, pinned status)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, title, isPinned } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is vereist' },
        { status: 400 }
      );
    }

    // Verify ownership
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        clientId: session.user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Gesprek niet gevonden' },
        { status: 404 }
      );
    }

    // Update conversation
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(isPinned !== undefined ? { isPinned } : {}),
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      conversation: updatedConversation,
    });

  } catch (error: any) {
    console.error('Update conversation error:', error);
    await prisma.$disconnect();
    
    return NextResponse.json(
      { error: 'Kon gesprek niet updaten', details: error.message },
      { status: 500 }
    );
  }
}

// Delete a conversation
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
      // Delete all conversations for this client
      await prisma.chatMessage.deleteMany({
        where: {
          conversation: {
            clientId: session.user.id,
          },
        },
      });

      await prisma.conversation.deleteMany({
        where: { clientId: session.user.id },
      });

      await prisma.$disconnect();

      return NextResponse.json({
        success: true,
        message: 'Alle gesprekken verwijderd',
      });
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is vereist' },
        { status: 400 }
      );
    }

    // Verify ownership
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        clientId: session.user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Gesprek niet gevonden' },
        { status: 404 }
      );
    }

    // Delete conversation and all messages (cascade)
    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Gesprek verwijderd',
    });

  } catch (error: any) {
    console.error('Delete conversation error:', error);
    await prisma.$disconnect();
    
    return NextResponse.json(
      { error: 'Kon gesprek niet verwijderen', details: error.message },
      { status: 500 }
    );
  }
}
