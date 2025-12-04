import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { WordPressClient } from '@/lib/content-hub/wordpress-client';

/**
 * POST /api/content-hub/connect-wordpress
 * Connect and test WordPress site credentials
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find or create client
    let client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    // Auto-create client if not found
    if (!client) {
      client = await prisma.client.create({
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email,
          password: '', // Empty password - user authenticated via NextAuth
        },
      });
    }

    const body = await req.json();
    const { wordpressUrl, username, applicationPassword } = body;

    if (!wordpressUrl || !username || !applicationPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Test connection
    const wpClient = new WordPressClient({
      siteUrl: wordpressUrl,
      username,
      applicationPassword,
    });

    const testResult = await wpClient.testConnection();

    if (!testResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: testResult.message 
        },
        { status: 400 }
      );
    }

    // Get existing pages count
    let existingPages = 0;
    try {
      const posts = await wpClient.getPosts({ per_page: 1 });
      existingPages = posts.total;
    } catch (error) {
      console.error('Failed to get posts count:', error);
    }

    // Save or update site configuration
    const existingSite = await prisma.contentHubSite.findFirst({
      where: {
        clientId: client.id,
        wordpressUrl,
      },
    });

    // TODO: SECURITY - Implement encryption for WordPress application passwords before production
    // Consider using a library like 'crypto' to encrypt passwords before storing
    // and decrypt when retrieving for API calls
    const siteData = {
      wordpressUrl,
      wordpressUsername: username,
      wordpressAppPassword: applicationPassword,
      isConnected: true,
      lastSyncedAt: new Date(),
      existingPages,
      niche: testResult.siteInfo?.description || null,
    };

    let site;
    if (existingSite) {
      site = await prisma.contentHubSite.update({
        where: { id: existingSite.id },
        data: siteData,
      });
    } else {
      site = await prisma.contentHubSite.create({
        data: {
          ...siteData,
          clientId: client.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'WordPress connected successfully',
      site: {
        id: site.id,
        wordpressUrl: site.wordpressUrl,
        isConnected: site.isConnected,
        existingPages: site.existingPages,
        siteInfo: testResult.siteInfo,
      },
    });
  } catch (error: any) {
    console.error('[Content Hub] WordPress connection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect WordPress' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/content-hub/connect-wordpress
 * Get connected WordPress sites for current client
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find or create client
    let client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        contentHubSites: {
          select: {
            id: true,
            wordpressUrl: true,
            isConnected: true,
            lastSyncedAt: true,
            existingPages: true,
            authorityScore: true,
            niche: true,
            totalArticles: true,
            completedArticles: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    // Auto-create client if not found
    if (!client) {
      client = await prisma.client.create({
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email,
          password: '', // Empty password - user authenticated via NextAuth
          contentHubSites: {
            create: [],
          },
        },
        include: {
          contentHubSites: {
            select: {
              id: true,
              wordpressUrl: true,
              isConnected: true,
              lastSyncedAt: true,
              existingPages: true,
              authorityScore: true,
              niche: true,
              totalArticles: true,
              completedArticles: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
    }

    return NextResponse.json({
      sites: client.contentHubSites,
    });
  } catch (error: any) {
    console.error('[Content Hub] Failed to get sites:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sites' },
      { status: 500 }
    );
  }
}
