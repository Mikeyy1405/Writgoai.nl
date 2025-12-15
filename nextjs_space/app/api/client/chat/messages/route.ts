
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { refreshChatFileUrl } from '@/lib/chat-file-upload';

export const dynamic = 'force-dynamic';

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

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is verplicht' }, { status: 400 });
    }

    // Verify conversation ownership
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversatie niet gevonden' }, { status: 404 });
    }

    if (conversation.clientId !== client.id) {
      return NextResponse.json({ error: 'Geen toegang tot deze conversatie' }, { status: 403 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Refresh signed URLs for attachments
    const messagesWithFreshUrls = await Promise.all(
      messages.map(async (msg) => {
        if (msg.attachments && Array.isArray(msg.attachments)) {
          const attachments = msg.attachments as any[];
          const freshAttachments = await Promise.all(
            attachments.map(async (att) => {
              if (att.cloudStoragePath) {
                const freshUrl = await refreshChatFileUrl(att.cloudStoragePath);
                return { ...att, url: freshUrl };
              }
              return att;
            })
          );
          return { ...msg, attachments: freshAttachments };
        }
        return msg;
      })
    );

    return NextResponse.json({ messages: messagesWithFreshUrls });
  } catch (error: any) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: error.message || 'Fout bij ophalen berichten' }, { status: 500 });
  }
}
