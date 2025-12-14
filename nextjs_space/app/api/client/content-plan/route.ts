import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Fetch planned content items for the calendar
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get client ID from session
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Fetch saved content items that are planned for this project
    const items = await prisma.savedContent.findMany({
      where: {
        clientId: client.id,
        projectId,
        type: 'content-plan', // Mark these as content plan items
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        keywords: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    return NextResponse.json({
      success: true,
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        scheduledFor: item.publishedAt || item.createdAt,
        status: item.publishedAt ? 'published' : 'planned',
        contentType: item.category,
        focusKeyword: item.keywords?.[0] || '',
      })),
    });

  } catch (error: any) {
    console.error('Error fetching content plan:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch content plan' 
    }, { status: 500 });
  }
}

// POST - Add new planned item to calendar
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      projectId, 
      title, 
      focusKeyword, 
      contentType, 
      description,
      outline,
      scheduledFor, 
      notes,
      status = 'planned'
    } = body;

    if (!projectId || !title || !scheduledFor) {
      return NextResponse.json({ 
        error: 'Project ID, title, and scheduled date are required' 
      }, { status: 400 });
    }

    // Get client ID from session
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Create a slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now();

    // Prepare content with outline and notes
    const content = [
      notes || '',
      outline ? '\n\nSuggereerde Outline:\n' + outline.join('\n') : ''
    ].filter(Boolean).join('\n');

    // Create the content plan item using SavedContent
    const item = await prisma.savedContent.create({
      data: {
        clientId: client.id,
        projectId,
        type: 'content-plan',
        title,
        content,
        description: description || '',
        category: contentType || 'general',
        keywords: focusKeyword ? [focusKeyword] : [],
        slug,
        metaDesc: description || '',
        publishedAt: status === 'published' ? new Date(scheduledFor) : null,
      }
    });

    return NextResponse.json({
      success: true,
      item,
    });

  } catch (error: any) {
    console.error('Error creating planned content item:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create planned content item' 
    }, { status: 500 });
  }
}

// DELETE - Remove planned item
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('id');

    if (!itemId || typeof itemId !== 'string') {
      return NextResponse.json({ error: 'Valid item ID is required' }, { status: 400 });
    }

    // Get client ID from session
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify ownership before deleting
    const item = await prisma.savedContent.findUnique({
      where: { id: itemId },
      select: { clientId: true }
    });

    if (!item || item.clientId !== client.id) {
      return NextResponse.json({ error: 'Item not found or unauthorized' }, { status: 404 });
    }

    await prisma.savedContent.delete({
      where: { id: itemId }
    });

    return NextResponse.json({
      success: true,
    });

  } catch (error: any) {
    console.error('Error deleting planned content item:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to delete planned content item' 
    }, { status: 500 });
  }
}
