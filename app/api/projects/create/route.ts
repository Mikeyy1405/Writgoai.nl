import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper function to clean WordPress Application Password
function cleanApplicationPassword(password: string): string {
  // WordPress Application Passwords are displayed with spaces (e.g., "xxxx xxxx xxxx xxxx")
  // Remove all whitespace for the actual API call
  return password.replace(/\s+/g, '');
}

// Helper function to ensure proper WordPress REST API URL
function getWordPressApiUrl(websiteUrl: string): string {
  let url = websiteUrl.trim();
  
  // Remove trailing slash
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  
  // Remove any existing /wp-json paths to start fresh
  url = url.replace(/\/wp-json.*$/, '');
  
  // Add the REST API path
  return `${url}/wp-json/wp/v2`;
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
    const { name, website_url, wp_username, wp_password } = body;

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

    // Only process WordPress connection if credentials are provided
    if (hasWordPressCredentials) {
      // Generate wp_url from website_url
      wp_url = getWordPressApiUrl(website_url);
      
      // Clean the password (remove spaces from Application Password)
      const cleanPassword = cleanApplicationPassword(wp_password);

      console.log('Testing WordPress connection to:', wp_url);
      console.log('Username:', wp_username);

      // Test WordPress connection
      try {
        // Create abort controller for timeout (15 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const testResponse = await fetch(`${wp_url}/posts?per_page=1`, {
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${wp_username}:${cleanPassword}`).toString('base64'),
            'User-Agent': 'WritGo-SEO-Agent/2.0',
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        console.log('WordPress test response status:', testResponse.status);

        if (testResponse.ok) {
          wordpressConnected = true;
          console.log('WordPress connection successful');
        } else {
          const errorText = await testResponse.text();
          console.error('WordPress connection failed:', testResponse.status, errorText);
          
          let errorMessage = `WordPress verbinding mislukt (${testResponse.status})`;
          
          if (testResponse.status === 401) {
            errorMessage = 'WordPress authenticatie mislukt. Controleer je gebruikersnaam en applicatiewachtwoord. Zorg dat het applicatiewachtwoord correct is gekopieerd (met of zonder spaties).';
          } else if (testResponse.status === 403) {
            errorMessage = 'Toegang geweigerd. Controleer of de gebruiker de juiste rechten heeft en of de REST API toegankelijk is.';
          } else if (testResponse.status === 404) {
            errorMessage = 'WordPress REST API niet gevonden. Controleer of dit een WordPress website is en of de REST API is ingeschakeld.';
          }
          
          return NextResponse.json(
            { error: errorMessage },
            { status: 400 }
          );
        }
      } catch (wpError: any) {
        console.error('WordPress connection error:', wpError);
        
        let errorMessage = 'Kon geen verbinding maken met WordPress';
        
        if (wpError.name === 'AbortError') {
          errorMessage = 'Verbinding met WordPress duurde te lang (timeout). Controleer of de website bereikbaar is.';
        } else if (wpError.code === 'ENOTFOUND') {
          errorMessage = 'Website niet gevonden. Controleer de URL.';
        } else if (wpError.code === 'ECONNREFUSED') {
          errorMessage = 'Verbinding geweigerd. Controleer of de website online is.';
        } else if (wpError.message) {
          errorMessage = `Verbindingsfout: ${wpError.message}`;
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        );
      }
    }

    // Create project in database
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

    return NextResponse.json({ 
      success: true, 
      project,
      wordpress_connected: wordpressConnected 
    });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
