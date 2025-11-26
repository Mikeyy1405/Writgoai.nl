
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Specifieke blog post ophalen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const post = await prisma.blogPost.findUnique({
      where: { id: params.id },
    });

    if (!post) {
      return NextResponse.json({ error: 'Blog post niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT - Blog post bijwerken
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check of post bestaat
    const existing = await prisma.blogPost.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Blog post niet gevonden' }, { status: 404 });
    }

    // Check of nieuwe slug uniek is (behalve voor deze post)
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.blogPost.findFirst({
        where: { slug, NOT: { id: params.id } },
      });
      if (slugExists) {
        return NextResponse.json({ error: 'Deze slug bestaat al' }, { status: 400 });
      }
    }

    // Als status van draft naar published gaat, zet publishedAt
    const updateData: any = {
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
      scheduledFor,
      authorName,
      readingTimeMinutes,
    };

    if (status === 'published' && existing.status !== 'published') {
      updateData.publishedAt = new Date();
    }

    const post = await prisma.blogPost.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Blog post verwijderen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.blogPost.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
