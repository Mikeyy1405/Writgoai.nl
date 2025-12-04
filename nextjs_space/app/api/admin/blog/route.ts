
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Alle blog posts ophalen (met filters)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          featuredImage: true,
          metaTitle: true,
          metaDescription: true,
          focusKeyword: true,
          category: true,
          tags: true,
          status: true,
          publishedAt: true,
          scheduledFor: true,
          authorId: true,
          authorName: true,
          views: true,
          readingTimeMinutes: true,
          createdAt: true,
          updatedAt: true,
          language: true,
          // Exclude seoScore to prevent database errors if column doesn't exist
          // seoScore: true,
          internalLinks: true,
          externalLinks: true,
          wordCount: true,
          lastAnalyzed: true,
          searchConsoleData: true,
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    console.log(`[Admin API] Found ${total} blog posts in database (filters: ${JSON.stringify(where)})`);
    console.log(`[Admin API] Returning ${posts.length} posts for page ${page}`);

    return NextResponse.json({
      posts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Nieuwe blog post aanmaken
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      metaTitle,
      metaDescription,
      focusKeyword,
      category,
      tags,
      status,
      publishedAt,
      scheduledFor,
      authorName,
      readingTimeMinutes,
    } = body;

    // Validatie
    if (!title || !slug || !excerpt || !content) {
      return NextResponse.json(
        { error: 'Title, slug, excerpt en content zijn verplicht' },
        { status: 400 }
      );
    }

    // Check of slug al bestaat
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'Deze slug bestaat al' }, { status: 400 });
    }

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        featuredImage,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt,
        focusKeyword,
        category: category || 'AI & Content Marketing',
        tags: tags || [],
        status: status || 'draft',
        publishedAt: status === 'published' ? new Date() : publishedAt,
        scheduledFor,
        authorName: authorName || 'WritgoAI Team',
        readingTimeMinutes: readingTimeMinutes || 5,
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
