
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { text, type = 'text' } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Message text is required' },
        { status: 400 }
      );
    }

    const message = await prisma.orderMessage.create({
      data: {
        orderId: params.id,
        sender: session.user.email,
        text,
        type,
      },
    });

    // Add timeline event
    await prisma.orderTimeline.create({
      data: {
        orderId: params.id,
        action: 'message',
        details: 'Nieuw bericht toegevoegd',
        user: session.user.email,
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
