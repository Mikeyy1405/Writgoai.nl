import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { WORDPRESS_ENDPOINTS, getWordPressEndpoint, buildAuthHeader, getPostsEndpoint, getMediaEndpoint, buildWordPressUrl } from '@/lib/wordpress-endpoints';
import { sanitizeUrl } from '@/lib/wordpress-errors';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Improved timeouts for slow WordPress servers
const CONNECT_TIMEOUT = 30000; // 30 seconds for initial connection
const PUBLISH_TIMEOUT = 90000; // 90 seconds for publishing (increased from 60s)
const TEST_TIMEOUT = 45000; // 45 seconds for connection tests (increased from 30s)
const MEDIA_TIMEOUT = 120000; // 120 seconds for media uploads (increased from 90s)
const RETRY_BASE_DELAY = 2000; // 2 seconds base delay for exponential backoff

// Helper function to make fetch with retry and improved timeout handling
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  timeout: number,
  retries: number = 2
): Promise<Response> {
  let lastError: Error | null = null;
  const hostname = new URL(url).hostname;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        // Node.js undici-specific options to override default connection timeout
        // TypeScript doesn't have types for these, but they're required for proper timeout handling
        // @ts-ignore
        headersTimeout: timeout,
        bodyTimeout: timeout,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      lastError = error;
      console.warn(`[Fetch Retry] Attempt ${attempt + 1}/${retries + 1} failed`);
      console.warn(`[Fetch Retry] Target: ${hostname}`);
      console.warn(`[Fetch Retry] Error:`, error.message);
      console.warn(`[Fetch Retry] Error code:`, error.code || 'N/A');
      console.warn(`[Fetch Retry] Error cause:`, error.cause?.message || 'N/A');
      
      // Check if this is a timeout error
      const isTimeoutError = 
        error.name === 'AbortError' || 
        error.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNRESET' ||
        error.message?.includes('timeout');
      
      // Only retry on timeout errors
      if (isTimeoutError && attempt < retries) {
        const backoffTime = RETRY_BASE_DELAY * (attempt + 1); // 2s, 4s, 6s
        console.log(`[Fetch Retry] Retrying in ${backoffTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue;
      }
      
      // Don't retry non-timeout errors (auth errors, permission errors, etc.)
      throw error;
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
    const wpUrl = project.wp_url.replace(/\/$/, '');
    const authHeader = buildAuthHeader(project.wp_username, project.wp_password);
    const postsEndpoint = getPostsEndpoint(wpUrl);

    console.log('WordPress API URL:', sanitizeUrl(postsEndpoint));
    console.log('Publishing article:', articleTitle);
    console.log('Target host:', new URL(wpUrl).hostname);
    console.log('Using timeout:', PUBLISH_TIMEOUT, 'ms');

    // Publish to WordPress
    try {
      const wpResponse = await fetchWithRetry(
        postsEndpoint,
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
        uploadFeaturedImage(wpUrl, authHeader, wpPost.id, articleFeaturedImage).catch(err => {
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
      console.error('WordPress error code:', wpError.code || 'N/A');
      console.error('WordPress error cause:', wpError.cause?.message || 'N/A');
      
      let errorMessage = 'Kon geen verbinding maken met WordPress';
      
      if (wpError.name === 'AbortError' || wpError.message?.includes('timeout') || wpError.code === 'UND_ERR_CONNECT_TIMEOUT' || wpError.code === 'ETIMEDOUT') {
        errorMessage = `De WordPress server (${new URL(wpUrl).hostname}) reageert te langzaam of is niet bereikbaar.

Mogelijke oorzaken:
• Trage hosting of overbelaste server
• Firewall die de verbinding blokkeert
• Server tijdelijk offline

Wat te doen:
• Check of je WordPress site online is in een browser
• Neem contact op met je hosting provider
• Controleer firewall instellingen bij je hosting
• Probeer het later opnieuw`;
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
  wpUrl: string, 
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
    const mediaEndpoint = getMediaEndpoint(wpUrl);
    const mediaResponse = await fetchWithRetry(
      mediaEndpoint,
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
      const postEndpoint = getPostsEndpoint(wpUrl, postId);
      await fetchWithRetry(
        postEndpoint,
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

    const wpUrl = project.wp_url.replace(/\/$/, '');
    const authHeader = buildAuthHeader(project.wp_username, project.wp_password);

    console.log('[WordPress Test] Testing connection to:', new URL(wpUrl).hostname);
    console.log('[WordPress Test] Using timeout:', TEST_TIMEOUT, 'ms');

    try {
      const postsTestUrl = buildWordPressUrl(wpUrl, WORDPRESS_ENDPOINTS.wp.posts, { per_page: 1 });
      const testResponse = await fetchWithRetry(
        postsTestUrl,
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
      console.error('[WordPress Test] Connection error:', testError);
      console.error('[WordPress Test] Error code:', testError.code || 'N/A');
      console.error('[WordPress Test] Error cause:', testError.cause?.message || 'N/A');
      
      let errorMessage = testError.message;
      if (testError.name === 'AbortError' || testError.code === 'UND_ERR_CONNECT_TIMEOUT' || testError.code === 'ETIMEDOUT') {
        errorMessage = 'Server reageert te langzaam (timeout). De hosting is mogelijk traag of de server is overbelast. Probeer het later opnieuw.';
      } else if (testError.code === 'ENOTFOUND') {
        errorMessage = 'Website niet gevonden. Controleer of de URL correct is.';
      } else if (testError.code === 'ECONNREFUSED') {
        errorMessage = 'Verbinding geweigerd. Website is mogelijk offline.';
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
