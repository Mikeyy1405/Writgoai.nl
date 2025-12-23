import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { classifyWordPressError, formatErrorForLogging, sanitizeUrl } from '@/lib/wordpress-errors';
import { WORDPRESS_ENDPOINTS, buildWordPressUrl, buildAuthHeader, getWordPressEndpoint, WORDPRESS_USER_AGENT } from '@/lib/wordpress-endpoints';

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

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
    const restApiTestUrl = getWordPressEndpoint(wpUrl, WORDPRESS_ENDPOINTS.base);
    console.log(`Testing REST API availability at: ${sanitizeUrl(restApiTestUrl)}`);
    try {
      const apiTestController = new AbortController();
      const apiTestTimeoutId = setTimeout(() => apiTestController.abort(), 15000); // 15 second timeout

      const apiTestResponse = await fetch(restApiTestUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'User-Agent': WORDPRESS_USER_AGENT,
        },
        signal: apiTestController.signal,
      });

      clearTimeout(apiTestTimeoutId);

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

    // Fetch pages from WordPress with retry logic
    const wpApiUrl = buildWordPressUrl(wpUrl, WORDPRESS_ENDPOINTS.wp.pages, {
      page,
      per_page: perPage,
      _embed: true,
    });

    console.log(`Fetching WordPress pages from: ${sanitizeUrl(wpApiUrl)}`);

    // Retry logic for transient errors
    let wpResponse: Response | null = null;
    let lastError: any = null;
    const maxRetries = 3;
    const timeoutMs = 15000; // 15 second timeout

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries} to fetch WordPress pages`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        wpResponse = await fetch(wpApiUrl, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': WORDPRESS_USER_AGENT,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // If request succeeded, break out of retry loop
        if (wpResponse.ok) {
          console.log(`✓ Successfully fetched pages on attempt ${attempt}`);
          break;
        }

        // If we got a response but it wasn't ok, and it's not a server error, don't retry
        if (wpResponse.status < 500) {
          console.log(`✗ Got ${wpResponse.status} error, not retrying`);
          break;
        }

        // Server error (5xx), retry
        lastError = new Error(`HTTP ${wpResponse.status}: ${wpResponse.statusText}`);
        console.log(`✗ Server error on attempt ${attempt}, will retry...`);

      } catch (error: any) {
        lastError = error;
        console.error(`✗ Attempt ${attempt} failed:`, error.message);

        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    if (!wpResponse) {
      throw lastError || new Error('Failed to fetch WordPress pages after retries');
    }

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

    const pages = await wpResponse.json();

    // Get total pages from header
    const totalPages = parseInt(wpResponse.headers.get('X-WP-TotalPages') || '1');
    const totalItems = parseInt(wpResponse.headers.get('X-WP-Total') || '0');

    console.log(`✓ Successfully fetched ${pages.length} pages (page ${page}/${totalPages}, total: ${totalItems})`);

    // Transform WordPress pages to our format
    const transformedPages = pages.map((pageItem: any) => {
      // Get featured image URL
      let featuredImage = null;
      if (pageItem._embedded && pageItem._embedded['wp:featuredmedia']) {
        const media = pageItem._embedded['wp:featuredmedia'][0];
        featuredImage = media.source_url || null;
      }

      return {
        wordpress_id: pageItem.id,
        title: pageItem.title.rendered,
        content: pageItem.content.rendered,
        excerpt: pageItem.excerpt.rendered,
        slug: pageItem.slug,
        status: pageItem.status,
        featured_image: featuredImage,
        wordpress_url: pageItem.link,
        parent_id: pageItem.parent,
        menu_order: pageItem.menu_order,
        template: pageItem.template,
        published_at: pageItem.date,
        modified_at: pageItem.modified,
        // SEO fields (if Yoast is installed)
        meta_title: pageItem.yoast_head_json?.title || pageItem.title.rendered,
        meta_description: pageItem.yoast_head_json?.description || '',
        focus_keyword: pageItem.yoast_head_json?.focus_keyword || '',
      };
    });

    return NextResponse.json({
      success: true,
      pages: transformedPages,
      pagination: {
        current_page: page,
        per_page: perPage,
        total_pages: totalPages,
        total_items: totalItems,
      },
    });

  } catch (error: any) {
    console.error('Error fetching WordPress pages:', error);
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
