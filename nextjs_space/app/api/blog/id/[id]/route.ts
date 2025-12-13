import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSupabaseClient } from '@/lib/supabase';

// GET - Get specific blog post by ID (admin)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient();
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: post, error } = await supabaseAdmin
      .from('blog_posts')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: 'Post niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT - Update blog post by ID (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      status,
      meta_title,
      meta_description,
      category,
      tags,
      published_at,
    } = body;

    // Check if new slug conflicts with another post
    if (slug) {
      const { data: existing } = await supabaseAdmin
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)
        .neq('id', params.id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'A post with this slug already exists' },
          { status: 409 }
        );
      }
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (featured_image !== undefined) updateData.featured_image = featured_image;
    if (status !== undefined) {
      updateData.status = status;
      // Auto-set published_at when publishing
      if (status === 'published' && published_at === undefined) {
        const { data: currentPost } = await supabaseAdmin
          .from('blog_posts')
          .select('published_at')
          .eq('id', params.id)
          .single();
        
        if (!currentPost?.published_at) {
          updateData.published_at = new Date().toISOString();
        }
      }
    }
    if (published_at !== undefined) updateData.published_at = published_at;
    if (meta_title !== undefined) updateData.meta_title = meta_title;
    if (meta_description !== undefined) updateData.meta_description = meta_description;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;

    const { data: post, error } = await supabaseAdmin
      .from('blog_posts')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!post) {
      return NextResponse.json({ error: 'Post niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Delete blog post by ID (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient();
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from('blog_posts')
      .delete()
      .eq('id', params.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
