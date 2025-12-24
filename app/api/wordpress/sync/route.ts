import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { buildAuthHeader, getPostsEndpoint } from '@/lib/wordpress-endpoints';
import { fetchWithDnsFallback } from '@/lib/fetch-with-dns-fallback';

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

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
    const { project_id, wordpress_id, sync_all } = body;

    if (!project_id) {
      return NextResponse.json(
        { error: 'project_id is verplicht' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    if (sync_all) {
      // Sync all WordPress posts
      return await syncAllPosts(supabase, project_id, user.id);
    } else if (wordpress_id) {
      // Sync single post
      return await syncSinglePost(supabase, project_id, wordpress_id, user.id);
    } else {
      return NextResponse.json(
        { error: 'wordpress_id of sync_all is verplicht' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Error syncing WordPress posts:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden bij het synchroniseren' },
      { status: 500 }
    );
  }
}

async function syncSinglePost(
  supabase: any,
  projectId: string,
  wordpressId: number,
  userId: string
) {
  try {
    // Fetch the WordPress post using the fetch endpoint logic
    const { data: project } = await supabase
      .from('projects')
      .select('wp_url, wp_username, wp_password, wp_app_password')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    // Normalize URL to remove any /wp-json paths
    let wpUrl = project.wp_url.replace(/\/$/, '');
    wpUrl = wpUrl.replace(/\/wp-json.*$/, '');

    const username = project.wp_username || '';
    const password = (project.wp_app_password || project.wp_password || '').replace(/\s+/g, '');
    const authHeader = buildAuthHeader(username, password);

    // Fetch single post with _embed for featured image
    const wpApiUrl = `${getPostsEndpoint(wpUrl, wordpressId)}?_embed`;

    const wpResponse = await fetchWithDnsFallback(wpApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      timeout: 120000, // Increased to 120s for slow .nl/.be domains with poor routing from Render.com
    });

    if (!wpResponse.ok) {
      return NextResponse.json(
        { error: `WordPress fout: ${wpResponse.statusText}` },
        { status: wpResponse.status }
      );
    }

    const post = await wpResponse.json();

    // Get featured image URL
    let featuredImage = null;
    if (post._embedded && post._embedded['wp:featuredmedia']) {
      const media = post._embedded['wp:featuredmedia'][0];
      featuredImage = media.source_url || null;
    }

    // Calculate word count (rough estimate)
    const textContent = post.content.rendered.replace(/<[^>]*>/g, ' ');
    const wordCount = textContent.trim().split(/\s+/).length;

    // Check if article already exists in database
    const { data: existingArticle } = await supabase
      .from('articles')
      .select('id')
      .eq('project_id', projectId)
      .eq('wordpress_id', wordpressId)
      .single();

    let articleData = {
      project_id: projectId,
      title: post.title.rendered,
      slug: post.slug,
      content: post.content.rendered,
      excerpt: post.excerpt.rendered,
      featured_image: featuredImage,
      status: post.status === 'publish' ? 'published' : post.status,
      published_at: post.status === 'publish' ? post.date : null,
      wordpress_id: post.id,
      wordpress_url: post.link,
      meta_title: post.yoast_head_json?.title || post.title.rendered,
      meta_description: post.yoast_head_json?.description || '',
      focus_keyword: post.yoast_head_json?.focus_keyword || '',
      word_count: wordCount,
      author_id: userId,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existingArticle) {
      // Update existing article
      const { data, error } = await supabase
        .from('articles')
        .update(articleData)
        .eq('id', existingArticle.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new article
      const { data, error } = await supabase
        .from('articles')
        .insert({
          ...articleData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      article: result,
      message: existingArticle ? 'Post bijgewerkt' : 'Post geïmporteerd',
    });

  } catch (error: any) {
    console.error('Error syncing single post:', error);
    throw error;
  }
}

async function syncAllPosts(
  supabase: any,
  projectId: string,
  userId: string
) {
  try {
    let page = 1;
    let hasMore = true;
    let syncedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    while (hasMore) {
      try {
        // Fetch posts using the fetch endpoint logic
        const { data: project } = await supabase
          .from('projects')
          .select('wp_url, wp_username, wp_password, wp_app_password')
          .eq('id', projectId)
          .single();

        // Normalize URL to remove any /wp-json paths
        let wpUrl = project.wp_url.replace(/\/$/, '');
        wpUrl = wpUrl.replace(/\/wp-json.*$/, '');

        const username = project.wp_username || '';
        const password = (project.wp_app_password || project.wp_password || '').replace(/\s+/g, '');
        const authHeader = buildAuthHeader(username, password);

        const wpApiUrl = `${getPostsEndpoint(wpUrl)}?page=${page}&per_page=50&_embed`;

        const wpResponse = await fetchWithDnsFallback(wpApiUrl, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          timeout: 120000, // Increased to 120s for slow .nl/.be domains with poor routing from Render.com
        });

        if (!wpResponse.ok) {
          throw new Error(`WordPress API error: ${wpResponse.statusText}`);
        }

        const posts = await wpResponse.json();
        const totalPages = parseInt(wpResponse.headers.get('X-WP-TotalPages') || '1');

        // Sync each post
        for (const post of posts) {
          try {
            let featuredImage = null;
            if (post._embedded && post._embedded['wp:featuredmedia']) {
              const media = post._embedded['wp:featuredmedia'][0];
              featuredImage = media.source_url || null;
            }

            const textContent = post.content.rendered.replace(/<[^>]*>/g, ' ');
            const wordCount = textContent.trim().split(/\s+/).length;

            const { data: existingArticle } = await supabase
              .from('articles')
              .select('id')
              .eq('project_id', projectId)
              .eq('wordpress_id', post.id)
              .single();

            const articleData = {
              project_id: projectId,
              title: post.title.rendered,
              slug: post.slug,
              content: post.content.rendered,
              excerpt: post.excerpt.rendered,
              featured_image: featuredImage,
              status: post.status === 'publish' ? 'published' : post.status,
              published_at: post.status === 'publish' ? post.date : null,
              wordpress_id: post.id,
              wordpress_url: post.link,
              meta_title: post.yoast_head_json?.title || post.title.rendered,
              meta_description: post.yoast_head_json?.description || '',
              focus_keyword: post.yoast_head_json?.focus_keyword || '',
              word_count: wordCount,
              author_id: userId,
              updated_at: new Date().toISOString(),
            };

            if (existingArticle) {
              await supabase
                .from('articles')
                .update(articleData)
                .eq('id', existingArticle.id);
            } else {
              await supabase
                .from('articles')
                .insert({
                  ...articleData,
                  created_at: new Date().toISOString(),
                });
            }

            syncedCount++;
          } catch (postError: any) {
            console.error(`Error syncing post ${post.id}:`, postError);
            errorCount++;
            errors.push(`Post ${post.id}: ${postError.message}`);
          }
        }

        // Check if there are more pages
        if (page >= totalPages) {
          hasMore = false;
        } else {
          page++;
        }

      } catch (pageError: any) {
        console.error(`Error fetching page ${page}:`, pageError);
        errorCount++;
        errors.push(`Page ${page}: ${pageError.message}`);
        hasMore = false;
      }
    }

    return NextResponse.json({
      success: true,
      synced_count: syncedCount,
      error_count: errorCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `${syncedCount} posts gesynchroniseerd${errorCount > 0 ? ` (${errorCount} fouten)` : ''}`,
    });

  } catch (error: any) {
    console.error('Error syncing all posts:', error);
    throw error;
  }
}
