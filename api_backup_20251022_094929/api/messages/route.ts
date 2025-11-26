
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET messages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const clientId = searchParams.get('clientId');

    const where: any = {};
    
    if (session.user.role === 'client') {
      where.clientId = session.user.id;
    } else if (clientId) {
      where.clientId = clientId;
    }
    
    if (taskId) {
      where.taskId = taskId;
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        Client: {
          select: {
            name: true,
          },
        },
        User: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST create message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, taskId } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const messageData: any = {
      content,
      senderType: session.user.role === 'client' ? 'CLIENT' : 'TEAM',
      taskId: taskId || null,
    };

    if (session.user.role === 'client') {
      messageData.clientId = session.user.id;
    } else {
      messageData.userId = session.user.id;
      // If it's a task message, get the client from the task
      if (taskId) {
        const task = await prisma.task.findUnique({
          where: { id: taskId },
          select: { clientId: true },
        });
        if (task) {
          messageData.clientId = task.clientId;
        }
      }
    }

    const message = await prisma.message.create({
      data: messageData,
      include: {
        Client: {
          select: {
            name: true,
          },
        },
        User: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
