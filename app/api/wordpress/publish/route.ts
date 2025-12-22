import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Longer timeout for slow WordPress servers (60 seconds)
const PUBLISH_TIMEOUT = 60000;
const TEST_TIMEOUT = 30000;
const MEDIA_TIMEOUT = 90000;

// Helper function to clean WordPress Application Password
function cleanApplicationPassword(password: string): string {
  // WordPress Application Passwords are often displayed with spaces
  // Remove all whitespace for the actual API call
  return password.replace(/\s+/g, '');
}

// Helper function to ensure proper WordPress REST API URL
function getWordPressApiUrl(wpUrl: string): string {
  let url = wpUrl.trim();
  
  // Remove trailing slash
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  
  // If it already has /wp-json/wp/v2, use as is
  if (url.includes('/wp-json/wp/v2')) {
    return url;
  }
  
  // If it has /wp-json but not /wp/v2, add it
  if (url.includes('/wp-json')) {
    return url.endsWith('/wp-json') ? `${url}/wp/v2` : url;
  }
  
  // Otherwise, add the full REST API path
  return `${url}/wp-json/wp/v2`;
}

// Helper function to make fetch with retry
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  timeout: number,
  retries: number = 2
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      lastError = error;
      console.warn(`Fetch attempt ${attempt + 1} failed:`, error.message);
      
      // Don't retry on non-timeout errors
      if (error.name !== 'AbortError' && !error.message?.includes('timeout')) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  throw lastError || new Error('All fetch attempts failed');
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
    const { project_id, article_id, title, content, featured_image } = body;

    if (!project_id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Get project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if WordPress is configured
    if (!project.wp_url || !project.wp_username || !project.wp_password) {
      return NextResponse.json(
        { error: 'WordPress is niet geconfigureerd voor dit project. Voeg WordPress credentials toe in projectinstellingen.' },
        { status: 400 }
      );
    }

    let articleTitle = title;
    let articleContent = content;
    let articleFeaturedImage = featured_image;

    // If article_id is provided, get article from database
    if (article_id) {
      const { data: article, error: articleError } = await supabase
        .from('articles')
        .select('*')
        .eq('id', article_id)
        .eq('project_id', project_id)
        .single();

      if (articleError || !article) {
        return NextResponse.json(
          { error: 'Article not found' },
          { status: 404 }
        );
      }

      articleTitle = article.title;
      articleContent = article.content;
      articleFeaturedImage = article.featured_image || articleFeaturedImage;
    }

    // Validate we have content to publish
    if (!articleTitle || !articleContent) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Prepare WordPress API URL and credentials
    const wpApiUrl = getWordPressApiUrl(project.wp_url);
    const cleanPassword = cleanApplicationPassword(project.wp_password);
    const authHeader = 'Basic ' + Buffer.from(`${project.wp_username}:${cleanPassword}`).toString('base64');

    console.log('WordPress API URL:', wpApiUrl);
    console.log('Publishing article:', articleTitle);

    // Publish to WordPress
    try {
      const wpResponse = await fetchWithRetry(
        `${wpApiUrl}/posts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
            'User-Agent': 'WritGo-SEO-Agent/2.0',
          },
          body: JSON.stringify({
            title: articleTitle,
            content: articleContent,
            status: 'publish',
          }),
        },
        PUBLISH_TIMEOUT,
        2 // 2 retries
      );

      if (!wpResponse.ok) {
        const errorText = await wpResponse.text();
        console.error('WordPress error response:', wpResponse.status, errorText);
        
        // Parse WordPress error for better message
        let errorMessage = 'Kon niet publiceren naar WordPress';
        try {
          const wpError = JSON.parse(errorText);
          if (wpError.message) {
            errorMessage = wpError.message;
          }
          if (wpError.code === 'rest_cannot_create') {
            errorMessage = 'Geen rechten om posts te maken. Controleer of de gebruiker de juiste rechten heeft.';
          }
          if (wpError.code === 'rest_forbidden') {
            errorMessage = 'Toegang geweigerd. Controleer je WordPress credentials en applicatiewachtwoord.';
          }
        } catch {
          // Use status-based error message
          if (wpResponse.status === 401) {
            errorMessage = 'Authenticatie mislukt. Controleer je gebruikersnaam en applicatiewachtwoord.';
          } else if (wpResponse.status === 403) {
            errorMessage = 'Toegang geweigerd. De gebruiker heeft geen rechten om posts te maken.';
          } else if (wpResponse.status === 404) {
            errorMessage = 'WordPress REST API niet gevonden. Controleer de website URL.';
          }
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: 500 }
        );
      }

      const wpPost = await wpResponse.json();
      console.log('WordPress post created:', wpPost.id, wpPost.link);

      // Upload featured image if provided (in background, don't block)
      if (articleFeaturedImage && wpPost.id) {
        uploadFeaturedImage(wpApiUrl, authHeader, wpPost.id, articleFeaturedImage).catch(err => {
          console.warn('Featured image upload failed (non-blocking):', err.message);
        });
      }

      // Update article status if we have an article_id
      if (article_id) {
        await supabase
          .from('articles')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            wordpress_id: wpPost.id,
            wordpress_url: wpPost.link,
          })
          .eq('id', article_id);
      }

      return NextResponse.json({
        success: true,
        url: wpPost.link,
        wordpress_url: wpPost.link,
        wordpress_id: wpPost.id,
      });

    } catch (wpError: any) {
      console.error('WordPress connection error:', wpError);
      
      let errorMessage = 'Kon geen verbinding maken met WordPress';
      
      if (wpError.name === 'AbortError' || wpError.message?.includes('timeout') || wpError.code === 'UND_ERR_CONNECT_TIMEOUT') {
        errorMessage = `De WordPress server (${project.wp_url}) reageert te langzaam. Dit kan komen door:
• Trage hosting of server
• Firewall die de verbinding blokkeert
• Server is overbelast

Probeer het later opnieuw of neem contact op met je hosting provider.`;
      } else if (wpError.code === 'ENOTFOUND' || wpError.code === 'ECONNREFUSED') {
        errorMessage = 'Kon de WordPress website niet bereiken. Controleer of de URL correct is en de website online is.';
      } else if (wpError.message) {
        errorMessage = `Verbindingsfout: ${wpError.message}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error publishing to WordPress:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Background function to upload featured image
async function uploadFeaturedImage(
  wpApiUrl: string, 
  authHeader: string, 
  postId: number, 
  imageUrl: string
): Promise<void> {
  try {
    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.warn('Could not download featured image');
      return;
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    
    // Upload to WordPress media library
    const mediaResponse = await fetchWithRetry(
      `${wpApiUrl}/media`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="featured-${postId}.${extension}"`,
          'User-Agent': 'WritGo-SEO-Agent/2.0',
        },
        body: imageBuffer,
      },
      MEDIA_TIMEOUT,
      1 // 1 retry
    );

    if (mediaResponse.ok) {
      const media = await mediaResponse.json();
      
      // Set as featured image
      await fetchWithRetry(
        `${wpApiUrl}/posts/${postId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
            'User-Agent': 'WritGo-SEO-Agent/2.0',
          },
          body: JSON.stringify({
            featured_media: media.id,
          }),
        },
        30000,
        1
      );
      
      console.log('Featured image uploaded:', media.id);
    }
  } catch (imageError) {
    console.warn('Could not upload featured image:', imageError);
    // Don't throw - this is a background operation
  }
}

// Test WordPress connection endpoint
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get('project_id');

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const { data: project } = await supabase
      .from('projects')
      .select('wp_url, wp_username, wp_password')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (!project || !project.wp_url || !project.wp_username || !project.wp_password) {
      return NextResponse.json({ 
        connected: false, 
        error: 'WordPress niet geconfigureerd' 
      });
    }

    const wpApiUrl = getWordPressApiUrl(project.wp_url);
    const cleanPassword = cleanApplicationPassword(project.wp_password);
    const authHeader = 'Basic ' + Buffer.from(`${project.wp_username}:${cleanPassword}`).toString('base64');

    try {
      const testResponse = await fetchWithRetry(
        `${wpApiUrl}/posts?per_page=1`,
        {
          headers: {
            'Authorization': authHeader,
            'User-Agent': 'WritGo-SEO-Agent/2.0',
          },
        },
        TEST_TIMEOUT,
        1 // 1 retry
      );

      if (testResponse.ok) {
        return NextResponse.json({ 
          connected: true, 
          message: 'WordPress verbinding succesvol' 
        });
      } else {
        let errorMessage = `WordPress returned status ${testResponse.status}`;
        if (testResponse.status === 401) {
          errorMessage = 'Authenticatie mislukt. Controleer je credentials.';
        } else if (testResponse.status === 403) {
          errorMessage = 'Toegang geweigerd.';
        } else if (testResponse.status === 404) {
          errorMessage = 'REST API niet gevonden.';
        }
        return NextResponse.json({ 
          connected: false, 
          error: errorMessage 
        });
      }
    } catch (testError: any) {
      let errorMessage = testError.message;
      if (testError.name === 'AbortError' || testError.code === 'UND_ERR_CONNECT_TIMEOUT') {
        errorMessage = 'Server reageert te langzaam (timeout). De hosting is mogelijk traag.';
      }
      return NextResponse.json({ 
        connected: false, 
        error: errorMessage 
      });
    }

  } catch (error: any) {
    return NextResponse.json({ 
      connected: false, 
      error: error.message 
    }, { status: 500 });
  }
}
