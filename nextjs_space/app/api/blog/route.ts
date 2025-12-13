
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSupabaseClient } from '@/lib/supabase';

// GET - Publieke blog posts ophalen (for public /blog page)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const status = searchParams.get('status'); // For admin filtering

    // Build query - use blog_posts table (internal blog system)
    let query = supabaseAdmin
      .from('blog_posts')
      .select('*', { count: 'exact' });

    // For public, only show published posts
    if (!status) {
      query = query.eq('status', 'published').not('published_at', 'is', null);
    } else if (status !== 'all') {
      // For admin filtering
      query = query.eq('status', status);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    // Apply pagination
    query = query
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
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

// POST - Create new blog post (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      content,
      excerpt,
      featured_image,
      status = 'draft',
      meta_title,
      meta_description,
      category,
      tags = [],
      published_at,
    } = body;

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const { data: existing } = await supabaseAdmin
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 409 }
      );
    }

    // Create the post
    const { data: post, error } = await supabaseAdmin
      .from('blog_posts')
      .insert({
        title,
        slug,
        content,
        excerpt,
        featured_image,
        author_id: session.user.id,
        status,
        meta_title,
        meta_description,
        category,
        tags,
        published_at: status === 'published' && !published_at ? new Date().toISOString() : published_at,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
