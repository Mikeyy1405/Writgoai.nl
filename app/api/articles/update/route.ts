import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { generateAICompletion, generateJSONCompletion } from '@/lib/ai-client';

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
    const { article_id } = body;

    if (!article_id) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    // Get article with project
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select(`
        *,
        project:projects(*)
      `)
      .eq('id', article_id)
      .single();

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Verify project belongs to user
    if (article.project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Generate updated content with AI
    const prompt = `Update and improve the following blog article while keeping the same topic and main message. Make it more engaging, add fresh insights, and improve SEO optimization.

Original Title: ${article.title}

Original Content:
${article.content}

Requirements:
- Keep the same topic and core message
- Add new information or perspectives
- Improve readability and engagement
- Enhance SEO optimization
- Keep approximately the same length
- Write in Dutch language
- Format as HTML with proper heading tags

Provide the updated content:`;

    const completion = await generateAICompletion({
      task: 'content',
      systemPrompt: 'You are an expert SEO content writer who updates and improves blog articles in Dutch. You always format your output as clean HTML.',
      userPrompt: prompt,
      temperature: 0.7,
      maxTokens: 4000,
    });

    const updatedContent = completion || article.content;

    // Update article in database
    const { error: updateError } = await supabase
      .from('articles')
      .update({
        content: updatedContent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', article_id);

    if (updateError) {
      console.error('Database error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update article' },
        { status: 500 }
      );
    }

    // If article is published, update on WordPress
    if (article.status === 'published' && article.project.wp_url) {
      try {
        // First, get WordPress posts to find the matching one
        const wpListResponse = await fetch(`${article.project.wp_url}/posts?search=${encodeURIComponent(article.title)}&per_page=1`, {
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${article.project.wp_username}:${article.project.wp_password}`).toString('base64'),
          },
        });

        if (wpListResponse.ok) {
          const wpPosts = await wpListResponse.json();
          if (wpPosts.length > 0) {
            const wpPostId = wpPosts[0].id;

            // Update the WordPress post
            await fetch(`${article.project.wp_url}/posts/${wpPostId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(`${article.project.wp_username}:${article.project.wp_password}`).toString('base64'),
              },
              body: JSON.stringify({
                content: updatedContent,
              }),
            });
          }
        }
      } catch (wpError) {
        console.error('WordPress update error:', wpError);
        // Continue even if WordPress update fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Article updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating article:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
