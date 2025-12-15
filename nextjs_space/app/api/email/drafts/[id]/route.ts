
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';


// GET - Fetch a single email draft
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const emailDraft = await prisma.emailDraft.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    if (!emailDraft) {
      return NextResponse.json({ error: 'Email draft not found' }, { status: 404 });
    }

    return NextResponse.json({ emailDraft });
  } catch (error) {
    console.error('Error fetching email draft:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email draft' },
      { status: 500 }
    );
  }
}

// PATCH - Update an email draft
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
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

    const emailDraft = await prisma.emailDraft.updateMany({
      where: {
        id: params.id,
        clientId: client.id,
      },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    if (emailDraft.count === 0) {
      return NextResponse.json({ error: 'Email draft not found' }, { status: 404 });
    }

    // Fetch the updated draft
    const updatedDraft = await prisma.emailDraft.findUnique({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, emailDraft: updatedDraft });
  } catch (error) {
    console.error('Error updating email draft:', error);
    return NextResponse.json(
      { error: 'Failed to update email draft' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an email draft
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const result = await prisma.emailDraft.deleteMany({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Email draft not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting email draft:', error);
    return NextResponse.json(
      { error: 'Failed to delete email draft' },
      { status: 500 }
    );
  }
}
