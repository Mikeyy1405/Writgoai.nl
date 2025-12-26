import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { classifyWordPressError, formatErrorForLogging, sanitizeUrl } from '@/lib/wordpress-errors';
import { WORDPRESS_ENDPOINTS, buildWordPressUrl, buildWordPressHeaders, getWordPressEndpoint } from '@/lib/wordpress-endpoints';


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Force dynamic rendering since we use cookies for authentication

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
      .select('id, name, wp_url, wp_username, wp_password')
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
    console.log(`[WP-FETCH-${requestId}] 🔧 Checking WordPress credentials configuration...`);
    console.log(`[WP-FETCH-${requestId}] 📊 Config status:`, {
      hasWpUrl: !!project.wp_url,
      hasUsername: !!project.wp_username,
      hasPassword: !!project.wp_password,
    });

    if (!project.wp_url || !project.wp_username || !project.wp_password) {
      console.error(`[WP-FETCH-${requestId}] ❌ WordPress credentials configuration incomplete`);
      const errorDetails = classifyWordPressError(
        new Error('WordPress credentials zijn niet geconfigureerd. Voeg gebruikersnaam en wachtwoord toe in project instellingen.'),
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
    console.log(`[WP-FETCH-${requestId}] ✅ WordPress credentials configured`);

    // First, test if WordPress API is available
    const healthCheckUrl = getWordPressEndpoint(wpUrl, WORDPRESS_ENDPOINTS.wp.base);
    console.log(`[WP-FETCH-${requestId}] 🔌 Testing WordPress API at: ${sanitizeUrl(healthCheckUrl)}`);
    try {
      const healthResponse = await fetch(healthCheckUrl, {
        method: 'GET',
        headers: buildWordPressHeaders(project.wp_username, project.wp_password, wpUrl),
        signal: AbortSignal.timeout(120000),
      });

      if (!healthResponse.ok) {
        const errorDetails = classifyWordPressError(
          new Error(`WordPress REST API niet bereikbaar.`),
          healthResponse,
          wpUrl
        );
        console.error('WordPress API health check failed:', formatErrorForLogging(errorDetails));

        return NextResponse.json(
          {
            error: errorDetails.message,
            errorDetails,
          },
          { status: healthResponse.status }
        );
      }

      console.log(`[WP-FETCH-${requestId}] ✓ WordPress REST API is active`);
    } catch (healthError: any) {
      console.error(`[WP-FETCH-${requestId}] ❌ WordPress API health check failed`);
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

    // Fetch posts from WordPress API with retry logic
    // Include _embed to get featured images and _fields for metadata
    const wpApiUrl = buildWordPressUrl(wpUrl, WORDPRESS_ENDPOINTS.wp.posts, {
      page,
      per_page: perPage,
      _embed: '1', // Include embedded data (featured images)
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

        // Use WordPress credentials for authentication
        wpResponse = await fetch(wpApiUrl, {
          method: 'GET',
          headers: buildWordPressHeaders(project.wp_username, project.wp_password, wpUrl),
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

    // WordPress REST API returns array of posts directly
    const posts = Array.isArray(responseData) ? responseData : [];

    // Get total count from headers
    const totalPosts = parseInt(wpResponse.headers.get('X-WP-Total') || '0');
    const totalPages = parseInt(wpResponse.headers.get('X-WP-TotalPages') || '1');

    console.log(`[WP-FETCH-${requestId}] ✓ Successfully fetched ${posts.length} posts (page ${page}/${totalPages}, total: ${totalPosts})`);

    // Transform WordPress API posts to our format
    const transformedPosts = posts.map((post: any) => {
      // Extract featured image URL from _embedded data
      let featuredImageUrl = null;
      if (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
        featuredImageUrl = post._embedded['wp:featuredmedia'][0].source_url;
      }

      // Detect SEO plugin and extract metadata
      let seoPlugin = 'none';
      let metaTitle = '';
      let metaDescription = '';
      let focusKeyword = '';
      let seoScore = null;

      // Check for Yoast SEO
      if (post.yoast_head_json) {
        seoPlugin = 'yoast';
        metaTitle = post.yoast_head_json.title || '';
        metaDescription = post.yoast_head_json.description || '';
        focusKeyword = post.yoast_head_json.og_title || '';
        // Yoast score is typically in a separate field
        if (post.meta?.['_yoast_wpseo_linkdex']) {
          seoScore = parseInt(post.meta['_yoast_wpseo_linkdex']);
        }
      }
      // Check for RankMath
      else if (post.meta?.rank_math_title || post.meta?.rank_math_description) {
        seoPlugin = 'rankmath';
        metaTitle = post.meta.rank_math_title || '';
        metaDescription = post.meta.rank_math_description || '';
        focusKeyword = post.meta.rank_math_focus_keyword || '';
        if (post.meta.rank_math_seo_score) {
          seoScore = parseInt(post.meta.rank_math_seo_score);
        }
      }
      // Fallback to generic meta fields
      else if (post.meta) {
        metaTitle = post.meta.title || post.title?.rendered || '';
        metaDescription = post.meta.description || '';
        focusKeyword = post.meta.focus_keyword || '';
      }

      // If no SEO title set, use post title
      if (!metaTitle) {
        metaTitle = post.title?.rendered || '';
      }

      return {
        wordpress_id: post.id,
        title: post.title?.rendered || '',
        content: post.content?.rendered || '',
        excerpt: post.excerpt?.rendered || '',
        slug: post.slug || '',
        status: post.status,
        featured_image: featuredImageUrl,
        wordpress_url: post.link,
        published_at: post.date,
        modified_at: post.modified,
        categories: post.categories || [],
        tags: post.tags || [],
        // SEO fields
        meta_title: metaTitle,
        meta_description: metaDescription,
        focus_keyword: focusKeyword,
        seo_plugin: seoPlugin,
        seo_score: seoScore,
      };
    });

    console.log(`[WP-FETCH-${requestId}] ✅ Request completed successfully`);

    // Detect the most common SEO plugin from all posts
    const seoPluginCounts = transformedPosts.reduce((acc: any, post: any) => {
      acc[post.seo_plugin] = (acc[post.seo_plugin] || 0) + 1;
      return acc;
    }, {});
    const detectedSeoPlugin = Object.keys(seoPluginCounts).reduce((a, b) =>
      seoPluginCounts[a] > seoPluginCounts[b] ? a : b, 'none'
    );

    return NextResponse.json({
      success: true,
      posts: transformedPosts,
      pagination: {
        current_page: page,
        per_page: perPage,
        total_pages: totalPages,
        total_posts: totalPosts,
      },
      seo_plugin: detectedSeoPlugin,
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
