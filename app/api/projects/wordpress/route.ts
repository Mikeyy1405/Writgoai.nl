import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { buildWordPressUrl, WORDPRESS_ENDPOINTS } from '@/lib/wordpress-endpoints';
import { classifyWordPressError, sanitizeUrl } from '@/lib/wordpress-errors';
import { getWordPressApiHeaders } from '@/lib/wordpress-request-diagnostics';
import { getProxyFetchOptions, isProxyConfigured, getProxyInfo } from '@/lib/wordpress-proxy';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Improved timeouts for WordPress connection tests (especially for sites with aggressive firewalls like Imunify360)
const TEST_TIMEOUT = 120000; // 120 seconds for full test (to match other routes)
const MAX_RETRIES = 3; // Number of retries for connection attempts
const RETRY_BASE_DELAY = 2000; // Base delay for exponential backoff (2 seconds)

// Helper function to clean WordPress Application Password
function cleanApplicationPassword(password: string): string {
  return password.replace(/\s+/g, '');
}

// Helper function to normalize WordPress base URL
function normalizeWordPressBaseUrl(websiteUrl: string): string {
  let url = websiteUrl.trim();
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  url = url.replace(/\/wp-json.*$/, '');
  return url;
}

// Helper function to fetch with retry logic and exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = MAX_RETRIES,
  baseDelay: number = RETRY_BASE_DELAY
): Promise<Response> {
  let lastError: any;

  // Log proxy configuration on first attempt
  if (isProxyConfigured()) {
    console.log(`[WP-TEST] Proxy configured: ${getProxyInfo()}`);
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const startTime = Date.now();
      console.log(`[WP-TEST] [Attempt ${attempt + 1}/${maxRetries + 1}] Fetching ${sanitizeUrl(url)}...`);

      // Apply proxy configuration to fetch options
      const fetchOptions = getProxyFetchOptions(options);

      const response = await fetch(url, fetchOptions);
      const duration = Date.now() - startTime;

      console.log(`[WP-TEST] ✓ Request completed in ${duration}ms with status ${response.status}`);
      return response;

    } catch (error: any) {
      lastError = error;
      const duration = Date.now() - startTime;

      console.error(`[WP-TEST] ✗ Attempt ${attempt + 1} failed after ${duration}ms:`, error.message);
      console.error(`[WP-TEST] Error details:`, {
        name: error.name,
        code: error.code,
        cause: error.cause?.message || error.cause,
      });

      // Don't retry on certain errors
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        console.log('[WP-TEST] Request was aborted - not retrying');
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        console.log('[WP-TEST] Max retries reached - giving up');
        throw error;
      }

      // Calculate exponential backoff delay
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`[WP-TEST] Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// PATCH - Update WordPress connection
export async function PATCH(request: Request) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Verify project belongs to user
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, user_id, website_url')
      .eq('id', projectId)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this project' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { wp_username, wp_password, skip_wp_test } = body;

    let wp_url = null;
    let wordpressConnected = false;
    let wordpressWarning = null;

    // If credentials provided, test and update
    if (wp_username && wp_password) {
      wp_url = normalizeWordPressBaseUrl(project.website_url);
      const cleanPassword = cleanApplicationPassword(wp_password);

      const shouldSkipTest = skip_wp_test === true || skip_wp_test === 'true' || skip_wp_test === 1 || skip_wp_test === '1';

      // Test WordPress connection (unless skipped)
      if (!shouldSkipTest) {
        try {
          console.log(`[WP-TEST] Testing WordPress connection to: ${sanitizeUrl(wp_url)}`);
          console.log(`[WP-TEST] Using retry logic with ${MAX_RETRIES} retries and ${TEST_TIMEOUT}ms timeout`);
          const testUrl = buildWordPressUrl(wp_url, WORDPRESS_ENDPOINTS.wp.posts, { per_page: 1 });

          // Use advanced browser-like headers to avoid WAF/firewall blocking
          const authHeader = 'Basic ' + Buffer.from(`${wp_username}:${cleanPassword}`).toString('base64');
          const headers = getWordPressApiHeaders(authHeader, wp_url);

          // Use fetchWithRetry with AbortSignal.timeout for better timeout handling
          const testResponse = await fetchWithRetry(testUrl, {
            headers,
            signal: AbortSignal.timeout(TEST_TIMEOUT),
          });

          if (testResponse.ok) {
            wordpressConnected = true;
            console.log(`[WP-TEST] ✓ WordPress connection successful`);
          } else {
            console.log(`[WP-TEST] ✗ WordPress test failed with status: ${testResponse.status}`);
            // Use the error classification system for consistent error messages
            const errorDetails = classifyWordPressError(
              new Error(`HTTP ${testResponse.status}: ${testResponse.statusText}`),
              testResponse,
              wp_url
            );
            wordpressWarning = errorDetails.message;
          }
        } catch (wpError: any) {
          console.error(`[WP-TEST] ✗ WordPress test error after all retries:`, wpError.message);

          // Use the error classification system for consistent, helpful error messages
          const errorDetails = classifyWordPressError(wpError, undefined, wp_url);
          wordpressWarning = errorDetails.message;

          // Log troubleshooting steps for debugging
          if (errorDetails.troubleshooting.length > 0) {
            console.log(`[WP-TEST] Troubleshooting suggestions:`);
            errorDetails.troubleshooting.forEach((tip, i) => {
              console.log(`[WP-TEST]   ${i + 1}. ${tip}`);
            });
          }
        }
      }

      // Update project with new WordPress credentials
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          wp_url,
          wp_username,
          wp_password: cleanPassword,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (updateError) {
        console.error('Database error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update WordPress connection' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true,
        wordpress_connected: wordpressConnected,
        wordpress_warning: wordpressWarning,
        message: 'WordPress connection updated successfully'
      });
    }

    return NextResponse.json(
      { error: 'WordPress credentials are required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error updating WordPress connection:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove WordPress connection
export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Verify project belongs to user
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this project' },
        { status: 403 }
      );
    }

    // Remove WordPress connection
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        wp_url: null,
        wp_username: null,
        wp_password: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('Database error:', updateError);
      return NextResponse.json(
        { error: 'Failed to remove WordPress connection' },
        { status: 500 }
      );
    }

    console.log('WordPress connection removed successfully:', projectId);

    return NextResponse.json({ 
      success: true,
      message: 'WordPress connection removed successfully'
    });
  } catch (error: any) {
    console.error('Error removing WordPress connection:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
