

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/client/content
 * Haal alle opgeslagen content op voor de ingelogde client
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Haal alle content pieces op voor deze client
    const contentPieces = await prisma.contentPiece.findMany({
      where: { 
        clientId: client.id,
        blogContent: { not: null } // Alleen items met blog content
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        blogTitle: true,
        blogContent: true,
        blogKeywords: true,
        blogMetaDesc: true,
        blogImages: true,
        blogPublished: true,
        blogPublishedAt: true,
        blogUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ content: contentPieces });
  } catch (error: any) {
    console.error('❌ Error fetching content:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het ophalen van content' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/client/content
 * Sla een nieuwe blog op of update een bestaande
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const body = await req.json();
    const {
      id, // Optional - if provided, update existing
      title,
      content,
      keywords = [],
      metaDescription,
      images = [],
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Titel en content zijn verplicht' },
        { status: 400 }
      );
    }

    let contentPiece;

    if (id) {
      // Update existing content
      contentPiece = await prisma.contentPiece.update({
        where: { id, clientId: client.id },
        data: {
          blogTitle: title,
          blogContent: content,
          blogKeywords: keywords,
          blogMetaDesc: metaDescription,
          blogImages: images,
          updatedAt: new Date(),
        },
      });
      console.log('✅ Content updated:', contentPiece.id);
    } else {
      // Create new content piece
      contentPiece = await prisma.contentPiece.create({
        data: {
          clientId: client.id,
          blogTitle: title,
          blogContent: content,
          blogKeywords: keywords,
          blogMetaDesc: metaDescription,
          blogImages: images,
          dayNumber: 0, // Not part of a plan
          theme: title,
          scheduledFor: new Date(), // Set to now by default
        },
      });
      console.log('✅ Content created:', contentPiece.id);
    }

    return NextResponse.json({
      success: true,
      content: contentPiece,
      message: id ? 'Blog bijgewerkt' : 'Blog opgeslagen',
    });
  } catch (error: any) {
    console.error('❌ Error saving content:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het opslaan van content' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/client/content
 * Verwijder een opgeslagen blog
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Content ID is verplicht' }, { status: 400 });
    }

    // Check if content exists first
    const existingContent = await prisma.contentPiece.findFirst({
      where: { id, clientId: client.id },
      select: { id: true },
    });

    if (!existingContent) {
      console.log('⚠️ Content already deleted or not found:', id);
      return NextResponse.json({
        success: true,
        message: 'Content is al verwijderd',
      });
    }

    // Delete the content
    await prisma.contentPiece.delete({
      where: { id },
    });

    console.log('✅ Content deleted:', id);

    return NextResponse.json({
      success: true,
      message: 'Blog verwijderd',
    });
  } catch (error: any) {
    console.error('❌ Error deleting content:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      // Record not found - already deleted
      return NextResponse.json({
        success: true,
        message: 'Content is al verwijderd',
      });
    }
    
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het verwijderen van content' },
      { status: 500 }
    );
  }
}
