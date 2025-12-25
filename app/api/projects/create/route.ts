import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { buildWordPressUrl, WORDPRESS_ENDPOINTS, buildWritgoHeaders } from '@/lib/wordpress-endpoints';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    const { name, website_url, writgo_api_key, skip_wp_test } = body;

    // Log incoming request for debugging
    console.log('Creating project:', { name, website_url, hasWritgoApiKey: !!writgo_api_key, skip_wp_test });

    // Validate required fields (only name and URL)
    if (!name || !website_url) {
      return NextResponse.json(
        { error: 'Project name and website URL are required' },
        { status: 400 }
      );
    }

    // Check if WritGo Connector API key is provided
    const hasWritgoApiKey = !!writgo_api_key;

    let wp_url = null;
    let wordpressConnected = false;
    let wordpressWarning = null;

    // Only process WordPress connection if WritGo API key is provided
    if (hasWritgoApiKey) {
      // Generate wp_url from website_url (base URL only)
      wp_url = normalizeWordPressBaseUrl(website_url);

      console.log('WritGo API key provided for:', wp_url);
      console.log('Skip test:', skip_wp_test, 'Type:', typeof skip_wp_test);

      // ALWAYS skip test if skip_wp_test is truthy (string "true", boolean true, or any truthy value)
      const shouldSkipTest = skip_wp_test === true || skip_wp_test === 'true' || skip_wp_test === 1 || skip_wp_test === '1';

      console.log('Should skip test:', shouldSkipTest);

      // Test WritGo Connector plugin connection (unless skipped)
      if (!shouldSkipTest) {
        try {
          const testUrl = `${wp_url}${WORDPRESS_ENDPOINTS.writgo.test}`;
          const testResponse = await fetch(testUrl, {
            headers: buildWritgoHeaders(writgo_api_key, wp_url),
            signal: AbortSignal.timeout(120000),
          });

          console.log('WritGo plugin test response status:', testResponse.status);

          if (testResponse.ok) {
            wordpressConnected = true;
            console.log('WritGo Connector plugin connection successful');
          } else {
            const errorText = await testResponse.text();
            console.error('WritGo plugin connection failed:', testResponse.status, errorText);

            // Don't block project creation, just warn
            if (testResponse.status === 401) {
              wordpressWarning = 'WritGo API key is ongeldig. Controleer je plugin instellingen later.';
            } else if (testResponse.status === 404) {
              wordpressWarning = 'WritGo Connector plugin niet gevonden. Installeer de plugin op je WordPress site.';
            } else {
              wordpressWarning = `WritGo plugin test mislukt (${testResponse.status})`;
            }
          }
        } catch (wpError: any) {
          console.error('WritGo plugin connection error:', wpError);
          console.error('Error code:', wpError.code || 'N/A');
          console.error('Error cause:', wpError.cause?.message || 'N/A');

          // Don't block project creation on timeout or connection errors
          if (wpError.name === 'AbortError' || wpError.code === 'UND_ERR_CONNECT_TIMEOUT' || wpError.code === 'ETIMEDOUT' || wpError.code === 'TIMEOUT') {
            wordpressWarning = 'WritGo plugin test timeout - de server reageert traag (>120s). API key is opgeslagen.';
          } else if (wpError.code === 'ENOTFOUND') {
            wordpressWarning = 'Website niet gevonden. Controleer de URL.';
          } else if (wpError.code === 'ECONNREFUSED') {
            wordpressWarning = 'Verbinding geweigerd. Website mogelijk offline.';
          } else {
            wordpressWarning = `WritGo plugin test mislukt: ${wpError.message || 'onbekende fout'}`;
          }
        }
      } else {
        // Test was skipped, assume API key is correct
        console.log('WritGo plugin test skipped by user request');
        wordpressWarning = 'WritGo plugin test overgeslagen. API key opgeslagen.';
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
        writgo_api_key: writgo_api_key || null,
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
