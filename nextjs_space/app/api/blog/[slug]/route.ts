
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Specifieke blog post ophalen en views incrementeren
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const post = await prisma.blogPost.findFirst({
      where: {
        slug: params.slug,
        status: 'published',
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post niet gevonden' }, { status: 404 });
    }

    // Increment views (async zonder te wachten)
    prisma.blogPost
      .update({
        where: { id: post.id },
        data: { views: { increment: 1 } },
      })
      .catch((err) => console.error('Error incrementing views:', err));

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
