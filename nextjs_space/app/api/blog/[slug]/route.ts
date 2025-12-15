
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSupabaseClient } from '@/lib/supabase';

// GET - Specifieke blog post ophalen by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { data: post, error } = await supabaseAdmin
      .from('blog_posts')
      .select('*')
      .eq('slug', params.slug)
      .eq('status', 'published')
      .single();

    if (error) {
      // Check if error is due to missing table
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('[Blog API] blog_posts table does not exist yet.');
        return NextResponse.json({ error: 'Post niet gevonden' }, { status: 404 });
      }
      if (error.code === 'PGRST116' || !post) {
        return NextResponse.json({ error: 'Post niet gevonden' }, { status: 404 });
      }
      throw error;
    }

    if (!post) {
      return NextResponse.json({ error: 'Post niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT - Update blog post by slug (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
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
      slug: newSlug,
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
    if (newSlug && newSlug !== params.slug) {
      const { data: existing, error: existingError } = await supabaseAdmin
        .from('blog_posts')
        .select('id')
        .eq('slug', newSlug)
        .maybeSingle();

      if (existingError) {
        // Check if error is due to missing table
        if (existingError.code === 'PGRST205' || existingError.message?.includes('Could not find the table')) {
          console.warn('[Blog API] blog_posts table does not exist yet. Cannot update post.');
          return NextResponse.json(
            { error: 'Blog system not available. The blog_posts table needs to be created.' },
            { status: 503 }
          );
        }
        console.error('Error checking slug uniqueness:', existingError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      if (existing) {
        return NextResponse.json(
          { error: 'A post with this slug already exists' },
          { status: 409 }
        );
      }
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (newSlug !== undefined) updateData.slug = newSlug;
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
          .eq('slug', params.slug)
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
      .eq('slug', params.slug)
      .select()
      .single();

    if (error) {
      // Check if error is due to missing table
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('[Blog API] blog_posts table does not exist yet. Cannot update post.');
        return NextResponse.json(
          { error: 'Blog system not available. The blog_posts table needs to be created.' },
          { status: 503 }
        );
      }
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

// DELETE - Delete blog post by slug (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
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
      .eq('slug', params.slug);

    if (error) {
      // Check if error is due to missing table
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('[Blog API] blog_posts table does not exist yet. Cannot delete post.');
        return NextResponse.json(
          { error: 'Blog system not available. The blog_posts table needs to be created.' },
          { status: 503 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
