import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/content-hub/wordpress-posts/[id]
 * Fetch a specific WordPress post
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is verplicht' },
        { status: 400 }
      );
    }

    // Get site
    const site = await prisma.contentHubSite.findUnique({
      where: { id: siteId },
    });

    if (!site || site.clientId !== client.id) {
      return NextResponse.json(
        { error: 'Site niet gevonden' },
        { status: 404 }
      );
    }

    if (!site.isConnected || !site.wordpressUsername || !site.wordpressAppPassword) {
      return NextResponse.json(
        { error: 'WordPress niet verbonden' },
        { status: 400 }
      );
    }

    // Fetch specific post from WordPress
    const auth = Buffer.from(`${site.wordpressUsername}:${site.wordpressAppPassword}`).toString('base64');
    const wpUrl = site.wordpressUrl.replace(/\/$/, '');
    
    try {
      const endpoint = `${wpUrl}/wp-json/wp/v2/posts/${params.id}?_embed=1`;
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
        signal: AbortSignal.timeout(15000),
      });

      if (response.status === 404) {
        // Try alternative format
        const altEndpoint = `${wpUrl}/?rest_route=/wp/v2/posts/${params.id}&_embed=1`;
        const altResponse = await fetch(altEndpoint, {
          headers: {
            'Authorization': `Basic ${auth}`,
          },
          signal: AbortSignal.timeout(15000),
        });
        
        if (!altResponse.ok) {
          throw new Error(`WordPress post niet gevonden`);
        }
        
        const post = await altResponse.json();
        return NextResponse.json({
          success: true,
          post: transformPost(post),
        });
      }

      if (!response.ok) {
        throw new Error(`WordPress API fout: ${response.status}`);
      }

      const post = await response.json();

      return NextResponse.json({
        success: true,
        post: transformPost(post),
      });
    } catch (error: any) {
      console.error('[WordPress Posts] Fetch error:', error);
      return NextResponse.json(
        { error: error.message || 'Kon WordPress post niet ophalen' },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error('[WordPress Posts] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/content-hub/wordpress-posts/[id]
 * Update a WordPress post
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { siteId, title, content, excerpt, metaDescription } = body;

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is verplicht' },
        { status: 400 }
      );
    }

    // Get site
    const site = await prisma.contentHubSite.findUnique({
      where: { id: siteId },
    });

    if (!site || site.clientId !== client.id) {
      return NextResponse.json(
        { error: 'Site niet gevonden' },
        { status: 404 }
      );
    }

    if (!site.isConnected || !site.wordpressUsername || !site.wordpressAppPassword) {
      return NextResponse.json(
        { error: 'WordPress niet verbonden' },
        { status: 400 }
      );
    }

    // Update post in WordPress
    const auth = Buffer.from(`${site.wordpressUsername}:${site.wordpressAppPassword}`).toString('base64');
    const wpUrl = site.wordpressUrl.replace(/\/$/, '');
    
    try {
      const updateData: any = {};
      if (title) updateData.title = title;
      if (content) updateData.content = content;
      if (excerpt) updateData.excerpt = excerpt;
      
      // Update Yoast meta description if provided
      if (metaDescription) {
        updateData.yoast_meta = {
          yoast_wpseo_metadesc: metaDescription,
        };
      }

      const endpoint = `${wpUrl}/wp-json/wp/v2/posts/${params.id}`;
      const response = await fetch(endpoint, {
        method: 'POST', // WordPress REST API uses POST for updates
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
        signal: AbortSignal.timeout(30000), // 30 second timeout for updates
      });

      if (response.status === 404) {
        // Try alternative format
        const altEndpoint = `${wpUrl}/?rest_route=/wp/v2/posts/${params.id}`;
        const altResponse = await fetch(altEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
          signal: AbortSignal.timeout(30000),
        });
        
        if (!altResponse.ok) {
          const errorText = await altResponse.text();
          throw new Error(`WordPress update mislukt: ${errorText}`);
        }
        
        const updatedPost = await altResponse.json();
        return NextResponse.json({
          success: true,
          message: 'Post succesvol bijgewerkt',
          post: transformPost(updatedPost),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`WordPress update mislukt: ${errorText}`);
      }

      const updatedPost = await response.json();

      return NextResponse.json({
        success: true,
        message: 'Post succesvol bijgewerkt',
        post: transformPost(updatedPost),
      });
    } catch (error: any) {
      console.error('[WordPress Posts] Update error:', error);
      return NextResponse.json(
        { error: error.message || 'Kon WordPress post niet bijwerken' },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error('[WordPress Posts] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}

// Helper function to transform WordPress post
function transformPost(post: any) {
  // Extract featured image URL
  let featuredImage = null;
  if (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
    featuredImage = post._embedded['wp:featuredmedia'][0].source_url;
  }

  // Count words in content
  const plainText = post.content.rendered.replace(/<[^>]*>/g, ' ').trim();
  const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;

  // Extract meta description from Yoast
  const metaDescription = post.yoast_head_json?.description || 
    post.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 160);

  return {
    id: post.id,
    title: post.title.rendered.replace(/<[^>]*>/g, ''),
    slug: post.slug,
    link: post.link,
    status: post.status,
    date: post.date,
    modified: post.modified,
    excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 200),
    content: post.content.rendered,
    wordCount,
    featuredImage,
    metaDescription,
    author: post._embedded?.author?.[0]?.name || 'Onbekend',
    categories: post._embedded?.['wp:term']?.[0]?.map((cat: any) => cat.name) || [],
  };
}
