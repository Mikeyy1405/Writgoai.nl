import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

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
          wp_password,
          wp_app_password
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
    const username = article.projects.wp_username || '';
    const password = (article.projects.wp_app_password || article.projects.wp_password || '').replace(/\s+/g, '');

    if (!password) {
      return NextResponse.json(
        { error: 'WordPress wachtwoord ontbreekt' },
        { status: 400 }
      );
    }

    const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

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

    // Handle featured image update
    let featuredMediaId = null;
    if (update_fields.featured_image !== undefined && update_fields.featured_image) {
      try {
        featuredMediaId = await uploadFeaturedImage(
          update_fields.featured_image,
          wpUrl,
          authHeader,
          update_fields.title || article.title
        );
        if (featuredMediaId) {
          updateData.featured_media = featuredMediaId;
        }
      } catch (imageError) {
        console.error('Error uploading featured image:', imageError);
        // Continue with update even if image upload fails
      }
    }

    // Handle Yoast SEO fields if available
    if (update_fields.meta_title !== undefined ||
        update_fields.meta_description !== undefined ||
        update_fields.focus_keyword !== undefined) {
      // Note: Yoast SEO fields require Yoast REST API extension
      // These will be set as meta fields
      updateData.meta = {
        _yoast_wpseo_title: update_fields.meta_title,
        _yoast_wpseo_metadesc: update_fields.meta_description,
        _yoast_wpseo_focuskw: update_fields.focus_keyword,
      };
    }

    // Update post in WordPress
    const wpApiUrl = `${wpUrl}/wp-json/wp/v2/posts/${article.wordpress_id}`;

    console.log(`Updating WordPress post ${article.wordpress_id}:`, updateData);

    const wpResponse = await fetch(wpApiUrl, {
      method: 'POST', // WordPress uses POST for updates
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
      signal: AbortSignal.timeout(60000), // 60 second timeout
    });

    if (!wpResponse.ok) {
      const errorText = await wpResponse.text();
      console.error('WordPress update error:', wpResponse.status, errorText);

      if (wpResponse.status === 401) {
        return NextResponse.json(
          { error: 'WordPress authenticatie mislukt. Controleer je wachtwoord.' },
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
      featured_media_id: featuredMediaId,
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

async function uploadFeaturedImage(
  imageUrl: string,
  wpUrl: string,
  authHeader: string,
  title: string
): Promise<number | null> {
  try {
    console.log(`Downloading featured image: ${imageUrl}`);

    // Download image
    const imageResponse = await fetch(imageUrl, {
      signal: AbortSignal.timeout(30000),
    });

    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Extract filename from URL or generate one
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1] || `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.jpg`;

    console.log(`Uploading featured image to WordPress: ${filename}`);

    // Upload to WordPress media library
    const mediaApiUrl = `${wpUrl}/wp-json/wp/v2/media`;

    const uploadResponse = await fetch(mediaApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
      body: imageBuffer,
      signal: AbortSignal.timeout(60000),
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('WordPress media upload error:', uploadResponse.status, errorText);
      throw new Error(`Media upload failed: ${uploadResponse.statusText}`);
    }

    const media = await uploadResponse.json();
    console.log(`Featured image uploaded successfully. Media ID: ${media.id}`);

    return media.id;

  } catch (error) {
    console.error('Error uploading featured image:', error);
    // Return null instead of throwing to allow the update to continue
    return null;
  }
}
