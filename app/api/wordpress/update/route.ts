import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createWordPressClient } from '@/lib/wordpress-client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authenticatie
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await request.json();
    const { article_id, update_fields } = body;

    if (!article_id) {
      return NextResponse.json({ error: 'article_id is verplicht' }, { status: 400 });
    }

    // Haal article op met project info
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select(`
        *,
        projects (
          id,
          user_id,
          wp_url,
          wp_username,
          wp_password,
          wp_app_password
        )
      `)
      .eq('id', article_id)
      .single();

    if (articleError || !article) {
      return NextResponse.json({ error: 'Artikel niet gevonden' }, { status: 404 });
    }

    // Verify ownership
    if (article.projects.user_id !== user.id) {
      return NextResponse.json({ error: 'Geen toegang tot dit artikel' }, { status: 403 });
    }

    if (!article.wordpress_id) {
      return NextResponse.json(
        { error: 'Dit artikel is nog niet gepubliceerd naar WordPress' },
        { status: 400 }
      );
    }

    // Check WordPress configuratie
    const password = article.projects.wp_app_password || article.projects.wp_password;
    if (!password) {
      return NextResponse.json({ error: 'WordPress wachtwoord ontbreekt' }, { status: 400 });
    }

    // Maak WordPress client
    const wpClient = createWordPressClient({
      url: article.projects.wp_url,
      username: article.projects.wp_username,
      password: password,
    });

    // Prepare update data
    const updateData: any = {};

    if (update_fields.title !== undefined) updateData.title = update_fields.title;
    if (update_fields.content !== undefined) updateData.content = update_fields.content;
    if (update_fields.status !== undefined) {
      // Convert our status to WordPress status
      updateData.status = update_fields.status === 'published' ? 'publish' : update_fields.status;
    }

    // Handle featured image
    let featuredMediaId = null;
    if (update_fields.featured_image) {
      try {
        const filename = `${update_fields.title || article.title}.jpg`.replace(/[^a-z0-9.]/gi, '-').toLowerCase();
        const media = await wpClient.uploadMedia(update_fields.featured_image, filename);
        featuredMediaId = media.id;
        updateData.featured_media = media.id;
      } catch (imageError) {
        console.error('Error uploading featured image:', imageError);
        // Continue with update even if image upload fails
      }
    }

    console.log(`Updating WordPress post ${article.wordpress_id}`);

    // Update post in WordPress
    const updatedPost = await wpClient.updatePost(article.wordpress_id, updateData);

    // Update local database
    const dbUpdateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (update_fields.title !== undefined) dbUpdateData.title = update_fields.title;
    if (update_fields.content !== undefined) dbUpdateData.content = update_fields.content;
    if (update_fields.status !== undefined) dbUpdateData.status = update_fields.status;
    if (update_fields.featured_image !== undefined) dbUpdateData.featured_image = update_fields.featured_image;
    if (updatedPost.link) dbUpdateData.wordpress_url = updatedPost.link;

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
      featured_media_id: featuredMediaId,
    });

  } catch (error: any) {
    console.error('Error updating WordPress post:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden bij het bijwerken' },
      { status: 500 }
    );
  }
}
