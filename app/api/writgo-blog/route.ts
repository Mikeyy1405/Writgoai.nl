import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabaseAdmin as any;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Get all blog posts from articles table (only posts WITHOUT project_id - WritGo.nl content)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = getSupabaseAdmin()
      .from('articles')
      .select('id, slug, title, content, excerpt, featured_image, focus_keyword, status, meta_title, meta_description, published_at, created_at, updated_at, views')
      .is('project_id', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: posts, error } = await query;

    if (error) throw error;

    // Map to expected format
    const mappedPosts = (posts || []).map(post => ({
      ...post,
      category: post.focus_keyword || 'Algemeen',
      tags: [],
    }));

    return NextResponse.json({ posts: mappedPosts });
  } catch (error: any) {
    console.error('Get blog posts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create new blog post in articles table (WritGo.nl content - NO project_id)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      title, 
      slug: customSlug,
      content, 
      excerpt, 
      featured_image, 
      category, 
      status,
      meta_title,
      meta_description,
      focus_keyword,
      author_id,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Use custom slug if provided, otherwise generate from title
    let slug = customSlug ? customSlug.toLowerCase().trim() : generateSlug(title);
    
    // Validate slug format
    slug = slug
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Check if slug exists and make unique if needed
    const { data: existing } = await getSupabaseAdmin()
      .from('articles')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const { data: post, error } = await getSupabaseAdmin()
      .from('articles')
      .insert({
        title,
        slug,
        content: content || '',
        excerpt: excerpt || '',
        featured_image,
        focus_keyword: focus_keyword || category || 'Algemeen',
        status: status || 'draft',
        meta_title: meta_title || title,
        meta_description: meta_description || excerpt,
        author_id,
        published_at: status === 'published' ? new Date().toISOString() : null,
        views: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      post: {
        ...post,
        category: post.focus_keyword || 'Algemeen',
        tags: [],
      }
    });
  } catch (error: any) {
    console.error('Create blog post error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update blog post in articles table
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { 
      id,
      title, 
      slug: customSlug,
      content, 
      excerpt, 
      featured_image, 
      category, 
      status,
      meta_title,
      meta_description,
      focus_keyword,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) {
      updates.title = title;
    }
    
    // Handle custom slug
    if (customSlug !== undefined) {
      let slug = customSlug.toLowerCase().trim();
      // Validate slug format
      slug = slug
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Check if slug exists (but not for the current post)
      const { data: existing } = await getSupabaseAdmin()
        .from('articles')
        .select('id, slug')
        .eq('slug', slug)
        .neq('id', id)
        .single();

      if (existing) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }
      
      updates.slug = slug;
    } else if (title !== undefined && customSlug === undefined) {
      // Only auto-generate if no custom slug provided
      updates.slug = generateSlug(title);
    }
    
    if (content !== undefined) updates.content = content;
    if (excerpt !== undefined) updates.excerpt = excerpt;
    if (featured_image !== undefined) updates.featured_image = featured_image;
    if (category !== undefined) updates.focus_keyword = category;
    if (focus_keyword !== undefined) updates.focus_keyword = focus_keyword;
    if (meta_title !== undefined) updates.meta_title = meta_title;
    if (meta_description !== undefined) updates.meta_description = meta_description;
    
    if (status !== undefined) {
      updates.status = status;
      if (status === 'published') {
        // Check if already published
        const { data: existing } = await getSupabaseAdmin()
          .from('articles')
          .select('published_at')
          .eq('id', id)
          .single();
        
        if (!existing?.published_at) {
          updates.published_at = new Date().toISOString();
        }
      }
    }

    const { data: post, error } = await getSupabaseAdmin()
      .from('articles')
      .update(updates)
      .eq('id', id)
      .is('project_id', null)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      post: {
        ...post,
        category: post.focus_keyword || 'Algemeen',
        tags: [],
      }
    });
  } catch (error: any) {
    console.error('Update blog post error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete blog post from articles table
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const { error } = await getSupabaseAdmin()
      .from('articles')
      .delete()
      .eq('id', id)
      .is('project_id', null);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete blog post error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
