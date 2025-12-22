import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
      // Create abort controller for timeout (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const wpResponse = await fetch(`${wpApiUrl}/posts`, {
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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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

      // Upload featured image if provided
      if (articleFeaturedImage && wpPost.id) {
        try {
          // Download the image
          const imageResponse = await fetch(articleFeaturedImage);
          if (imageResponse.ok) {
            const imageBuffer = await imageResponse.arrayBuffer();
            const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
            const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
            
            // Upload to WordPress media library
            const mediaController = new AbortController();
            const mediaTimeoutId = setTimeout(() => mediaController.abort(), 60000);

            const mediaResponse = await fetch(`${wpApiUrl}/media`, {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="featured-${wpPost.id}.${extension}"`,
                'User-Agent': 'WritGo-SEO-Agent/2.0',
              },
              body: imageBuffer,
              signal: mediaController.signal,
            });

            clearTimeout(mediaTimeoutId);

            if (mediaResponse.ok) {
              const media = await mediaResponse.json();
              
              // Set as featured image
              await fetch(`${wpApiUrl}/posts/${wpPost.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': authHeader,
                  'User-Agent': 'WritGo-SEO-Agent/2.0',
                },
                body: JSON.stringify({
                  featured_media: media.id,
                }),
              });
              
              console.log('Featured image uploaded:', media.id);
            }
          }
        } catch (imageError) {
          console.warn('Could not upload featured image:', imageError);
          // Continue without featured image
        }
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
      
      if (wpError.name === 'AbortError') {
        errorMessage = 'Verbinding met WordPress duurde te lang (timeout). Probeer het opnieuw.';
      } else if (wpError.code === 'ENOTFOUND' || wpError.code === 'ECONNREFUSED') {
        errorMessage = 'Kon de WordPress website niet bereiken. Controleer de URL.';
      } else if (wpError.message) {
        errorMessage = `WordPress fout: ${wpError.message}`;
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const testResponse = await fetch(`${wpApiUrl}/posts?per_page=1`, {
        headers: {
          'Authorization': authHeader,
          'User-Agent': 'WritGo-SEO-Agent/2.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (testResponse.ok) {
        return NextResponse.json({ 
          connected: true, 
          message: 'WordPress verbinding succesvol' 
        });
      } else {
        return NextResponse.json({ 
          connected: false, 
          error: `WordPress returned ${testResponse.status}` 
        });
      }
    } catch (testError: any) {
      return NextResponse.json({ 
        connected: false, 
        error: testError.name === 'AbortError' ? 'Timeout' : testError.message 
      });
    }

  } catch (error: any) {
    return NextResponse.json({ 
      connected: false, 
      error: error.message 
    }, { status: 500 });
  }
}
