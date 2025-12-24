import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { createWordPressClient } from '@/lib/wordpress-client';
import { enhanceArticleContent } from '@/lib/content-enhancer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    // Check authenticatie
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id, article_id, title, content, featured_image } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Haal project op
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check WordPress configuratie
    if (!project.wp_url || !project.wp_username || !project.wp_password) {
      return NextResponse.json(
        { error: 'WordPress is niet geconfigureerd voor dit project. Voeg WordPress credentials toe in projectinstellingen.' },
        { status: 400 }
      );
    }

    let articleTitle = title;
    let articleContent = content;
    let articleFeaturedImage = featured_image;

    // Haal article op als article_id is gegeven
    if (article_id) {
      const { data: article, error: articleError } = await supabase
        .from('articles')
        .select('*')
        .eq('id', article_id)
        .eq('project_id', project_id)
        .single();

      if (articleError || !article) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 });
      }

      articleTitle = article.title;
      articleContent = article.content;
      articleFeaturedImage = article.featured_image || articleFeaturedImage;
    }

    // Valideer content
    if (!articleTitle || !articleContent) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Haal bol.com affiliate config op voor product CTAs
    const { data: bolAffiliate } = await supabase
      .from('project_affiliates')
      .select('client_id, client_secret, site_code')
      .eq('project_id', project_id)
      .eq('platform', 'bol.com')
      .single();

    const bolConfig = bolAffiliate ? {
      clientId: bolAffiliate.client_id,
      clientSecret: bolAffiliate.client_secret,
      siteCode: bolAffiliate.site_code,
    } : undefined;

    // Enhance content met images, video, en product CTAs
    console.log('Enhancing content...');
    try {
      const enhancementResult = await enhanceArticleContent({
        content: articleContent,
        title: articleTitle,
        focusKeyword: articleTitle.split(' ').slice(0, 3).join(' '),
        addImages: true,
        addYouTubeVideo: true,
        addProductCTAs: !!bolConfig,
        imageInterval: 500,
        bolConfig,
      });

      articleContent = enhancementResult.content;
      console.log(`✓ Content enhanced: ${enhancementResult.imagesAdded} images, video: ${enhancementResult.videoAdded}, CTAs: ${enhancementResult.productCTAsAdded}`);
    } catch (enhanceError) {
      console.warn('Content enhancement failed (non-blocking):', enhanceError);
    }

    // Maak WordPress client
    const wpClient = createWordPressClient({
      url: project.wp_url,
      username: project.wp_username,
      password: project.wp_password,
    });

    console.log('Publishing to WordPress:', articleTitle);

    // Publish naar WordPress
    try {
      const wpPost = await wpClient.createPost({
        title: articleTitle,
        content: articleContent,
        status: 'publish',
      });

      console.log('WordPress post created:', wpPost.id, wpPost.link);

      // Upload featured image (achtergrond, non-blocking)
      if (articleFeaturedImage && wpPost.id) {
        wpClient.uploadMedia(articleFeaturedImage, `featured-${wpPost.id}.jpg`)
          .then(media => {
            return wpClient.updatePost(wpPost.id, {
              featured_media: media.id,
            });
          })
          .then(() => console.log('Featured image uploaded'))
          .catch(err => console.warn('Featured image upload failed:', err.message));
      }

      // Update article status
      if (article_id) {
        await supabase
          .from('articles')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            wordpress_id: wpPost.id,
            wordpress_url: wpPost.link,
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
      console.error('WordPress publish error:', wpError);
      return NextResponse.json(
        { error: wpError.message || 'Kon niet publiceren naar WordPress' },
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

// Test WordPress connectie
export async function GET(request: Request) {
  try {
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get('project_id');

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const { data: project } = await supabase
      .from('projects')
      .select('wp_url, wp_username, wp_password')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (!project || !project.wp_url || !project.wp_username || !project.wp_password) {
      return NextResponse.json({
        connected: false,
        error: 'WordPress niet geconfigureerd'
      });
    }

    const wpClient = createWordPressClient({
      url: project.wp_url,
      username: project.wp_username,
      password: project.wp_password,
    });

    try {
      // Test door 1 post op te halen
      await wpClient.getPosts({ per_page: 1 });

      return NextResponse.json({
        connected: true,
        message: 'WordPress verbinding succesvol'
      });
    } catch (testError: any) {
      return NextResponse.json({
        connected: false,
        error: testError.message
      });
    }

  } catch (error: any) {
    return NextResponse.json({
      connected: false,
      error: error.message
    }, { status: 500 });
  }
}
