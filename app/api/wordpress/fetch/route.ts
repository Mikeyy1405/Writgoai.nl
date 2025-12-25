import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { classifyWordPressError, formatErrorForLogging, sanitizeUrl } from '@/lib/wordpress-errors';
import { WORDPRESS_ENDPOINTS, buildWordPressUrl, buildWritgoHeaders, getWordPressEndpoint } from '@/lib/wordpress-endpoints';

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

    // Get project with WritGo API key
    console.log(`[WP-FETCH-${requestId}] 📂 Fetching project from database...`);
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, wp_url, writgo_api_key')
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

    // Check if WritGo API key is configured
    console.log(`[WP-FETCH-${requestId}] 🔧 Checking WritGo plugin configuration...`);
    console.log(`[WP-FETCH-${requestId}] 📊 Config status:`, {
      hasWpUrl: !!project.wp_url,
      hasApiKey: !!project.writgo_api_key,
    });

    if (!project.wp_url || !project.writgo_api_key) {
      console.error(`[WP-FETCH-${requestId}] ❌ WritGo plugin configuration incomplete`);
      const errorDetails = classifyWordPressError(
        new Error('WritGo Connector plugin is niet geconfigureerd. Voeg de API key toe in project instellingen.'),
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

    // Prepare WordPress URL - normalize
    let wpUrl = project.wp_url.replace(/\/$/, ''); // Remove trailing slash
    wpUrl = wpUrl.replace(/\/wp-json.*$/, ''); // Remove any /wp-json paths to ensure clean base URL

    console.log(`[WP-FETCH-${requestId}] 🌐 WordPress URL:`, sanitizeUrl(wpUrl));
    console.log(`[WP-FETCH-${requestId}] ✅ WritGo API key configured`);

    // First, test if WritGo plugin is available
    const healthCheckUrl = getWordPressEndpoint(wpUrl, WORDPRESS_ENDPOINTS.writgo.health);
    console.log(`[WP-FETCH-${requestId}] 🔌 Testing WritGo plugin at: ${sanitizeUrl(healthCheckUrl)}`);
    try {
      const healthResponse = await fetch(healthCheckUrl, {
        method: 'GET',
        headers: buildWritgoHeaders(project.writgo_api_key, wpUrl),
        signal: AbortSignal.timeout(120000),
      });

      if (!healthResponse.ok) {
        const errorDetails = classifyWordPressError(
          new Error(`WritGo plugin niet gevonden. Installeer de WritGo Connector plugin.`),
          healthResponse,
          wpUrl
        );
        console.error('WritGo plugin health check failed:', formatErrorForLogging(errorDetails));

        return NextResponse.json(
          {
            error: errorDetails.message,
            errorDetails,
          },
          { status: healthResponse.status }
        );
      }

      console.log(`[WP-FETCH-${requestId}] ✓ WritGo Connector plugin is active`);
    } catch (healthError: any) {
      console.error(`[WP-FETCH-${requestId}] ❌ WritGo plugin health check failed`);
      const errorDetails = classifyWordPressError(healthError, undefined, wpUrl);
      console.error(`[WP-FETCH-${requestId}]`, formatErrorForLogging(errorDetails));

      return NextResponse.json(
        {
          error: errorDetails.message,
          errorDetails,
        },
        { status: 503 }
      );
    }

    // Fetch posts from WritGo plugin with retry logic
    const wpApiUrl = buildWordPressUrl(wpUrl, WORDPRESS_ENDPOINTS.writgo.posts, {
      page,
      per_page: perPage,
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

        // Use WritGo plugin headers with API key
        wpResponse = await fetch(wpApiUrl, {
          method: 'GET',
          headers: buildWritgoHeaders(project.writgo_api_key, wpUrl),
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

    const responseData = await wpResponse.json();

    // WritGo plugin returns: { posts: [...], total: X, pages: Y }
    const posts = responseData.posts || [];
    const totalPages = responseData.pages || 1;
    const totalPosts = responseData.total || 0;

    console.log(`[WP-FETCH-${requestId}] ✓ Successfully fetched ${posts.length} posts (page ${page}/${totalPages}, total: ${totalPosts})`);

    // Transform WritGo plugin posts to our format
    const transformedPosts = posts.map((post: any) => {
      return {
        wordpress_id: post.id,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || '',
        slug: post.slug || '',
        status: post.status,
        featured_image: post.featured_image || null,
        wordpress_url: post.url,
        published_at: post.date,
        modified_at: post.modified,
        categories: post.categories || [],
        tags: post.tags || [],
        // SEO fields from WritGo plugin (auto-detects Yoast/RankMath)
        meta_title: post.seo?.title || post.title,
        meta_description: post.seo?.description || '',
        focus_keyword: post.seo?.focus_keyword || '',
        seo_plugin: post.seo_plugin || 'none',
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
      seo_plugin: responseData.seo_plugin || 'none', // Which SEO plugin is active
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
