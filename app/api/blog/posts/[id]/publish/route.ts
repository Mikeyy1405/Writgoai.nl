import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteParams {
  params: {
    id: string;
  };
}

// PATCH /api/blog/posts/[id]/publish - Publish post
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // When publishing to WritGo blog, set project_id to NULL
    // This ensures the article appears on writgo.nl/blog which only shows articles without project_id
    const { data: post, error: postError } = await supabase
      .from('articles')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        project_id: null  // Remove project association to show on WritGo blog
      })
      .eq('id', params.id)
      .select()
      .single();

    if (postError) {
      console.error('Error publishing post:', postError);
      return NextResponse.json({ error: 'Failed to publish post' }, { status: 500 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error in PATCH /api/blog/posts/[id]/publish:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
