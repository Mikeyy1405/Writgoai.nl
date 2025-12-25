import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { buildWordPressUrl, WORDPRESS_ENDPOINTS } from '@/lib/wordpress-endpoints';
import { classifyWordPressError, sanitizeUrl } from '@/lib/wordpress-errors';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
          const testUrl = buildWordPressUrl(wp_url, WORDPRESS_ENDPOINTS.wp.posts, { per_page: 1 });

          const testResponse = await fetch(testUrl, {
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${wp_username}:${cleanPassword}`).toString('base64'),
              'User-Agent': 'Mozilla/5.0 (compatible; WritGoBot/1.0; +https://writgo.nl)',
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(120000),
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
          console.error(`[WP-TEST] ✗ WordPress test error:`, wpError.message);
          console.error(`[WP-TEST] Error details:`, {
            name: wpError.name,
            code: wpError.code,
            cause: wpError.cause?.message || wpError.cause?.code,
          });

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
