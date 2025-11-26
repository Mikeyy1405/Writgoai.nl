

export const dynamic = "force-dynamic";
/**
 * 💬 Direct Messages API
 * Directe communicatie tussen admin en klant
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Haal berichten op
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const isAdmin = session.user.email === 'info@WritgoAI.nl';

    let messages;

    if (isAdmin && clientId) {
      // Admin bekijkt specifieke klant berichten
      messages = await prisma.directMessage.findMany({
        where: { clientId },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else if (isAdmin && !clientId) {
      // Admin bekijkt alle berichten
      messages = await prisma.directMessage.findMany({
        include: {
          client: {
            select: {
              id: true,
              email: true,
              name: true,
              companyName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      // Client bekijkt alleen eigen berichten
      const client = await prisma.client.findUnique({
        where: { email: session.user.email },
      });

      if (!client) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        );
      }

      messages = await prisma.directMessage.findMany({
        where: { clientId: client.id },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

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

// POST: Verstuur nieuw bericht
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, subject, message, replyToId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'message is verplicht' },
        { status: 400 }
      );
    }

    const isAdmin = session.user.email === 'info@WritgoAI.nl';
    let targetClientId = clientId;

    if (!isAdmin) {
      // Client stuurt bericht naar admin
      const client = await prisma.client.findUnique({
        where: { email: session.user.email },
      });

      if (!client) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        );
      }

      targetClientId = client.id;
    }

    if (!targetClientId) {
      return NextResponse.json(
        { error: 'clientId is verplicht' },
        { status: 400 }
      );
    }

    const directMessage = await prisma.directMessage.create({
      data: {
        clientId: targetClientId,
        fromRole: isAdmin ? 'admin' : 'client',
        fromName: session.user.name || 'Unknown',
        fromEmail: session.user.email,
        subject,
        message,
        replyToId,
        attachments: [],
      },
    });

    return NextResponse.json({
      success: true,
      message: directMessage,
    });
  } catch (error: any) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Mark message as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is verplicht' },
        { status: 400 }
      );
    }

    const message = await prisma.directMessage.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    console.error('Mark as read error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
