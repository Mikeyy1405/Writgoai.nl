import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/blog/tags - List all tags
export async function GET() {
  try {
    const supabase = createClient();

    const { data: tags, error } = await supabase
      .from('article_tags')
      .select(`
        *,
        post_count:article_tag_mapping(count)
      `)
      .order('name');

    if (error) {
      console.error('Error fetching tags:', error);
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
    }

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Error in GET /api/blog/tags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/blog/tags - Create new tag
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Generate slug if not provided
    const tagSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    const { data: tag, error: tagError } = await supabase
      .from('article_tags')
      .insert({
        name,
        slug: tagSlug
      })
      .select()
      .single();

    if (tagError) {
      if (tagError.code === '23505') {
        return NextResponse.json({ error: 'Tag with this name or slug already exists' }, { status: 409 });
      }
      console.error('Error creating tag:', tagError);
      return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
    }

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/blog/tags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
