

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = { clientId };
    if (status) {
      where.status = status;
    }

    const items = await prisma.contentCalendarItem.findMany({
      where,
      orderBy: { scheduledFor: 'asc' },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching calendar items:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = (session.user as any).id;
    const data = await req.json();

    const item = await prisma.contentCalendarItem.create({
      data: {
        clientId,
        title: data.title,
        content: data.content,
        mediaType: data.mediaType,
        mediaUrl: data.mediaUrl,
        mediaStyle: data.mediaStyle,
        scheduledFor: new Date(data.scheduledFor),
        platforms: data.platforms || [],
        includeHashtags: data.includeHashtags !== false,
        includeEmojis: data.includeEmojis !== false,
        tone: data.tone,
        isStorytelling: data.isStorytelling || false,
        storyType: data.storyType,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error creating calendar item:', error);
    return NextResponse.json({ error: 'Failed to create calendar item' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = (session.user as any).id;
    const { id, ...data } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.contentCalendarItem.findFirst({
      where: { id, clientId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const item = await prisma.contentCalendarItem.update({
      where: { id },
      data: {
        ...data,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error updating calendar item:', error);
    return NextResponse.json({ error: 'Failed to update calendar item' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    // Verify ownership and delete
    await prisma.contentCalendarItem.deleteMany({
      where: { id, clientId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting calendar item:', error);
    return NextResponse.json({ error: 'Failed to delete calendar item' }, { status: 500 });
  }
}
