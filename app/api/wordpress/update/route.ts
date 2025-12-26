import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { WORDPRESS_ENDPOINTS, getWordPressEndpoint, buildWordPressHeaders } from '@/lib/wordpress-endpoints';


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Force dynamic rendering since we use cookies for authentication

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { article_id, update_fields } = body;

    if (!article_id) {
      return NextResponse.json(
        { error: 'article_id is verplicht' },
        { status: 400 }
      );
    }

    // Get article with project info
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select(`
        *,
        projects (
          id,
          user_id,
          wp_url,
          wp_username,
          wp_password
        )
      `)
      .eq('id', article_id)
      .single();

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Artikel niet gevonden' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (article.projects.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Geen toegang tot dit artikel' },
        { status: 403 }
      );
    }

    if (!article.wordpress_id) {
      return NextResponse.json(
        { error: 'Dit artikel is nog niet gepubliceerd naar WordPress' },
        { status: 400 }
      );
    }

    // Prepare WordPress credentials
    const wpUrl = article.projects.wp_url.replace(/\/$/, '');
    const wpUsername = article.projects.wp_username;
    const wpPassword = article.projects.wp_password;

    if (!wpUsername || !wpPassword) {
      return NextResponse.json(
        { error: 'WordPress credentials ontbreken' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (update_fields.title !== undefined) {
      updateData.title = update_fields.title;
    }

    if (update_fields.content !== undefined) {
      updateData.content = update_fields.content;
    }

    if (update_fields.excerpt !== undefined) {
      updateData.excerpt = update_fields.excerpt;
    }

    if (update_fields.slug !== undefined) {
      updateData.slug = update_fields.slug;
    }

    if (update_fields.status !== undefined) {
      // Convert our status to WordPress status
      const wpStatus = update_fields.status === 'published' ? 'publish' : update_fields.status;
      updateData.status = wpStatus;
    }

    // Note: Featured image and SEO fields require separate handling for standard WordPress API
    // For now, we'll skip featured_image_url and SEO fields - these can be added later if needed

    // Update post via WordPress REST API
    const wpApiUrl = getWordPressEndpoint(wpUrl, `${WORDPRESS_ENDPOINTS.wp.posts}/${article.wordpress_id}`);

    console.log(`Updating WordPress post ${article.wordpress_id} via REST API:`, updateData);

    const wpResponse = await fetch(wpApiUrl, {
      method: 'POST', // WordPress REST API uses POST for updates
      headers: buildWordPressHeaders(wpUsername, wpPassword, wpUrl),
      body: JSON.stringify(updateData),
      signal: AbortSignal.timeout(60000), // 60 second timeout
    });

    if (!wpResponse.ok) {
      const errorText = await wpResponse.text();
      console.error('WordPress update error:', wpResponse.status, errorText);

      if (wpResponse.status === 401) {
        return NextResponse.json(
          { error: 'WordPress authenticatie mislukt. Controleer je credentials.' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: `WordPress update mislukt: ${wpResponse.statusText}` },
        { status: wpResponse.status }
      );
    }

    const updatedPost = await wpResponse.json();

    // Update local database
    const dbUpdateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (update_fields.title !== undefined) dbUpdateData.title = update_fields.title;
    if (update_fields.content !== undefined) dbUpdateData.content = update_fields.content;
    if (update_fields.excerpt !== undefined) dbUpdateData.excerpt = update_fields.excerpt;
    if (update_fields.slug !== undefined) dbUpdateData.slug = update_fields.slug;
    if (update_fields.status !== undefined) dbUpdateData.status = update_fields.status;
    if (update_fields.featured_image !== undefined) dbUpdateData.featured_image = update_fields.featured_image;
    if (update_fields.meta_title !== undefined) dbUpdateData.meta_title = update_fields.meta_title;
    if (update_fields.meta_description !== undefined) dbUpdateData.meta_description = update_fields.meta_description;
    if (update_fields.focus_keyword !== undefined) dbUpdateData.focus_keyword = update_fields.focus_keyword;

    // Update WordPress URL if slug changed
    if (updatedPost.link) {
      dbUpdateData.wordpress_url = updatedPost.link;
    }

    const { error: dbError } = await supabase
      .from('articles')
      .update(dbUpdateData)
      .eq('id', article_id);

    if (dbError) {
      console.error('Database update error:', dbError);
      // Don't fail the request if DB update fails - WordPress is updated
    }

    return NextResponse.json({
      success: true,
      message: 'Post succesvol bijgewerkt in WordPress',
      wordpress_url: updatedPost.link,
    });

  } catch (error: any) {
    console.error('Error updating WordPress post:', error);

    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'WordPress server reageert niet. Probeer het later opnieuw.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden bij het bijwerken' },
      { status: 500 }
    );
  }
}
