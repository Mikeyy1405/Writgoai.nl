import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { articleId } = body;

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    // Get article
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (fetchError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Publish article
    const { data: publishedArticle, error: updateError } = await supabase
      .from('articles')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', articleId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log activity
    await supabase.from('writgo_activity_logs').insert({
      action_type: 'article_published',
      description: `Artikel gepubliceerd: ${article.title}`,
      article_id: articleId,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      article: publishedArticle,
    });
  } catch (error: any) {
    console.error('Error publishing article:', error);

    // Log error
    try {
      const supabase = createClient();
      await supabase.from('writgo_activity_logs').insert({
        action_type: 'article_publish_failed',
        description: `Fout bij publiceren: ${error.message}`,
        status: 'error',
        metadata: { error: error.message },
      });
    } catch (logError) {
      console.error('Error logging activity:', logError);
    }

    return NextResponse.json(
      { error: error.message || 'Failed to publish article' },
      { status: 500 }
    );
  }
}
