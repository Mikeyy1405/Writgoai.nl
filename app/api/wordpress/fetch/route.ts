import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

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
      return NextResponse.json(
        { error: 'WordPress configuratie is niet compleet. Configureer WordPress in project instellingen.' },
        { status: 400 }
      );
    }

    // Prepare WordPress credentials
    const wpUrl = project.wp_url.replace(/\/$/, ''); // Remove trailing slash
    const username = project.wp_username || '';
    const password = (project.wp_app_password || project.wp_password || '').replace(/\s+/g, '');

    if (!password) {
      return NextResponse.json(
        { error: 'WordPress wachtwoord ontbreekt' },
        { status: 400 }
      );
    }

    // Create Basic Auth header
    const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

    // Fetch posts from WordPress
    const wpApiUrl = `${wpUrl}/wp-json/wp/v2/posts?page=${page}&per_page=${perPage}&_embed`;

    console.log(`Fetching WordPress posts from: ${wpApiUrl}`);

    const wpResponse = await fetch(wpApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!wpResponse.ok) {
      const errorText = await wpResponse.text();
      console.error('WordPress fetch error:', wpResponse.status, errorText);

      if (wpResponse.status === 401) {
        return NextResponse.json(
          { error: 'WordPress authenticatie mislukt. Controleer je gebruikersnaam en wachtwoord.' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: `WordPress fout: ${wpResponse.statusText}` },
        { status: wpResponse.status }
      );
    }

    const posts = await wpResponse.json();

    // Get total pages from header
    const totalPages = parseInt(wpResponse.headers.get('X-WP-TotalPages') || '1');
    const totalPosts = parseInt(wpResponse.headers.get('X-WP-Total') || '0');

    // Transform WordPress posts to our format
    const transformedPosts = posts.map((post: any) => {
      // Get featured image URL
      let featuredImage = null;
      if (post._embedded && post._embedded['wp:featuredmedia']) {
        const media = post._embedded['wp:featuredmedia'][0];
        featuredImage = media.source_url || null;
      }

      // Get categories
      const categories = post._embedded?.['wp:term']?.[0] || [];

      // Get tags
      const tags = post._embedded?.['wp:term']?.[1] || [];

      return {
        wordpress_id: post.id,
        title: post.title.rendered,
        content: post.content.rendered,
        excerpt: post.excerpt.rendered,
        slug: post.slug,
        status: post.status,
        featured_image: featuredImage,
        wordpress_url: post.link,
        published_at: post.date,
        modified_at: post.modified,
        categories: categories.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
        })),
        tags: tags.map((tag: any) => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
        })),
        // SEO fields (if Yoast is installed)
        meta_title: post.yoast_head_json?.title || post.title.rendered,
        meta_description: post.yoast_head_json?.description || '',
        focus_keyword: post.yoast_head_json?.focus_keyword || '',
      };
    });

    return NextResponse.json({
      success: true,
      posts: transformedPosts,
      pagination: {
        current_page: page,
        per_page: perPage,
        total_pages: totalPages,
        total_posts: totalPosts,
      },
    });

  } catch (error: any) {
    console.error('Error fetching WordPress posts:', error);

    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'WordPress server reageert niet. Probeer het later opnieuw.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden bij het ophalen van WordPress posts' },
      { status: 500 }
    );
  }
}
