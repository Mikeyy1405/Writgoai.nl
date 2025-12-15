/**
 * Individual Email List API
 * Get, update, delete specific email list
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const list = await prisma.emailList.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
      include: {
        subscribers: {
          orderBy: { subscribedAt: 'desc' },
          take: 100,
        },
        _count: {
          select: { subscribers: true, campaigns: true },
        },
      },
    });

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    return NextResponse.json({ list });
  } catch (error: any) {
    console.error('[Email List] Error fetching list:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch email list' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, isActive } = body;

    const list = await prisma.emailList.updateMany({
      where: {
        id: params.id,
        clientId: client.id,
      },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    if (list.count === 0) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    const updatedList = await prisma.emailList.findUnique({
      where: { id: params.id },
    });

    return NextResponse.json({ list: updatedList });
  } catch (error: any) {
    console.error('[Email List] Error updating list:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update email list' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const deleted = await prisma.emailList.deleteMany({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Email List] Error deleting list:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete email list' },
      { status: 500 }
    );
  }
}
