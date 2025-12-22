import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// Force dynamic rendering for this API route
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
    const { project_id, article_id, title, content } = body;

    if (!project_id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
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

    // Check if WordPress is configured
    if (!project.wp_url || !project.wp_username || !project.wp_password) {
      return NextResponse.json(
        { error: 'WordPress is niet geconfigureerd voor dit project. Voeg WordPress credentials toe in projectinstellingen.' },
        { status: 400 }
      );
    }

    let articleTitle = title;
    let articleContent = content;

    // If article_id is provided, get article from database
    if (article_id) {
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

      articleTitle = article.title;
      articleContent = article.content;
    }

    // Validate we have content to publish
    if (!articleTitle || !articleContent) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Publish to WordPress
    try {
      const wpResponse = await fetch(`${project.wp_url}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from(`${project.wp_username}:${project.wp_password}`).toString('base64'),
        },
        body: JSON.stringify({
          title: articleTitle,
          content: articleContent,
          status: 'publish',
        }),
      });

      if (!wpResponse.ok) {
        const errorText = await wpResponse.text();
        console.error('WordPress error:', errorText);
        
        // Parse WordPress error for better message
        let errorMessage = 'Failed to publish to WordPress';
        try {
          const wpError = JSON.parse(errorText);
          errorMessage = wpError.message || errorMessage;
        } catch {
          // Use default error message
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: 500 }
        );
      }

      const wpPost = await wpResponse.json();

      // Update article status if we have an article_id
      if (article_id) {
        await supabase
          .from('articles')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
          })
          .eq('id', article_id);
      }

      return NextResponse.json({
        success: true,
        url: wpPost.link,
        wordpress_url: wpPost.link,
        wordpress_id: wpPost.id,
      });

    } catch (wpError: any) {
      console.error('WordPress connection error:', wpError);
      return NextResponse.json(
        { error: `Kon geen verbinding maken met WordPress: ${wpError.message}` },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error publishing to WordPress:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
