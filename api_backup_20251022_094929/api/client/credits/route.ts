
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: {
        freeArticleCredits: true,
        freeReelCredits: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = await req.json(); // 'article' or 'reel'

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check if client has credits
    if (type === 'article' && client.freeArticleCredits <= 0) {
      return NextResponse.json(
        { error: 'No free article credits available' },
        { status: 400 }
      );
    }

    if (type === 'reel' && client.freeReelCredits <= 0) {
      return NextResponse.json(
        { error: 'No free reel credits available' },
        { status: 400 }
      );
    }

    // Deduct credit
    const updatedClient = await prisma.client.update({
      where: { email: session.user.email },
      data: {
        ...(type === 'article' && {
          freeArticleCredits: { decrement: 1 },
        }),
        ...(type === 'reel' && {
          freeReelCredits: { decrement: 1 },
        }),
      },
      select: {
        freeArticleCredits: true,
        freeReelCredits: true,
      },
    });

    return NextResponse.json({
      success: true,
      credits: updatedClient,
    });
  } catch (error) {
    console.error('Error using credit:', error);
    return NextResponse.json(
      { error: 'Failed to use credit' },
      { status: 500 }
    );
  }
}
