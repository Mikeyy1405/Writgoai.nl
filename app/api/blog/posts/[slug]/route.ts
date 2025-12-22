import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteParams {
  params: {
    slug: string;
  };
}

// GET /api/blog/posts/[slug] - Get single post by slug
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();

    const { data: post, error } = await supabase
      .from('articles')
      .select(`
        *,
        author:author_id(id, email),
        categories:article_category_mapping(category:article_categories(*)),
        tags:article_tag_mapping(tag:article_tags(*))
      `)
      .eq('slug', params.slug)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error in GET /api/blog/posts/[slug]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
