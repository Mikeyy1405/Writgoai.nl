/**
 * Blog API Route - Simplified Interface
 * 
 * Returns published blog posts for the simplified blog interface
 * Uses Supabase/Prisma to fetch data
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // Fetch published blog posts
    const posts = await prisma.blogPost.findMany({
      where: {
        status: 'published',
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 50,
    });

    return NextResponse.json(posts || []);
  } catch (error) {
    console.error('[Blog API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' }, 
      { status: 500 }
    );
  }
}
