import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { classifyWordPressError, formatErrorForLogging, sanitizeUrl } from '@/lib/wordpress-errors';
import { WORDPRESS_ENDPOINTS, buildWordPressUrl, buildAuthHeader } from '@/lib/wordpress-endpoints';

export async function GET(request: NextRequest) {
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

    // Get project_id from query params
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');

    if (!projectId) {
      return NextResponse.json(
        { error: 'project_id is verplicht' },
        { status: 400 }
      );
    }

    // Get project with WordPress credentials
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, wp_url, wp_username, wp_password, wp_app_password')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    // Check if WordPress credentials are configured
    if (!project.wp_url || (!project.wp_username && !project.wp_app_password)) {
      const errorDetails = classifyWordPressError(
        new Error('WordPress configuratie is niet compleet. Configureer WordPress in project instellingen.'),
        undefined,
        project.wp_url
      );
      console.error('Configuration error:', formatErrorForLogging(errorDetails));
      
      return NextResponse.json(
        { 
          error: errorDetails.message,
          errorDetails,
        },
        { status: 400 }
      );
    }

    // Prepare WordPress credentials
    const wpUrl = project.wp_url.replace(/\/$/, ''); // Remove trailing slash
    const username = project.wp_username || '';
    const password = (project.wp_app_password || project.wp_password || '').replace(/\s+/g, '');

    if (!password) {
      const errorDetails = classifyWordPressError(
        new Error('WordPress wachtwoord ontbreekt'),
        undefined,
        wpUrl
      );
      console.error('Configuration error:', formatErrorForLogging(errorDetails));
      
      return NextResponse.json(
        { 
          error: errorDetails.message,
          errorDetails,
        },
        { status: 400 }
      );
    }

    // Create Basic Auth header
    const authHeader = buildAuthHeader(username, password);

    // First, test if REST API is available
    const restApiTestUrl = `${wpUrl}${WORDPRESS_ENDPOINTS.base}/`;
    console.log(`Testing REST API availability at: ${sanitizeUrl(restApiTestUrl)}`);
    try {
      const apiTestResponse = await fetch(restApiTestUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!apiTestResponse.ok) {
        const errorDetails = classifyWordPressError(
          new Error(`REST API test failed: ${apiTestResponse.statusText}`),
          apiTestResponse,
          wpUrl
        );
        console.error('REST API test failed:', formatErrorForLogging(errorDetails));
        
        return NextResponse.json(
          { 
            error: errorDetails.message,
            errorDetails,
          },
          { status: apiTestResponse.status }
        );
      }

      const apiData = await apiTestResponse.json();
      if (!apiData.namespaces || !apiData.namespaces.includes('wp/v2')) {
        const errorDetails = classifyWordPressError(
          new Error('WordPress REST API wp/v2 niet beschikbaar'),
          undefined,
          wpUrl
        );
        console.error('REST API wp/v2 not available:', formatErrorForLogging(errorDetails));
        
        return NextResponse.json(
          { 
            error: errorDetails.message,
            errorDetails,
          },
          { status: 404 }
        );
      }
      
      console.log('✓ REST API is available and wp/v2 is enabled');
    } catch (apiTestError: any) {
      const errorDetails = classifyWordPressError(apiTestError, undefined, wpUrl);
      console.error('REST API test error:', formatErrorForLogging(errorDetails));
      
      return NextResponse.json(
        { 
          error: errorDetails.message,
          errorDetails,
        },
        { status: 503 }
      );
    }

    // Fetch posts from WordPress
    const wpApiUrl = buildWordPressUrl(wpUrl, WORDPRESS_ENDPOINTS.wp.posts, {
      page,
      per_page: perPage,
      _embed: true,
    });

    console.log(`Fetching WordPress posts from: ${sanitizeUrl(wpApiUrl)}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout (increased from 15s)

    const wpResponse = await fetch(wpApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      // Node.js undici-specific options to override default connection timeout
      // TypeScript doesn't have types for these, but they're required for proper timeout handling
      // @ts-ignore
      headersTimeout: 45000,
      bodyTimeout: 45000,
    });

    clearTimeout(timeoutId);

    if (!wpResponse.ok) {
      const errorText = await wpResponse.text();
      console.error(`WordPress fetch error: ${wpResponse.status} ${wpResponse.statusText}`, errorText);

      const errorDetails = classifyWordPressError(
        new Error(errorText || wpResponse.statusText),
        wpResponse,
        wpUrl
      );
      console.error('WordPress API error:', formatErrorForLogging(errorDetails));

      return NextResponse.json(
        { 
          error: errorDetails.message,
          errorDetails,
        },
        { status: wpResponse.status }
      );
    }

    const posts = await wpResponse.json();

    // Get total pages from header
    const totalPages = parseInt(wpResponse.headers.get('X-WP-TotalPages') || '1');
    const totalPosts = parseInt(wpResponse.headers.get('X-WP-Total') || '0');

    console.log(`✓ Successfully fetched ${posts.length} posts (page ${page}/${totalPages}, total: ${totalPosts})`);

    // Transform WordPress posts to our format
    const transformedPosts = posts.map((post: any) => {
      // Get featured image URL
      let featuredImage = null;
      if (post._embedded && post._embedded['wp:featuredmedia']) {
        const media = post._embedded['wp:featuredmedia'][0];
        featuredImage = media.source_url || null;
      }

      // Get categories
      const categories = post._embedded?.['wp:term']?.[0] || [];

      // Get tags
      const tags = post._embedded?.['wp:term']?.[1] || [];

      return {
        wordpress_id: post.id,
        title: post.title.rendered,
        content: post.content.rendered,
        excerpt: post.excerpt.rendered,
        slug: post.slug,
        status: post.status,
        featured_image: featuredImage,
        wordpress_url: post.link,
        published_at: post.date,
        modified_at: post.modified,
        categories: categories.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
        })),
        tags: tags.map((tag: any) => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
        })),
        // SEO fields (if Yoast is installed)
        meta_title: post.yoast_head_json?.title || post.title.rendered,
        meta_description: post.yoast_head_json?.description || '',
        focus_keyword: post.yoast_head_json?.focus_keyword || '',
      };
    });

    return NextResponse.json({
      success: true,
      posts: transformedPosts,
      pagination: {
        current_page: page,
        per_page: perPage,
        total_pages: totalPages,
        total_posts: totalPosts,
      },
    });

  } catch (error: any) {
    console.error('Error fetching WordPress posts:', error);
    console.error('Error code:', error.code || 'N/A');
    console.error('Error cause:', error.cause?.message || 'N/A');

    const errorDetails = classifyWordPressError(error, undefined, undefined);
    console.error('Detailed error info:', formatErrorForLogging(errorDetails));

    return NextResponse.json(
      { 
        error: errorDetails.message,
        errorDetails,
      },
      { status: 500 }
    );
  }
}
