
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma as db } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/messages - Get all messages
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    const messages = await db.directMessage.findMany({
      where: clientId ? { clientId } : undefined,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        replies: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/messages - Send message to client
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId, subject, message, replyToId } = await request.json();

    // Get client
    const client = await db.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Create message
    const newMessage = await db.directMessage.create({
      data: {
        clientId,
        fromRole: 'admin',
        fromName: session.user.name || 'WritgoAI Admin',
        fromEmail: session.user.email || 'support@WritgoAI.nl',
        subject: subject || 'Bericht van WritgoAI',
        message,
        replyToId: replyToId || undefined,
        attachments: []
      }
    });

    // Send email notification to client
    try {
      await sendEmail(
        client.email,
        subject || 'Nieuw bericht van WritgoAI',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF6B35;">Nieuw bericht van WritgoAI</h2>
            <p>Hallo ${client.name},</p>
            <p>Je hebt een nieuw bericht ontvangen:</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            <p>Log in op je account om te reageren:</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/client-portal/messages" 
               style="background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Bekijk berichten
            </a>
          </div>
        `,
        `Hallo ${client.name},\n\nJe hebt een nieuw bericht ontvangen van WritgoAI:\n\n${message}\n\nLog in om te reageren: ${process.env.NEXT_PUBLIC_APP_URL}/client-portal/messages`
      );
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
    }

    return NextResponse.json({ message: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/messages - Mark message as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await request.json();

    const message = await db.directMessage.update({
      where: { id: messageId },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}
