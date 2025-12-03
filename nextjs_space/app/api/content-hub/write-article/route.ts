import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { writeArticle, generateFAQ } from '@/lib/content-hub/article-writer';
import { analyzeSERP, gatherSources } from '@/lib/content-hub/serp-analyzer';
import { generateFeaturedImage } from '@/lib/content-hub/image-generator';
import { findLinkOpportunities } from '@/lib/content-hub/internal-linker';
import { generateMetaTitle, generateMetaDescription, generateSlug, generateArticleSchema, generateYoastMeta } from '@/lib/content-hub/seo-optimizer';

/**
 * POST /api/content-hub/write-article
 * Generate a complete article with all SEO elements
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
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
      articleId,
      generateImages = true,
      includeFAQ = true,
      autoPublish = false,
    } = body;

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    // Get article
    const article = await prisma.contentHubArticle.findUnique({
      where: { id: articleId },
      include: {
        site: true,
      },
    });

    if (!article || article.site.clientId !== client.id) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Update status to researching
    await prisma.contentHubArticle.update({
      where: { id: articleId },
      data: { status: 'researching' },
    });

    console.log(`[Content Hub] Starting article generation: ${article.title}`);

    // Phase 1: Research
    console.log('[Content Hub] Phase 1: Research & Analysis');
    const serpAnalysis = await analyzeSERP(
      article.keywords[0] || article.title,
      'nl'
    );

    const sources = await gatherSources(article.title, 'nl');

    // Phase 2: Writing
    console.log('[Content Hub] Phase 2: Content Generation');
    await prisma.contentHubArticle.update({
      where: { id: articleId },
      data: { 
        status: 'writing',
        researchData: {
          serpAnalysis,
          sources,
        } as any,
      },
    });

    const articleResult = await writeArticle({
      title: article.title,
      keywords: article.keywords,
      targetWordCount: serpAnalysis.suggestedLength || 2000,
      tone: 'professional',
      language: 'nl',
      serpAnalysis,
      includeFAQ,
    });

    console.log(`[Content Hub] Generated ${articleResult.wordCount} words`);

    // Generate FAQ if requested and not included
    let faqSection = articleResult.faqSection;
    if (includeFAQ && !faqSection) {
      faqSection = await generateFAQ(article.title, 'nl');
    }

    // Phase 3: SEO & Images
    console.log('[Content Hub] Phase 3: SEO & Images');
    
    // Generate SEO metadata
    const metaTitle = generateMetaTitle(
      article.title,
      article.keywords[0] || article.title
    );
    const metaDescription = generateMetaDescription(
      articleResult.excerpt,
      article.keywords
    );
    const slug = generateSlug(article.title);

    // Generate featured image
    let featuredImageUrl = null;
    if (generateImages) {
      try {
        const featuredImage = await generateFeaturedImage(
          article.title,
          article.keywords,
          { useFreeStock: true }
        );
        featuredImageUrl = featuredImage.url;
      } catch (error) {
        console.error('[Content Hub] Featured image generation failed:', error);
      }
    }

    // Generate schema markup
    const schema = generateArticleSchema({
      title: article.title,
      excerpt: articleResult.excerpt,
      content: articleResult.content,
      imageUrl: featuredImageUrl || undefined,
    });

    // Save article
    const generationTime = Math.floor((Date.now() - startTime) / 1000);
    
    await prisma.contentHubArticle.update({
      where: { id: articleId },
      data: {
        status: autoPublish ? 'publishing' : 'published',
        content: articleResult.content,
        metaTitle,
        metaDescription,
        featuredImage: featuredImageUrl,
        wordCount: articleResult.wordCount,
        slug,
        faqSection: faqSection as any,
        schemaMarkup: schema as any,
        generationTime,
      },
    });

    console.log(`[Content Hub] Article completed in ${generationTime}s`);

    return NextResponse.json({
      success: true,
      message: 'Article generated successfully',
      article: {
        id: article.id,
        title: article.title,
        wordCount: articleResult.wordCount,
        metaTitle,
        metaDescription,
        slug,
        featuredImage: featuredImageUrl,
        status: autoPublish ? 'publishing' : 'published',
        generationTime,
      },
    });
  } catch (error: any) {
    console.error('[Content Hub] Article generation error:', error);
    
    // Update article status to failed
    const body = await req.json();
    if (body.articleId) {
      try {
        await prisma.contentHubArticle.update({
          where: { id: body.articleId },
          data: { status: 'failed' },
        });
      } catch (e) {
        console.error('Failed to update article status:', e);
      }
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to generate article' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/content-hub/write-article?articleId=xxx
 * Get article status and content
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

    const { searchParams } = new URL(req.url);
    const articleId = searchParams.get('articleId');

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
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

    const article = await prisma.contentHubArticle.findUnique({
      where: { id: articleId },
      include: {
        site: {
          select: {
            clientId: true,
            wordpressUrl: true,
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

    return NextResponse.json({
      article: {
        id: article.id,
        title: article.title,
        status: article.status,
        content: article.content,
        metaTitle: article.metaTitle,
        metaDescription: article.metaDescription,
        slug: article.slug,
        featuredImage: article.featuredImage,
        wordCount: article.wordCount,
        generationTime: article.generationTime,
        publishedAt: article.publishedAt,
        wordpressUrl: article.wordpressUrl,
      },
    });
  } catch (error: any) {
    console.error('[Content Hub] Failed to get article:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
