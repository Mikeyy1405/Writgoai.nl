import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/blog/categories - List all categories
export async function GET() {
  try {
    const supabase = createClient();

    const { data: categories, error } = await supabase
      .from('article_categories')
      .select(`
        *,
        post_count:article_category_mapping(count)
      `)
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error in GET /api/blog/categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/blog/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Generate slug if not provided
    const categorySlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    const { data: category, error: categoryError } = await supabase
      .from('article_categories')
      .insert({
        name,
        slug: categorySlug,
        description
      })
      .select()
      .single();

    if (categoryError) {
      if (categoryError.code === '23505') {
        return NextResponse.json({ error: 'Category with this name or slug already exists' }, { status: 409 });
      }
      console.error('Error creating category:', categoryError);
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/blog/categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
