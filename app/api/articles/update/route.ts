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
    const { 
      id,           // Optional - if provided, update existing article
      article_id,   // Alternative name for id (backwards compatibility)
      title, 
      content, 
      project_id, 
      status = 'draft',
      slug,
      published_at,
      excerpt,
      featured_image,
      meta_title,
      meta_description,
      focus_keyword
    } = body;

    // Use id or article_id
    const articleId = id || article_id;

    // If we have an article ID, update existing article
    if (articleId) {
      // Get article with project to verify ownership
      const { data: article, error: articleError } = await supabase
        .from('articles')
        .select(`
          *,
          project:projects(*)
        `)
        .eq('id', articleId)
        .single();

      if (articleError || !article) {
        return NextResponse.json(
          { error: 'Article not found' },
          { status: 404 }
        );
      }

      // Verify project belongs to user (skip if article has no project, i.e., WritGo blog article)
      if (article.project && article.project.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Build update object with only provided fields
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (status !== undefined) updateData.status = status;
      if (slug !== undefined) updateData.slug = slug;
      if (published_at !== undefined) updateData.published_at = published_at;
      if (excerpt !== undefined) updateData.excerpt = excerpt;
      if (featured_image !== undefined) updateData.featured_image = featured_image;
      if (meta_title !== undefined) updateData.meta_title = meta_title;
      if (meta_description !== undefined) updateData.meta_description = meta_description;
      if (focus_keyword !== undefined) updateData.focus_keyword = focus_keyword;
      // Allow updating project_id (e.g., setting to null when publishing to WritGo blog)
      if (project_id !== undefined) updateData.project_id = project_id;

      // Update article in database
      const { error: updateError } = await supabase
        .from('articles')
        .update(updateData)
        .eq('id', articleId);

      if (updateError) {
        console.error('Database error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update article' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Article updated successfully',
        article_id: articleId
      });
    }

    // No article ID - create new article
    if (!title || !content || !project_id) {
      return NextResponse.json(
        { error: 'Title, content, and project_id are required for new articles' },
        { status: 400 }
      );
    }

    // Verify project belongs to user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      );
    }

    // Generate slug if not provided
    const articleSlug = slug || title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Calculate word count
    const wordCount = content.split(/\s+/).filter((w: string) => w.length > 0).length;

    // Create new article
    const { data: newArticle, error: insertError } = await supabase
      .from('articles')
      .insert({
        title,
        content,
        project_id,
        status,
        slug: articleSlug,
        excerpt: excerpt || content.substring(0, 160).replace(/<[^>]*>/g, ''),
        featured_image: featured_image || null,
        meta_title: meta_title || title,
        meta_description: meta_description || content.substring(0, 160).replace(/<[^>]*>/g, ''),
        focus_keyword: focus_keyword || null,
        published_at: status === 'published' ? (published_at || new Date().toISOString()) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database error:', insertError);
      return NextResponse.json(
        { error: `Failed to create article: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Article created successfully',
      article: newArticle,
      article_id: newArticle.id,
      word_count: wordCount
    });

  } catch (error: any) {
    console.error('Error in articles/update:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
