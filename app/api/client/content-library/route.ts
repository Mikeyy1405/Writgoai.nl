

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Ophalen van alle content
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const isFavorite = searchParams.get('favorite') === 'true';
    const isArchived = searchParams.get('archived') === 'true';
    const search = searchParams.get('search');

    // Build filter
    const where: any = {
      clientId: client.id,
      isArchived: isArchived,
    };

    if (type) where.type = type;
    if (category) where.category = category;
    if (isFavorite) where.isFavorite = true;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const content = await prisma.savedContent.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            websiteUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het ophalen van content' },
      { status: 500 }
    );
  }
}

// POST - Nieuw content item opslaan
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const data = await req.json();

    // Calculate word count and character count
    const text = data.content || '';
    const wordCount = text.split(/\s+/).filter((word: string) => word.length > 0).length;
    const characterCount = text.length;

    const content = await prisma.savedContent.create({
      data: {
        clientId: client.id,
        type: data.type || 'other',
        title: data.title,
        content: data.content,
        contentHtml: data.contentHtml,
        category: data.category,
        tags: data.tags || [],
        description: data.description,
        keywords: data.keywords || [],
        metaDesc: data.metaDesc,
        slug: data.slug,
        thumbnailUrl: data.thumbnailUrl,
        imageUrls: data.imageUrls || [],
        projectId: data.projectId,
        wordCount,
        characterCount,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            websiteUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error saving content:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het opslaan van content' },
      { status: 500 }
    );
  }
}
