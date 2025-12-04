import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Fetch all blog ideas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const ideas = await prisma.blogIdea.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ ideas });
  } catch (error) {
    console.error('Error fetching blog ideas:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Create new blog idea
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, keywords, priority, status, assignedTo, dueDate, notes } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const idea = await prisma.blogIdea.create({
      data: {
        title,
        description,
        keywords: keywords || [],
        priority: priority || 'medium',
        status: status || 'idea',
        assignedTo,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
      },
    });

    return NextResponse.json({ idea }, { status: 201 });
  } catch (error) {
    console.error('Error creating blog idea:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
