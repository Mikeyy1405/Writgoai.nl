import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { classifyWordPressError, formatErrorForLogging, sanitizeUrl } from '@/lib/wordpress-errors';
import { WORDPRESS_ENDPOINTS, buildWordPressUrl, buildAuthHeader, getWordPressEndpoint, WORDPRESS_USER_AGENT } from '@/lib/wordpress-endpoints';
import { getWordPressApiHeaders } from '@/lib/wordpress-request-diagnostics';

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[WP-FETCH-${requestId}] 🔍 Starting WordPress posts fetch request`);

  try {
    const supabase = createClient();

    // Get authenticated user
    console.log(`[WP-FETCH-${requestId}] 🔐 Checking authentication...`);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(`[WP-FETCH-${requestId}] ❌ Authentication failed:`, authError?.message || 'No user');
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    console.log(`[WP-FETCH-${requestId}] ✅ User authenticated: ${user.id}`);

    // Get project_id from query params
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');

    console.log(`[WP-FETCH-${requestId}] 📋 Request params:`, { projectId, page, perPage });

    if (!projectId) {
      console.error(`[WP-FETCH-${requestId}] ❌ No project_id provided`);
      return NextResponse.json(
        { error: 'project_id is verplicht' },
        { status: 400 }
      );
    }

    // Get project with WordPress credentials
    console.log(`[WP-FETCH-${requestId}] 📂 Fetching project from database...`);
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, wp_url, wp_username, wp_password, wp_app_password')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      console.error(`[WP-FETCH-${requestId}] ❌ Project not found:`, projectError?.message || 'No project');
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    console.log(`[WP-FETCH-${requestId}] ✅ Project found: ${project.name}`);

    // Check if WordPress credentials are configured
    console.log(`[WP-FETCH-${requestId}] 🔧 Checking WordPress configuration...`);
    console.log(`[WP-FETCH-${requestId}] 📊 Config status:`, {
      hasWpUrl: !!project.wp_url,
      hasUsername: !!project.wp_username,
      hasAppPassword: !!project.wp_app_password,
      hasPassword: !!project.wp_password
    });

    if (!project.wp_url || (!project.wp_username && !project.wp_app_password)) {
      console.error(`[WP-FETCH-${requestId}] ❌ WordPress configuration incomplete`);
      const errorDetails = classifyWordPressError(
        new Error('WordPress configuratie is niet compleet. Configureer WordPress in project instellingen.'),
        undefined,
        project.wp_url
      );
      console.error(`[WP-FETCH-${requestId}]`, formatErrorForLogging(errorDetails));
      
      return NextResponse.json(
        { 
          error: errorDetails.message,
          errorDetails,
        },
        { status: 400 }
      );
    }

    // Prepare WordPress credentials and normalize URL
    // Remove trailing slash AND any /wp-json paths that might have been incorrectly saved
    let wpUrl = project.wp_url.replace(/\/$/, ''); // Remove trailing slash
    wpUrl = wpUrl.replace(/\/wp-json.*$/, ''); // Remove any /wp-json paths to ensure clean base URL

    console.log(`[WP-FETCH-${requestId}] 🌐 WordPress URL:`, sanitizeUrl(wpUrl));

    const username = project.wp_username || '';
    const password = (project.wp_app_password || project.wp_password || '').replace(/\s+/g, '');

    if (!password) {
      console.error(`[WP-FETCH-${requestId}] ❌ WordPress password missing`);
      const errorDetails = classifyWordPressError(
        new Error('WordPress wachtwoord ontbreekt'),
        undefined,
        wpUrl
      );
      console.error(`[WP-FETCH-${requestId}]`, formatErrorForLogging(errorDetails));
      
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

    console.log(`[WP-FETCH-${requestId}] ✅ WordPress credentials configured`);

    // First, test if REST API is available
    const restApiTestUrl = getWordPressEndpoint(wpUrl, WORDPRESS_ENDPOINTS.base);
    console.log(`[WP-FETCH-${requestId}] 🔌 Testing REST API availability at: ${sanitizeUrl(restApiTestUrl)}`);
    try {
      // Use advanced browser-like headers to avoid WAF/firewall blocking
      const apiTestResponse = await fetch(restApiTestUrl, {
        method: 'GET',
        headers: getWordPressApiHeaders(authHeader, wpUrl),
        signal: AbortSignal.timeout(120000),
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

      console.log(`[WP-FETCH-${requestId}] ✓ REST API is available and wp/v2 is enabled`);
    } catch (apiTestError: any) {
      console.error(`[WP-FETCH-${requestId}] ❌ REST API test failed`);
      const errorDetails = classifyWordPressError(apiTestError, undefined, wpUrl);
      console.error(`[WP-FETCH-${requestId}]`, formatErrorForLogging(errorDetails));
      
      return NextResponse.json(
        { 
          error: errorDetails.message,
          errorDetails,
        },
        { status: 503 }
      );
    }

    // Fetch posts from WordPress with retry logic
    const wpApiUrl = buildWordPressUrl(wpUrl, WORDPRESS_ENDPOINTS.wp.posts, {
      page,
      per_page: perPage,
      _embed: true,
    });

    console.log(`[WP-FETCH-${requestId}] 📥 Fetching WordPress posts from: ${sanitizeUrl(wpApiUrl)}`);

    // Retry logic for transient errors
    let wpResponse: Response | null = null;
    let lastError: any = null;
    const maxRetries = 3;
    const timeoutMs = 120000; // Increased to 120s for slow .nl/.be domains with poor routing from Render.com

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[WP-FETCH-${requestId}] 🔄 Attempt ${attempt}/${maxRetries} to fetch WordPress posts`);

        // Use advanced browser-like headers to avoid WAF/firewall blocking
        wpResponse = await fetch(wpApiUrl, {
          method: 'GET',
          headers: getWordPressApiHeaders(authHeader, wpUrl),
          signal: AbortSignal.timeout(timeoutMs),
        });

        // If request succeeded, break out of retry loop
        if (wpResponse.ok) {
          console.log(`[WP-FETCH-${requestId}] ✓ Successfully fetched posts on attempt ${attempt}`);
          break;
        }

        // If we got a response but it wasn't ok, and it's not a server error, don't retry
        if (wpResponse.status < 500) {
          console.log(`[WP-FETCH-${requestId}] ✗ Got ${wpResponse.status} error, not retrying`);
          break;
        }

        // Server error (5xx), retry
        lastError = new Error(`HTTP ${wpResponse.status}: ${wpResponse.statusText}`);
        console.log(`[WP-FETCH-${requestId}] ✗ Server error on attempt ${attempt}, will retry...`);

      } catch (error: any) {
        lastError = error;
        console.error(`[WP-FETCH-${requestId}] ✗ Attempt ${attempt} failed:`, error.message);

        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
        console.log(`[WP-FETCH-${requestId}] ⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    if (!wpResponse) {
      console.error(`[WP-FETCH-${requestId}] ❌ All retry attempts failed`);
      throw lastError || new Error('Failed to fetch WordPress posts after retries');
    }

    if (!wpResponse.ok) {
      const errorText = await wpResponse.text();
      console.error(`[WP-FETCH-${requestId}] ❌ WordPress fetch error: ${wpResponse.status} ${wpResponse.statusText}`, errorText);

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

    console.log(`[WP-FETCH-${requestId}] ✓ Successfully fetched ${posts.length} posts (page ${page}/${totalPages}, total: ${totalPosts})`);

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

    console.log(`[WP-FETCH-${requestId}] ✅ Request completed successfully`);

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
    console.error(`[WP-FETCH-${requestId}] ❌ Fatal error fetching WordPress posts:`, error);
    console.error(`[WP-FETCH-${requestId}] Error code:`, error.code || 'N/A');
    console.error(`[WP-FETCH-${requestId}] Error cause:`, error.cause?.message || 'N/A');

    const errorDetails = classifyWordPressError(error, undefined, undefined);
    console.error(`[WP-FETCH-${requestId}] Detailed error info:`, formatErrorForLogging(errorDetails));

    return NextResponse.json(
      { 
        error: errorDetails.message,
        errorDetails,
      },
      { status: 500 }
    );
  }
}
