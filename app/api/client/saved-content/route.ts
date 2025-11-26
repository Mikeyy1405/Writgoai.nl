

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/client/saved-content
 * Haal alle opgeslagen content op voor de ingelogde klant
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const isFavorite = searchParams.get('favorite') === 'true';
    const isArchived = searchParams.get('archived') === 'true';

    // Build filter
    const where: any = {
      clientId: client.id,
      isArchived: isArchived,
    };

    if (type && type !== 'all') {
      where.type = type;
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (isFavorite) {
      where.isFavorite = true;
    }

    // Fetch saved content
    const savedContent = await prisma.savedContent.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            websiteUrl: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      content: savedContent,
      count: savedContent.length,
    });

  } catch (error: any) {
    console.error('Error fetching saved content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/client/saved-content
 * Sla nieuwe content op
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      type,
      title,
      content,
      contentHtml,
      category,
      tags,
      description,
      keywords,
      metaDesc,
      slug,
      thumbnailUrl,
      imageUrls,
      projectId,
    } = body;

    // Validate required fields
    if (!type || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, content' },
        { status: 400 }
      );
    }

    // Calculate stats
    const wordCount = content.split(/\s+/).filter((w: string) => w.length > 0).length;
    const characterCount = content.length;

    // Create saved content
    const savedContent = await prisma.savedContent.create({
      data: {
        clientId: client.id,
        type,
        title,
        content,
        contentHtml: contentHtml || null,
        category: category || null,
        tags: tags || [],
        description: description || null,
        keywords: keywords || [],
        metaDesc: metaDesc || null,
        slug: slug || null,
        thumbnailUrl: thumbnailUrl || null,
        imageUrls: imageUrls || [],
        projectId: projectId || null,
        wordCount,
        characterCount,
        isFavorite: false,
        isArchived: false,
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

    console.log(`✅ Content saved: ${savedContent.title} (${savedContent.type})`);

    return NextResponse.json({
      success: true,
      content: savedContent,
      message: 'Content opgeslagen!'
    });

  } catch (error: any) {
    console.error('Error saving content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save content' },
      { status: 500 }
    );
  }
}
