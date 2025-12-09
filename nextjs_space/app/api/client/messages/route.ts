
/**
 * 💬 Message Management API
 * 
 * Voeg berichten toe aan conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';


// POST: Voeg een message toe aan een conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      conversationId,
      role,
      content,
      model,
      toolCalls,
      images,
      videos,
    } = body;

    if (!conversationId || !role || !content) {
      return NextResponse.json(
        { error: 'conversationId, role, and content are required' },
        { status: 400 }
      );
    }

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        role,
        content,
        model,
        toolCalls,
        images: images || [],
        videos,
      },
    });

    // Update conversation lastMessageAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        // Auto-generate title from first user message if still default
        ...(role === 'user' && (await shouldUpdateTitle(conversationId))
          ? {
              title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            }
          : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    console.error('Create message error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Check if we should update the conversation title
async function shouldUpdateTitle(conversationId: string): Promise<boolean> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { title: true },
  });

  return conversation?.title === 'Nieuw gesprek';
}

// GET: Haal messages op van een conversation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error: any) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
