import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id, article_id } = body;

    if (!project_id || !article_id) {
      return NextResponse.json(
        { error: 'Project ID and Article ID are required' },
        { status: 400 }
      );
    }

    // Get project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get article
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', article_id)
      .eq('project_id', project_id)
      .single();

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Publish to WordPress
    const wpResponse = await fetch(`${project.wp_url}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${project.wp_username}:${project.wp_password}`).toString('base64'),
      },
      body: JSON.stringify({
        title: article.title,
        content: article.content,
        status: 'publish',
      }),
    });

    if (!wpResponse.ok) {
      const errorText = await wpResponse.text();
      console.error('WordPress error:', errorText);
      return NextResponse.json(
        { error: 'Failed to publish to WordPress' },
        { status: 500 }
      );
    }

    const wpPost = await wpResponse.json();

    // Update article status
    await supabase
      .from('articles')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', article_id);

    return NextResponse.json({
      success: true,
      wordpress_url: wpPost.link,
      wordpress_id: wpPost.id,
    });
  } catch (error: any) {
    console.error('Error publishing to WordPress:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
