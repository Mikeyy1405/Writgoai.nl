
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Publieke blog posts ophalen
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Build query
    let query = supabaseAdmin
      .from('BlogPost')
      .select('id, title, slug, excerpt, featuredImage, category, tags, publishedAt, readingTimeMinutes, views', { count: 'exact' })
      .eq('status', 'published')
      .not('publishedAt', 'is', null);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    // Apply pagination
    query = query
      .order('publishedAt', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    const { data: posts, count: total, error } = await query;

    if (error) {
      throw error;
    }

    console.log(`[Public API] Found ${total} published blog posts in database`);
    console.log(`[Public API] Returning ${posts?.length || 0} posts for page ${page}`);

    return NextResponse.json({
      posts: posts || [],
      pagination: {
        total: total || 0,
        page,
        limit,
        pages: Math.ceil((total || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
