

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * POST - Sla een keyword op
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { 
      keyword,
      searchVolume,
      difficulty,
      cpc,
      competition,
      intent,
      potentialScore,
      relevance,
      category,
      relatedKeywords,
      questions,
      contentIdeas,
      priority,
      source
    } = body;

    // Check if keyword already exists
    const existing = await prisma.keyword.findFirst({
      where: {
        clientId: client.id,
        keyword: keyword
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Keyword already saved' },
        { status: 400 }
      );
    }

    // Create keyword
    const savedKeyword = await prisma.keyword.create({
      data: {
        clientId: client.id,
        keyword,
        searchVolume,
        difficulty,
        cpc,
        competition,
        intent,
        potentialScore,
        relevance,
        category,
        relatedKeywords: relatedKeywords || [],
        questions: questions || [],
        contentIdeas: contentIdeas || [],
        priority: priority || 'medium',
        source: source || 'keyword-research',
        isSaved: true
      }
    });

    return NextResponse.json({
      success: true,
      keyword: savedKeyword
    });

  } catch (error: any) {
    console.error('Error saving keyword:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save keyword' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Verwijder een keyword
 */
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const keywordId = searchParams.get('id');

    if (!keywordId) {
      return NextResponse.json({ error: 'Keyword ID is required' }, { status: 400 });
    }

    // Delete keyword
    await prisma.keyword.delete({
      where: {
        id: keywordId,
        clientId: client.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Keyword deleted'
    });

  } catch (error: any) {
    console.error('Error deleting keyword:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete keyword' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update keyword priority of notes
 */
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { keywordId, priority, notes } = body;

    if (!keywordId) {
      return NextResponse.json({ error: 'Keyword ID is required' }, { status: 400 });
    }

    // Update keyword
    const updatedKeyword = await prisma.keyword.update({
      where: {
        id: keywordId,
        clientId: client.id
      },
      data: {
        ...(priority && { priority }),
        ...(notes !== undefined && { notes })
      }
    });

    return NextResponse.json({
      success: true,
      keyword: updatedKeyword
    });

  } catch (error: any) {
    console.error('Error updating keyword:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update keyword' },
      { status: 500 }
    );
  }
}
