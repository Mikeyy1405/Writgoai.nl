import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { writeArticle, generateFAQ } from '@/lib/content-hub/article-writer';
import { analyzeSERP, gatherSources } from '@/lib/content-hub/serp-analyzer';
import { generateFeaturedImage } from '@/lib/content-hub/image-generator';
import { findLinkOpportunities } from '@/lib/content-hub/internal-linker';
import { generateMetaTitle, generateMetaDescription, generateSlug, generateArticleSchema, generateYoastMeta } from '@/lib/content-hub/seo-optimizer';
import { autoSaveToLibrary } from '@/lib/content-library-helper';
import { getWordPressConfig, publishToWordPress } from '@/lib/wordpress-publisher';

/**
 * POST /api/content-hub/write-article
 * Generate a complete article with all SEO elements
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
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
      generateImages = true,
      includeFAQ = true,
      autoPublish = false,
    } = body;
    
    articleId = bodyArticleId;

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

    // Phase 4: Save to Content Library
    console.log('[Content Hub] Phase 4: Saving to Content Library');
    let savedContentId: string | null = null;
    try {
      const saveResult = await autoSaveToLibrary({
        clientId: article.site.clientId,
        type: 'blog',
        title: article.title,
        content: articleResult.content,
        contentHtml: articleResult.content, // Both content and contentHtml use same value as per codebase pattern
        metaDesc: metaDescription,
        thumbnailUrl: featuredImageUrl || undefined,
        keywords: article.keywords,
        tags: article.keywords,
        language: 'NL', // Consistent with 'nl' language used in SERP analysis and sources
      });

      if (saveResult.success && saveResult.contentId) {
        savedContentId = saveResult.contentId;
        console.log(`[Content Hub] Saved to library: ${savedContentId}`);
      } else if (saveResult.duplicate) {
        console.log(`[Content Hub] Duplicate detected, skipping save: ${saveResult.message}`);
      }
    } catch (error) {
      console.error('[Content Hub] Failed to save to library:', error);
      // Continue anyway - don't fail article generation if library save fails
    }

    // Phase 5: WordPress Auto-Publish (if enabled)
    let wordpressPublishResult: { id: number; link: string } | null = null;
    if (autoPublish) {
      console.log('[Content Hub] Phase 5: Auto-publishing to WordPress');
      try {
        // Get WordPress config for the site
        const wpConfig = await getWordPressConfig({
          clientEmail: client.email!,
        });

        if (wpConfig) {
          console.log('[Content Hub] WordPress config found, publishing...');
          
          // Publish to WordPress
          wordpressPublishResult = await publishToWordPress(wpConfig, {
            title: article.title,
            content: articleResult.content,
            excerpt: articleResult.excerpt || metaDescription,
            status: 'publish',
            tags: article.keywords,
            featuredImageUrl: featuredImageUrl || undefined,
            seoTitle: metaTitle,
            seoDescription: metaDescription,
            focusKeyword: article.keywords[0] || article.title,
            useGutenberg: true,
          });

          console.log(`[Content Hub] Published to WordPress: ${wordpressPublishResult.link}`);

          // Update article with WordPress info
          await prisma.contentHubArticle.update({
            where: { id: articleId },
            data: {
              status: 'published',
              wordpressPostId: wordpressPublishResult.id,
              wordpressUrl: wordpressPublishResult.link,
              publishedAt: new Date(),
            },
          });

          // Update saved content with published URL
          if (savedContentId) {
            await prisma.savedContent.update({
              where: { id: savedContentId },
              data: {
                publishedUrl: wordpressPublishResult.link,
                publishedAt: new Date(),
              },
            });
          }
        } else {
          console.log('[Content Hub] No WordPress config found for auto-publish');
          console.log('[Content Hub] Article ready but not published to WordPress');
          // Set status to published (content is generated, WordPress config is missing)
          await prisma.contentHubArticle.update({
            where: { id: articleId },
            data: { status: 'published' },
          });
        }
      } catch (error) {
        console.error('[Content Hub] WordPress publish failed:', error);
        // Set status to published even if WordPress publish fails
        await prisma.contentHubArticle.update({
          where: { id: articleId },
          data: { status: 'published' },
        });
      }
    }

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
        status: wordpressPublishResult ? 'published' : (autoPublish ? 'publishing' : 'published'),
        generationTime,
        wordpressUrl: wordpressPublishResult?.link,
        savedContentId,
      },
    });
  } catch (error: any) {
    console.error('[Content Hub] Article generation error:', error);
    
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
