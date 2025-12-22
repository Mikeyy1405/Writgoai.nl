import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, article_id } = body;
    
    const articleId = id || article_id;
    
    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    // First verify the article belongs to this user
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('id, user_id, project_id')
      .eq('id', articleId)
      .single();

    if (fetchError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Check if user owns this article (either directly or via project)
    if (article.user_id !== user.id) {
      // Check if user owns the project
      const { data: project } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', article.project_id)
        .single();
      
      if (!project || project.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Not authorized to delete this article' },
          { status: 403 }
        );
      }
    }

    // Delete the article
    const { error: deleteError } = await supabase
      .from('articles')
      .delete()
      .eq('id', articleId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete article' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support DELETE method
export async function DELETE(request: Request) {
  return POST(request);
}
