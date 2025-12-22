import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteParams {
  params: {
    id: string;
  };
}

// PUT /api/blog/categories/[id] - Update category
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description } = body;

    const { data: category, error: categoryError } = await supabase
      .from('article_categories')
      .update({
        name,
        slug,
        description
      })
      .eq('id', params.id)
      .select()
      .single();

    if (categoryError) {
      if (categoryError.code === '23505') {
        return NextResponse.json({ error: 'Category with this name or slug already exists' }, { status: 409 });
      }
      console.error('Error updating category:', categoryError);
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error in PUT /api/blog/categories/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/blog/categories/[id] - Delete category
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error: deleteError } = await supabase
      .from('article_categories')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error deleting category:', deleteError);
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/blog/categories/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
