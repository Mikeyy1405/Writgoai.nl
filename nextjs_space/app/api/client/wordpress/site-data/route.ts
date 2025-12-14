import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { fetchWordPressCategories } from '@/lib/wordpress-publisher';
import { loadWordPressSitemap } from '@/lib/sitemap-loader';

export const dynamic = "force-dynamic";

/**
 * Helper function to strip HTML tags from text
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * API endpoint to load complete WordPress site data for a project
 * Includes: categories, posts, pages, tags, and sitemap
 * Supports both GET (with query param) and POST (with body)
 */
async function loadWordPressData(request: NextRequest, projectId: string, userEmail: string) {
  // Get the project and verify it belongs to this client
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      client: {
        email: userEmail
      }
    },
    select: {
      id: true,
      name: true,
      websiteUrl: true,
      wordpressUrl: true,
      wordpressUsername: true,
      wordpressPassword: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
  }

  // Check if WordPress is configured for this project
  // Return 200 with empty data to distinguish from actual errors
  if (!project.wordpressUrl || !project.wordpressUsername || !project.wordpressPassword) {
    return NextResponse.json({
      categories: [],
      posts: [],
      pages: [],
      tags: [],
      sitemap: null,
    });
  }

  const config = {
    siteUrl: project.wordpressUrl,
    username: project.wordpressUsername,
    applicationPassword: project.wordpressPassword,
  };

  console.log(`[WordPress Site Data] Loading data for project: ${project.name}`);

  // Fetch data in parallel for better performance
  const [categories, postsResponse, pagesResponse, tagsResponse, sitemapData] = await Promise.allSettled([
    // Fetch categories
    fetchWordPressCategories(config),
    
    // Fetch posts
    fetch(`${config.siteUrl}/wp-json/wp/v2/posts?per_page=100&_fields=id,title,link,excerpt,status`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.username}:${config.applicationPassword}`).toString('base64')}`,
      },
    }),
    
    // Fetch pages
    fetch(`${config.siteUrl}/wp-json/wp/v2/pages?per_page=100&_fields=id,title,link,excerpt,status`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.username}:${config.applicationPassword}`).toString('base64')}`,
      },
    }),
    
    // Fetch tags
    fetch(`${config.siteUrl}/wp-json/wp/v2/tags?per_page=100&_fields=id,name,slug`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.username}:${config.applicationPassword}`).toString('base64')}`,
      },
    }),
    
    // Load sitemap
    loadWordPressSitemap(project.websiteUrl || config.siteUrl, config.siteUrl),
  ]);

  // Process results
  const categoriesData = categories.status === 'fulfilled' ? categories.value : [];
  
  let postsData = [];
  if (postsResponse.status === 'fulfilled' && postsResponse.value.ok) {
    const posts = await postsResponse.value.json();
    postsData = posts.map((post: any) => ({
      id: post.id,
      title: post.title?.rendered || 'Untitled',
      link: post.link,
      excerpt: post.excerpt?.rendered ? stripHtmlTags(post.excerpt.rendered) : undefined,
      status: post.status,
    }));
  }
  
  let pagesData = [];
  if (pagesResponse.status === 'fulfilled' && pagesResponse.value.ok) {
    const pages = await pagesResponse.value.json();
    pagesData = pages.map((page: any) => ({
      id: page.id,
      title: page.title?.rendered || 'Untitled',
      link: page.link,
      excerpt: page.excerpt?.rendered ? stripHtmlTags(page.excerpt.rendered) : undefined,
      status: page.status,
    }));
  }
  
  let tagsData = [];
  if (tagsResponse.status === 'fulfilled' && tagsResponse.value.ok) {
    const tags = await tagsResponse.value.json();
    tagsData = tags.map((tag: any) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    }));
  }
  
  const sitemapResult = sitemapData.status === 'fulfilled' ? sitemapData.value : null;

  console.log(`[WordPress Site Data] Loaded: ${categoriesData.length} categories, ${postsData.length} posts, ${pagesData.length} pages, ${tagsData.length} tags, ${sitemapResult?.totalPages || 0} sitemap pages`);

  return NextResponse.json({
    categories: categoriesData,
    posts: postsData,
    pages: pagesData,
    tags: tagsData,
    sitemap: sitemapResult,
  });
}

/**
 * GET handler - accepts projectId as query parameter
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const projectId = request.nextUrl.searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is verplicht' }, { status: 400 });
    }

    return await loadWordPressData(request, projectId, session.user.email);
  } catch (error: any) {
    console.error('[WordPress Site Data] Error:', error);
    return NextResponse.json(
      { 
        error: 'Fout bij ophalen WordPress gegevens',
        details: error.message,
        categories: [],
        posts: [],
        pages: [],
        tags: [],
        sitemap: null,
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler - accepts projectId in body (for backward compatibility)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is verplicht' }, { status: 400 });
    }

    return await loadWordPressData(request, projectId, session.user.email);
  } catch (error: any) {
    console.error('[WordPress Site Data] Error:', error);
    return NextResponse.json(
      { 
        error: 'Fout bij ophalen WordPress gegevens',
        details: error.message,
        categories: [],
        posts: [],
        pages: [],
        tags: [],
        sitemap: null,
      },
      { status: 500 }
    );
  }
}
