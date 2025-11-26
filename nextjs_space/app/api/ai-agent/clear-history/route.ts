

export const dynamic = "force-dynamic";
/**
 * 🗑️ Clear Chat History API
 * 
 * Clear all chat history for a client
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🗑️  Clearing all chat history for client:', session.user.id);

    // Delete all messages first (due to foreign key constraint)
    await prisma.chatMessage.deleteMany({
      where: {
        conversation: {
          clientId: session.user.id,
        },
      },
    });

    // Then delete all conversations
    const deletedConversations = await prisma.conversation.deleteMany({
      where: { clientId: session.user.id },
    });

    await prisma.$disconnect();

    console.log('✅ Deleted', deletedConversations.count, 'conversations');

    return NextResponse.json({
      success: true,
      message: 'Chat geschiedenis gewist',
      deletedCount: deletedConversations.count,
    });

  } catch (error: any) {
    console.error('Clear history error:', error);
    await prisma.$disconnect();
    
    return NextResponse.json(
      { error: 'Kon chat geschiedenis niet wissen', details: error.message },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Clear Chat History API',
  });
}
