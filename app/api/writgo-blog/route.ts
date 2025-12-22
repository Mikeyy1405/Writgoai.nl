import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Get all blog posts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabaseAdmin
      .from('writgo_blog_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const { data: posts, error } = await query;

    if (error) throw error;

    return NextResponse.json({ posts: posts || [] });
  } catch (error: any) {
    console.error('Get blog posts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create new blog post
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      title, 
      content, 
      excerpt, 
      featured_image, 
      category, 
      tags, 
      status,
      meta_title,
      meta_description,
      author_id,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Generate slug from title
    let slug = generateSlug(title);
    
    // Check if slug exists and make unique if needed
    const { data: existing } = await supabaseAdmin
      .from('writgo_blog_posts')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const { data: post, error } = await supabaseAdmin
      .from('writgo_blog_posts')
      .insert({
        title,
        slug,
        content: content || '',
        excerpt: excerpt || '',
        featured_image,
        category: category || 'Algemeen',
        tags: tags || [],
        status: status || 'draft',
        meta_title: meta_title || title,
        meta_description: meta_description || excerpt,
        author_id,
        published_at: status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error('Create blog post error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update blog post
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { 
      id,
      title, 
      content, 
      excerpt, 
      featured_image, 
      category, 
      tags, 
      status,
      meta_title,
      meta_description,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) {
      updates.title = title;
      updates.slug = generateSlug(title);
    }
    if (content !== undefined) updates.content = content;
    if (excerpt !== undefined) updates.excerpt = excerpt;
    if (featured_image !== undefined) updates.featured_image = featured_image;
    if (category !== undefined) updates.category = category;
    if (tags !== undefined) updates.tags = tags;
    if (meta_title !== undefined) updates.meta_title = meta_title;
    if (meta_description !== undefined) updates.meta_description = meta_description;
    
    if (status !== undefined) {
      updates.status = status;
      if (status === 'published') {
        // Check if already published
        const { data: existing } = await supabaseAdmin
          .from('writgo_blog_posts')
          .select('published_at')
          .eq('id', id)
          .single();
        
        if (!existing?.published_at) {
          updates.published_at = new Date().toISOString();
        }
      }
    }

    const { data: post, error } = await supabaseAdmin
      .from('writgo_blog_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error('Update blog post error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete blog post
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('writgo_blog_posts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete blog post error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
