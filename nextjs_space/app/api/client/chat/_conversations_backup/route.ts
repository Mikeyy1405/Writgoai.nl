
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

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

    const conversations = await prisma.conversation.findMany({
      where: {
        clientId: client.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 50,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error('Get conversations error:', error);
    return NextResponse.json({ error: error.message || 'Fout bij ophalen conversaties' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { title } = body;

    const conversation = await prisma.conversation.create({
      data: {
        clientId: client.id,
        title: title || 'Nieuwe conversatie',
      },
    });

    return NextResponse.json({ conversation });
  } catch (error: any) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: error.message || 'Fout bij aanmaken conversatie' }, { status: 500 });
  }
}
