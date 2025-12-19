// Admin API voor het publiceren van content naar WordPress

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/admin/wordpress-publish
 * Publiceer gegenereerde content naar WordPress
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const {
      wordPressSiteId,
      title,
      content,
      status = 'publish', // draft, publish, pending
      keywords = [],
      metaDescription = '',
      focusKeyword = '',
      bolProducts = []
    } = body;
    
    // Validatie
    if (!wordPressSiteId || !title || !content) {
      return NextResponse.json(
        { error: 'WordPress site ID, title, and content are required' },
        { status: 400 }
      );
    }
    
    // Haal WordPress site op
    const site = await prisma.wordPressSite.findUnique({
      where: { id: wordPressSiteId }
    });
    
    if (!site) {
      return NextResponse.json({ error: 'WordPress site not found' }, { status: 404 });
    }
    
    if (!site.isActive) {
      return NextResponse.json({ error: 'WordPress site is not active' }, { status: 400 });
    }
    
    // Maak credentials voor WordPress REST API
    const credentials = Buffer.from(
      `${site.username}:${site.applicationPassword}`
    ).toString('base64');
    
    // Publiceer naar WordPress
    try {
      const wpResponse = await fetch(`${site.apiEndpoint}/wp/v2/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title,
          content: content,
          status: status,
          meta: {
            // Yoast SEO meta fields (als Yoast SEO plugin actief is)
            _yoast_wpseo_metadesc: metaDescription,
            _yoast_wpseo_focuskw: focusKeyword,
            _yoast_wpseo_meta_robots_noindex: '0',
            _yoast_wpseo_meta_robots_nofollow: '0'
          }
        })
      });
      
      if (!wpResponse.ok) {
        const errorText = await wpResponse.text();
        console.error('WordPress API error:', errorText);
        
        let errorMessage = 'Failed to publish to WordPress';
        if (wpResponse.status === 401) {
          errorMessage = 'WordPress authentication failed';
        } else if (wpResponse.status === 403) {
          errorMessage = 'Permission denied. Check WordPress user permissions.';
        }
        
        return NextResponse.json(
          { error: errorMessage, details: errorText.substring(0, 200) },
          { status: wpResponse.status }
        );
      }
      
      const wpData = await wpResponse.json();
      
      // Sla publicatie metadata op in database
      const publishedContent = await prisma.publishedContent.create({
        data: {
          wordPressSiteId: site.id,
          title,
          content: content,
          contentHtml: content,
          wordpressPostId: wpData.id,
          wordpressUrl: wpData.link,
          wordpressStatus: wpData.status,
          keywords,
          metaDescription,
          focusKeyword,
          bolProducts: bolProducts.length > 0 ? bolProducts : null,
          publishedBy: session.user.id || session.user.email || 'admin',
          publishMethod: 'manual',
          wordCount: countWords(content),
          publishedAt: new Date()
        }
      });
      
      return NextResponse.json({
        success: true,
        message: `Content successfully published to WordPress as ${wpData.status}`,
        wordpress: {
          id: wpData.id,
          url: wpData.link,
          status: wpData.status,
          date: wpData.date
        },
        published: {
          id: publishedContent.id,
          wordpressPostId: publishedContent.wordpressPostId,
          url: publishedContent.wordpressUrl
        }
      });
    } catch (fetchError: any) {
      console.error('WordPress fetch error:', fetchError);
      return NextResponse.json(
        { error: `Failed to connect to WordPress: ${fetchError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('WordPress publish error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to publish content' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/wordpress-publish
 * Haal gepubliceerde content op
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const publishedContent = await prisma.publishedContent.findMany({
      where: siteId ? { wordPressSiteId: siteId } : undefined,
      orderBy: { publishedAt: 'desc' },
      take: limit,
      include: {
        wordPressSite: {
          select: {
            id: true,
            name: true,
            url: true
          }
        }
      }
    });
    
    return NextResponse.json({ publishedContent });
  } catch (error) {
    console.error('Failed to fetch published content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch published content' },
      { status: 500 }
    );
  }
}

/**
 * Tel woorden in content
 */
function countWords(text: string): number {
  const plainText = text.replace(/<[^>]*>/g, '').trim();
  return plainText.split(/\s+/).filter(word => word.length > 0).length;
}
