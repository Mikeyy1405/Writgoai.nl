import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { buildWordPressUrl, WORDPRESS_ENDPOINTS } from '@/lib/wordpress-endpoints';
import { fetchWithDnsFallback } from '@/lib/fetch-with-dns-fallback';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper function to clean WordPress Application Password
function cleanApplicationPassword(password: string): string {
  // WordPress Application Passwords are displayed with spaces (e.g., "xxxx xxxx xxxx xxxx")
  // Remove all whitespace for the actual API call
  return password.replace(/\s+/g, '');
}

// Helper function to normalize WordPress base URL
// Returns only the base website URL (e.g., "https://example.com")
// The wp-json paths should be added by the wordpress-endpoints helper functions
function normalizeWordPressBaseUrl(websiteUrl: string): string {
  let url = websiteUrl.trim();

  // Remove trailing slash
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }

  // Remove any existing /wp-json paths to start fresh
  url = url.replace(/\/wp-json.*$/, '');

  // Return only the base URL without any API paths
  return url;
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, website_url, wp_username, wp_password, skip_wp_test } = body;

    // Log incoming request for debugging
    console.log('Creating project:', { name, website_url, hasWpCredentials: !!(wp_username && wp_password), skip_wp_test });

    // Validate required fields (only name and URL)
    if (!name || !website_url) {
      return NextResponse.json(
        { error: 'Project name and website URL are required' },
        { status: 400 }
      );
    }

    // Check if WordPress credentials are provided
    const hasWordPressCredentials = wp_username && wp_password;

    let wp_url = null;
    let finalWpUsername = wp_username || null;
    let finalWpPassword = wp_password || null;
    let wordpressConnected = false;
    let wordpressWarning = null;

    // Only process WordPress connection if credentials are provided
    if (hasWordPressCredentials) {
      // Generate wp_url from website_url (base URL only)
      wp_url = normalizeWordPressBaseUrl(website_url);

      // Clean the password (remove spaces from Application Password)
      const cleanPassword = cleanApplicationPassword(wp_password);

      console.log('WordPress credentials provided for:', wp_url);
      console.log('Username:', wp_username);
      console.log('Skip test:', skip_wp_test, 'Type:', typeof skip_wp_test);

      // ALWAYS skip test if skip_wp_test is truthy (string "true", boolean true, or any truthy value)
      const shouldSkipTest = skip_wp_test === true || skip_wp_test === 'true' || skip_wp_test === 1 || skip_wp_test === '1';

      console.log('Should skip test:', shouldSkipTest);

      // Test WordPress connection (unless skipped)
      if (!shouldSkipTest) {
        try {
          const testUrl = buildWordPressUrl(wp_url, WORDPRESS_ENDPOINTS.wp.posts, { per_page: 1 });
          const testResponse = await fetchWithDnsFallback(testUrl, {
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${wp_username}:${cleanPassword}`).toString('base64'),
              'User-Agent': 'Mozilla/5.0 (compatible; WritGoBot/1.0; +https://writgo.nl)',
              'Accept': 'application/json',
            },
            timeout: 60000, // Increased to 60s for slow .nl/.be domains
          });

          console.log('WordPress test response status:', testResponse.status);

          if (testResponse.ok) {
            wordpressConnected = true;
            console.log('WordPress connection successful');
          } else {
            const errorText = await testResponse.text();
            console.error('WordPress connection failed:', testResponse.status, errorText);
            
            // Don't block project creation, just warn
            if (testResponse.status === 401) {
              wordpressWarning = 'WordPress authenticatie mislukt. Controleer je credentials later.';
            } else if (testResponse.status === 403) {
              wordpressWarning = 'WordPress toegang geweigerd. Controleer gebruikersrechten.';
            } else if (testResponse.status === 404) {
              wordpressWarning = 'WordPress REST API niet gevonden.';
            } else {
              wordpressWarning = `WordPress test mislukt (${testResponse.status})`;
            }
          }
        } catch (wpError: any) {
          console.error('WordPress connection error:', wpError);
          console.error('Error code:', wpError.code || 'N/A');
          console.error('Error cause:', wpError.cause?.message || 'N/A');
          
          // Don't block project creation on timeout or connection errors
          if (wpError.name === 'AbortError' || wpError.code === 'UND_ERR_CONNECT_TIMEOUT' || wpError.code === 'ETIMEDOUT' || wpError.code === 'TIMEOUT') {
            wordpressWarning = 'WordPress test timeout - de server reageert traag (>60s). Credentials zijn opgeslagen.';
          } else if (wpError.code === 'ENOTFOUND') {
            wordpressWarning = 'Website niet gevonden. Controleer de URL.';
          } else if (wpError.code === 'ECONNREFUSED') {
            wordpressWarning = 'Verbinding geweigerd. Website mogelijk offline.';
          } else {
            wordpressWarning = `WordPress test mislukt: ${wpError.message || 'onbekende fout'}`;
          }
        }
      } else {
        // Test was skipped, assume credentials are correct
        console.log('WordPress test skipped by user request');
        wordpressWarning = 'WordPress test overgeslagen. Credentials opgeslagen.';
      }
    }

    // Create project in database (always, even if WordPress test failed)
    const { data: project, error: dbError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name,
        website_url,
        wp_url,
        wp_username: finalWpUsername,
        wp_password: finalWpPassword,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }

    console.log('Project created successfully:', project.id);

    return NextResponse.json({ 
      success: true, 
      project,
      wordpress_connected: wordpressConnected,
      wordpress_warning: wordpressWarning
    });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
