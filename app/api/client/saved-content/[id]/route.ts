

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/client/saved-content/[id]
 * Haal specifieke opgeslagen content op
 */
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
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const content = await prisma.savedContent.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            websiteUrl: true,
          }
        }
      }
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      content
    });

  } catch (error: any) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/client/saved-content/[id]
 * Update opgeslagen content
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check if content exists and belongs to client
    const existingContent = await prisma.savedContent.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      }
    });

    if (!existingContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    const body = await req.json();
    const updateData: any = {};

    // Only update provided fields
    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.contentHtml !== undefined) updateData.contentHtml = body.contentHtml;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.keywords !== undefined) updateData.keywords = body.keywords;
    if (body.metaDesc !== undefined) updateData.metaDesc = body.metaDesc;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl;
    if (body.imageUrls !== undefined) updateData.imageUrls = body.imageUrls;
    if (body.isFavorite !== undefined) updateData.isFavorite = body.isFavorite;
    if (body.isArchived !== undefined) updateData.isArchived = body.isArchived;
    if (body.publishedUrl !== undefined) updateData.publishedUrl = body.publishedUrl;
    if (body.publishedAt !== undefined) updateData.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
    if (body.projectId !== undefined) updateData.projectId = body.projectId;

    // Recalculate stats if content changed
    if (body.content !== undefined) {
      updateData.wordCount = body.content.split(/\s+/).filter((w: string) => w.length > 0).length;
      updateData.characterCount = body.content.length;
    }

    const updatedContent = await prisma.savedContent.update({
      where: { id: params.id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            websiteUrl: true,
          }
        }
      }
    });

    console.log(`✅ Content updated: ${updatedContent.title}`);

    return NextResponse.json({
      success: true,
      content: updatedContent,
      message: 'Content bijgewerkt!'
    });

  } catch (error: any) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update content' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/client/saved-content/[id]
 * Verwijder opgeslagen content
 */
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
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check if content exists and belongs to client
    const existingContent = await prisma.savedContent.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      }
    });

    if (!existingContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Delete content
    await prisma.savedContent.delete({
      where: { id: params.id }
    });

    console.log(`✅ Content deleted: ${existingContent.title}`);

    return NextResponse.json({
      success: true,
      message: 'Content verwijderd!'
    });

  } catch (error: any) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete content' },
      { status: 500 }
    );
  }
}
