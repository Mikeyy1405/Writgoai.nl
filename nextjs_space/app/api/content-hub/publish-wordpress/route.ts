import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { publishToWordPressEnhanced } from '@/lib/wordpress-publisher-enhanced';

/**
 * POST /api/content-hub/publish-wordpress
 * Publish article to WordPress
 */
export async function POST(req: NextRequest) {
  let articleId: string | undefined;
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { 
      articleId: bodyArticleId,
      status = 'publish', // 'publish' or 'draft'
      scheduledDate,
    } = body;
    
    articleId = bodyArticleId;

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    // Get article with site and project
    const article = await prisma.contentHubArticle.findUnique({
      where: { id: articleId },
      include: {
        site: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!article || article.site.clientId !== client.id) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    if (!article.content) {
      return NextResponse.json(
        { error: 'Article has no content to publish' },
        { status: 400 }
      );
    }

    // Check WordPress configuration - prefer Project configuration if complete
    let wpSiteUrl: string | null = null;
    let wpUsername: string | null = null;
    let wpAppPassword: string | null = null;
    let configSource = 'none';
    
    // First, try to use Project credentials if available and complete (unified WordPress configuration)
    if (article.site.project) {
      const project = article.site.project;
      if (project.wordpressUrl && project.wordpressUsername && project.wordpressPassword) {
        console.log('[Content Hub] Using WordPress credentials from linked Project (preferred)');
        wpSiteUrl = project.wordpressUrl;
        wpUsername = project.wordpressUsername;
        wpAppPassword = project.wordpressPassword;
        configSource = 'Project';
      }
    }
    
    // Fallback to ContentHubSite configuration if Project doesn't have complete WordPress configuration
    if (!wpSiteUrl || !wpUsername || !wpAppPassword) {
      if (article.site.isConnected && article.site.wordpressUrl && article.site.wordpressUsername && article.site.wordpressAppPassword) {
        console.log('[Content Hub] Using ContentHubSite WordPress credentials (fallback)');
        wpSiteUrl = article.site.wordpressUrl;
        wpUsername = article.site.wordpressUsername;
        wpAppPassword = article.site.wordpressAppPassword;
        configSource = 'ContentHubSite';
      }
    }
    
    if (!wpSiteUrl || !wpUsername || !wpAppPassword) {
      return NextResponse.json(
        { error: 'Geen website configuratie gevonden. Configureer WordPress in je Project instellingen.' },
        { status: 400 }
      );
    }
    
    console.log(`[Content Hub] Using WordPress configuration from: ${configSource}`);

    console.log(`[Content Hub] Publishing article to WordPress: ${article.title}`);

    // Update status
    await prisma.contentHubArticle.update({
      where: { id: articleId },
      data: { status: 'publishing' },
    });

    // Initialize WordPress client with fallback credentials
    const wpClient = new WordPressClient({
      siteUrl: wpSiteUrl,
      username: wpUsername || '',
      applicationPassword: wpAppPassword,
    });

    // Upload featured image if exists
    let featuredMediaId;
    if (article.featuredImage) {
      try {
        const media = await wpClient.uploadMedia(
          article.featuredImage,
          `${article.slug || 'article'}-featured.jpg`
        );
        featuredMediaId = media.id;
        console.log(`[Content Hub] Uploaded featured image: ${media.id}`);
      } catch (error) {
        console.error('[Content Hub] Featured image upload failed:', error);
      }
    }

    // Get or create category
    let categoryId;
    try {
      categoryId = await wpClient.getOrCreateCategory(article.cluster);
      console.log(`[Content Hub] Category ID: ${categoryId}`);
    } catch (error) {
      console.error('[Content Hub] Category creation failed:', error);
    }

    // Prepare meta fields for Yoast/RankMath
    const yoastMeta = article.metaTitle && article.metaDescription
      ? generateYoastMeta({
          metaTitle: article.metaTitle,
          metaDescription: article.metaDescription,
          focusKeyword: article.keywords[0] || article.title,
          schema: article.schemaMarkup as any,
        })
      : {};

    // Create WordPress post
    const wpPost = await wpClient.createPost({
      title: article.title,
      content: article.content,
      excerpt: article.metaDescription || '',
      status: status as 'publish' | 'draft',
      featured_media: featuredMediaId,
      categories: categoryId ? [categoryId] : undefined,
      tags: article.keywords,
      meta: yoastMeta,
      date: scheduledDate || undefined,
    });

    console.log(`[Content Hub] Published to WordPress: ${wpPost.link}`);

    // Update article in database
    await prisma.contentHubArticle.update({
      where: { id: articleId },
      data: {
        status: 'published',
        wordpressPostId: wpPost.id,
        wordpressUrl: wpPost.link,
        publishedAt: new Date(),
      },
    });

    // Update site completed articles count
    await prisma.contentHubSite.update({
      where: { id: article.siteId },
      data: {
        completedArticles: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Article published successfully',
      wordpress: {
        postId: wpPost.id,
        url: wpPost.link,
        status: wpPost.status,
      },
    });
  } catch (error: any) {
    console.error('[Content Hub] Publishing error:', error);
    
    // Update article status to failed
    if (articleId) {
      try {
        await prisma.contentHubArticle.update({
          where: { id: articleId },
          data: { status: 'failed' },
        });
      } catch (e) {
        console.error('Failed to update article status:', e);
      }
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to publish to WordPress' },
      { status: 500 }
    );
  }
}
