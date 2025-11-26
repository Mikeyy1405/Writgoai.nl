
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface WordPressPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  link: string;
  date: string;
  modified: string;
  status: string;
  featured_media: number;
  categories: number[];
  tags: number[];
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
      alt_text: string;
    }>;
  };
}

/**
 * GET /api/client/wordpress/posts
 * Fetches all WordPress posts for the selected project
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');
    const status = searchParams.get('status') || 'publish'; // publish, draft, any

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is verplicht' }, { status: 400 });
    }

    // Get project and WordPress config
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: { email: session.user.email }
      },
      include: {
        client: {
          select: {
            wordpressUrl: true,
            wordpressUsername: true,
            wordpressPassword: true,
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Get WordPress credentials (project-specific or client-level)
    const wordpressUrl = project.wordpressUrl || project.client.wordpressUrl;
    const wordpressUsername = project.wordpressUsername || project.client.wordpressUsername;
    const wordpressPassword = project.wordpressPassword || project.client.wordpressPassword;

    if (!wordpressUrl || !wordpressUsername || !wordpressPassword) {
      return NextResponse.json({ 
        error: 'WordPress configuratie ontbreekt. Stel eerst je WordPress credentials in.' 
      }, { status: 400 });
    }

    // First, validate that WordPress REST API is accessible
    const testUrl = `${wordpressUrl}/wp-json/wp/v2`;
    console.log('Validating WordPress REST API at:', testUrl);
    
    try {
      const testResponse = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!testResponse.ok) {
        // Check if it's a 404 (not a WordPress site)
        if (testResponse.status === 404) {
          return NextResponse.json({ 
            error: 'Dit is geen WordPress website of de REST API is niet beschikbaar',
            details: `${wordpressUrl} heeft geen WordPress REST API endpoint. Controleer of dit een WordPress website is.`
          }, { status: 400 });
        }
      }

      // Check the response content type
      const contentType = testResponse.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        return NextResponse.json({ 
          error: 'Dit is geen WordPress website',
          details: `${wordpressUrl} geeft geen JSON response. Dit lijkt geen WordPress website te zijn.`
        }, { status: 400 });
      }
    } catch (error: any) {
      console.error('WordPress REST API validation failed:', error);
      return NextResponse.json({ 
        error: 'WordPress website is niet bereikbaar',
        details: `Kan geen verbinding maken met ${wordpressUrl}. Controleer of de URL correct is.`
      }, { status: 400 });
    }

    // Fetch posts from WordPress REST API
    const auth = Buffer.from(`${wordpressUsername}:${wordpressPassword}`).toString('base64');
    const apiUrl = `${wordpressUrl}/wp-json/wp/v2/posts?` + new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      status: status,
      _embed: '1', // Include featured images
      orderby: 'modified',
      order: 'desc'
    });

    console.log('Fetching WordPress posts from:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WordPress API error:', response.status, errorText);
      
      // Provide specific error messages
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ 
          error: 'WordPress authenticatie mislukt',
          details: 'Controleer je WordPress gebruikersnaam en wachtwoord/app-password.'
        }, { status: response.status });
      }
      
      return NextResponse.json({ 
        error: `WordPress API fout: ${response.status}`,
        details: errorText.substring(0, 200) // Limit error text length
      }, { status: response.status });
    }

    const posts: WordPressPost[] = await response.json();
    const totalPosts = parseInt(response.headers.get('X-WP-Total') || '0');
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');

    // Transform posts to a cleaner format
    const transformedPosts = posts.map(post => ({
      id: post.id,
      title: post.title.rendered,
      excerpt: post.excerpt.rendered?.replace(/<[^>]*>/g, '').slice(0, 200) || '',
      link: post.link,
      date: post.date,
      modified: post.modified,
      status: post.status,
      featuredImage: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
      wordCount: post.content.rendered.replace(/<[^>]*>/g, '').split(/\s+/).length,
    }));

    return NextResponse.json({
      posts: transformedPosts,
      pagination: {
        page,
        perPage,
        total: totalPosts,
        totalPages
      }
    });

  } catch (error: any) {
    console.error('Error fetching WordPress posts:', error);
    return NextResponse.json({ 
      error: 'Fout bij ophalen WordPress posts',
      details: error.message 
    }, { status: 500 });
  }
}
