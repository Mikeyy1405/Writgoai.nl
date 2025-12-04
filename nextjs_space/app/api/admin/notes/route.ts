import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || session.user.email !== 'info@writgo.nl') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the admin's notes
    const note = await prisma.adminDashboardNote.findUnique({
      where: {
        userId: session.user.email,
      },
    });

    return NextResponse.json({
      success: true,
      content: note?.content || '',
      updatedAt: note?.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching admin notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || session.user.email !== 'info@writgo.nl') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { content } = await req.json();

    // Validate content length (max 5000 characters)
    if (content && content.length > 5000) {
      return NextResponse.json(
        { error: 'Content exceeds maximum length of 5000 characters' },
        { status: 400 }
      );
    }

    // Upsert the note
    const note = await prisma.adminDashboardNote.upsert({
      where: {
        userId: session.user.email,
      },
      update: {
        content: content || '',
      },
      create: {
        userId: session.user.email,
        content: content || '',
      },
    });

    return NextResponse.json({
      success: true,
      content: note.content,
      updatedAt: note.updatedAt,
    });
  } catch (error) {
    console.error('Error saving admin notes:', error);
    return NextResponse.json(
      { error: 'Failed to save notes' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  // Use same logic as POST for auto-save
  return POST(req);
}
