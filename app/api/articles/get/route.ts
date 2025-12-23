import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('id');

    if (!articleId) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 });
    }

    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get article
    const { data: article, error: dbError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Verify user owns this article's project
    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', article.project_id)
      .single();

    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
