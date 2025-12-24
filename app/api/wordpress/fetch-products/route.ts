import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { classifyWordPressError, formatErrorForLogging, sanitizeUrl } from '@/lib/wordpress-errors';
import { WORDPRESS_ENDPOINTS, buildWordPressUrl, buildAuthHeader, getWordPressEndpoint, WORDPRESS_USER_AGENT } from '@/lib/wordpress-endpoints';
import { fetchWithDnsFallback } from '@/lib/fetch-with-dns-fallback';

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

    // Prepare WordPress credentials and normalize URL
    // Remove trailing slash AND any /wp-json paths that might have been incorrectly saved
    let wpUrl = project.wp_url.replace(/\/$/, ''); // Remove trailing slash
    wpUrl = wpUrl.replace(/\/wp-json.*$/, ''); // Remove any /wp-json paths to ensure clean base URL

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

    // First, test if WooCommerce API is available
    const wooApiTestUrl = getWordPressEndpoint(wpUrl, WORDPRESS_ENDPOINTS.woocommerce.base);
    console.log(`Testing WooCommerce API availability at: ${sanitizeUrl(wooApiTestUrl)}`);
    try {
      const apiTestResponse = await fetchWithDnsFallback(wooApiTestUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'User-Agent': WORDPRESS_USER_AGENT,
        },
        timeout: 60000, // Increased to 60s for slow .nl/.be domains
      });

      if (!apiTestResponse.ok) {
        // WooCommerce might not be installed
        if (apiTestResponse.status === 404) {
          const errorDetails = classifyWordPressError(
            new Error('WooCommerce is niet geïnstalleerd of de REST API is niet ingeschakeld'),
            apiTestResponse,
            wpUrl
          );
          console.error('WooCommerce not found:', formatErrorForLogging(errorDetails));

          return NextResponse.json(
            {
              error: 'WooCommerce is niet geïnstalleerd op deze WordPress site',
              errorDetails,
            },
            { status: 404 }
          );
        }

        const errorDetails = classifyWordPressError(
          new Error(`WooCommerce API test failed: ${apiTestResponse.statusText}`),
          apiTestResponse,
          wpUrl
        );
        console.error('WooCommerce API test failed:', formatErrorForLogging(errorDetails));

        return NextResponse.json(
          {
            error: errorDetails.message,
            errorDetails,
          },
          { status: apiTestResponse.status }
        );
      }

      console.log('✓ WooCommerce API is available');
    } catch (apiTestError: any) {
      const errorDetails = classifyWordPressError(apiTestError, undefined, wpUrl);
      console.error('WooCommerce API test error:', formatErrorForLogging(errorDetails));

      return NextResponse.json(
        {
          error: errorDetails.message,
          errorDetails,
        },
        { status: 503 }
      );
    }

    // Fetch products from WooCommerce with retry logic
    const wooApiUrl = buildWordPressUrl(wpUrl, WORDPRESS_ENDPOINTS.woocommerce.products, {
      page,
      per_page: perPage,
    });

    console.log(`Fetching WooCommerce products from: ${sanitizeUrl(wooApiUrl)}`);

    // Retry logic for transient errors
    let wooResponse: Response | null = null;
    let lastError: any = null;
    const maxRetries = 3;
    const timeoutMs = 60000; // Increased to 60s for slow .nl/.be domains

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries} to fetch WooCommerce products`);

        wooResponse = await fetchWithDnsFallback(wooApiUrl, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': WORDPRESS_USER_AGENT,
          },
          timeout: timeoutMs,
        });

        // If request succeeded, break out of retry loop
        if (wooResponse.ok) {
          console.log(`✓ Successfully fetched products on attempt ${attempt}`);
          break;
        }

        // If we got a response but it wasn't ok, and it's not a server error, don't retry
        if (wooResponse.status < 500) {
          console.log(`✗ Got ${wooResponse.status} error, not retrying`);
          break;
        }

        // Server error (5xx), retry
        lastError = new Error(`HTTP ${wooResponse.status}: ${wooResponse.statusText}`);
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

    if (!wooResponse) {
      throw lastError || new Error('Failed to fetch WooCommerce products after retries');
    }

    if (!wooResponse.ok) {
      const errorText = await wooResponse.text();
      console.error(`WooCommerce fetch error: ${wooResponse.status} ${wooResponse.statusText}`, errorText);

      const errorDetails = classifyWordPressError(
        new Error(errorText || wooResponse.statusText),
        wooResponse,
        wpUrl
      );
      console.error('WooCommerce API error:', formatErrorForLogging(errorDetails));

      return NextResponse.json(
        {
          error: errorDetails.message,
          errorDetails,
        },
        { status: wooResponse.status }
      );
    }

    const products = await wooResponse.json();

    // Get total pages from header
    const totalPages = parseInt(wooResponse.headers.get('X-WP-TotalPages') || '1');
    const totalProducts = parseInt(wooResponse.headers.get('X-WP-Total') || '0');

    console.log(`✓ Successfully fetched ${products.length} products (page ${page}/${totalPages}, total: ${totalProducts})`);

    // Transform WooCommerce products to our format
    const transformedProducts = products.map((product: any) => {
      // Get product images
      const images = product.images?.map((img: any) => ({
        id: img.id,
        src: img.src,
        alt: img.alt,
      })) || [];

      // Get product categories
      const categories = product.categories?.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
      })) || [];

      // Get product tags
      const tags = product.tags?.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      })) || [];

      return {
        woocommerce_id: product.id,
        name: product.name,
        slug: product.slug,
        type: product.type, // simple, grouped, external, variable
        status: product.status, // draft, pending, private, publish
        description: product.description,
        short_description: product.short_description,
        sku: product.sku,
        price: product.price,
        regular_price: product.regular_price,
        sale_price: product.sale_price,
        on_sale: product.on_sale,
        stock_status: product.stock_status,
        stock_quantity: product.stock_quantity,
        manage_stock: product.manage_stock,
        images,
        categories,
        tags,
        permalink: product.permalink,
        date_created: product.date_created,
        date_modified: product.date_modified,
        // SEO fields (if Yoast is installed)
        meta_title: product.yoast_head_json?.title || product.name,
        meta_description: product.yoast_head_json?.description || product.short_description,
      };
    });

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      pagination: {
        current_page: page,
        per_page: perPage,
        total_pages: totalPages,
        total_products: totalProducts,
      },
    });

  } catch (error: any) {
    console.error('Error fetching WooCommerce products:', error);
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
