import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - List knowledge base items
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = await prisma.knowledgeBase.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error('❌ GET knowledge base error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create knowledge base item
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const item = await prisma.knowledgeBase.create({
      data: {
        projectId: params.id,
        title: body.title,
        content: body.content,
        type: body.type || 'document',
        tags: body.tags || []
      }
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('❌ POST knowledge base error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
