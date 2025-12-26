import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { WORDPRESS_ENDPOINTS, getWordPressEndpoint, buildWritgoHeaders } from '@/lib/wordpress-endpoints';


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
          writgo_api_key
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

    // Prepare WritGo plugin credentials
    const wpUrl = article.projects.wp_url.replace(/\/$/, '');
    const apiKey = article.projects.writgo_api_key;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'WritGo API key ontbreekt' },
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

    // Handle featured image update - WritGo plugin handles this automatically
    if (update_fields.featured_image !== undefined && update_fields.featured_image) {
      updateData.featured_image_url = update_fields.featured_image;
    }

    // Handle SEO fields - WritGo plugin auto-detects Yoast/RankMath
    if (update_fields.meta_title !== undefined) {
      updateData.seo_title = update_fields.meta_title;
    }
    if (update_fields.meta_description !== undefined) {
      updateData.seo_description = update_fields.meta_description;
    }
    if (update_fields.focus_keyword !== undefined) {
      updateData.focus_keyword = update_fields.focus_keyword;
    }

    // Update post via WritGo plugin
    const wpApiUrl = `${wpUrl}${WORDPRESS_ENDPOINTS.writgo.posts}/${article.wordpress_id}`;

    console.log(`Updating WordPress post ${article.wordpress_id} via WritGo plugin:`, updateData);

    const wpResponse = await fetch(wpApiUrl, {
      method: 'PUT',
      headers: buildWritgoHeaders(apiKey, wpUrl),
      body: JSON.stringify(updateData),
      signal: AbortSignal.timeout(60000), // 60 second timeout
    });

    if (!wpResponse.ok) {
      const errorText = await wpResponse.text();
      console.error('WordPress update error:', wpResponse.status, errorText);

      if (wpResponse.status === 401) {
        return NextResponse.json(
          { error: 'WritGo API key authenticatie mislukt. Controleer je API key.' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: `WritGo plugin update mislukt: ${wpResponse.statusText}` },
        { status: wpResponse.status }
      );
    }

    const responseData = await wpResponse.json();
    const updatedPost = responseData.post || responseData;

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
