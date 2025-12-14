

export const dynamic = "force-dynamic";
/**
 * 🗑️ Clear Chat History API
 * 
 * Clear all chat history for a client
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient, isAuthError } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';


export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedClient();
    
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.error }, 
        { status: auth.status }
      );
    }

    // Use client.id (from Client table), NOT session.user.id
    const clientId = auth.client.id;

    console.log('🗑️  Clearing all chat history for client:', clientId);

    // Delete all messages first (due to foreign key constraint)
    await prisma.chatMessage.deleteMany({
      where: {
        conversation: {
          clientId,
        },
      },
    });

    // Then delete all conversations
    const deletedConversations = await prisma.conversation.deleteMany({
      where: { clientId },
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
