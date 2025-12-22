import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteParams {
  params: {
    id: string;
  };
}

// PUT /api/blog/posts/[id] - Update post
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
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
      published_at,
      meta_title,
      meta_description,
      focus_keyword,
      seo_keywords,
      categories,
      tags
    } = body;

    // Update post
    const { data: post, error: postError } = await supabase
      .from('articles')
      .update({
        title,
        slug,
        content,
        excerpt,
        featured_image,
        status,
        published_at: status === 'published' && !published_at ? new Date().toISOString() : published_at,
        meta_title,
        meta_description,
        focus_keyword,
        seo_keywords
      })
      .eq('id', params.id)
      .select()
      .single();

    if (postError) {
      console.error('Error updating post:', postError);
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }

    // Update categories
    if (categories !== undefined) {
      // Delete existing mappings
      await supabase
        .from('article_category_mapping')
        .delete()
        .eq('article_id', params.id);

      // Add new mappings
      if (categories.length > 0) {
        const categoryMappings = categories.map((categoryId: string) => ({
          article_id: params.id,
          category_id: categoryId
        }));

        await supabase
          .from('article_category_mapping')
          .insert(categoryMappings);
      }
    }

    // Update tags
    if (tags !== undefined) {
      // Delete existing mappings
      await supabase
        .from('article_tag_mapping')
        .delete()
        .eq('article_id', params.id);

      // Add new mappings
      if (tags.length > 0) {
        const tagMappings = tags.map((tagId: string) => ({
          article_id: params.id,
          tag_id: tagId
        }));

        await supabase
          .from('article_tag_mapping')
          .insert(tagMappings);
      }
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error in PUT /api/blog/posts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/blog/posts/[id] - Delete post
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error: deleteError } = await supabase
      .from('articles')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error deleting post:', deleteError);
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/blog/posts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
