/**
 * Email Lists Management API
 * Create, read, update, delete email lists
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client from session
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get all email lists for this client
    const lists = await prisma.emailList.findMany({
      where: { clientId: client.id },
      include: {
        _count: {
          select: { subscribers: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ lists });
  } catch (error: any) {
    console.error('[Email Lists] Error fetching lists:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch email lists' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'List name is required' },
        { status: 400 }
      );
    }

    // Create new email list
    const list = await prisma.emailList.create({
      data: {
        clientId: client.id,
        name,
        description,
      },
    });

    return NextResponse.json({ list }, { status: 201 });
  } catch (error: any) {
    console.error('[Email Lists] Error creating list:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create email list' },
      { status: 500 }
    );
  }
}
