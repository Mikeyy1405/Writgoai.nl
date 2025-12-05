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
import { publishToWordPress, getWordPressConfig } from '@/lib/wordpress-publisher';

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
    
    let serpAnalysis;
    try {
      serpAnalysis = await analyzeSERP(
        article.keywords[0] || article.title,
        'nl'
      );
      console.log('[Content Hub] SERP analysis voltooid');
    } catch (error: any) {
      console.error('[Content Hub] SERP analysis failed, using defaults:', error);
      // Use default analysis if SERP analysis fails
      serpAnalysis = {
        keyword: article.keywords[0] || article.title,
        topResults: [],
        averageWordCount: 2000,
        commonHeadings: ['Introductie', 'Voordelen', 'Nadelen', 'Tips', 'Conclusie'],
        topicsCovered: [article.keywords[0] || article.title],
        questionsFound: [],
        contentGaps: [],
        suggestedLength: 2400,
      };
    }

    let sources;
    try {
      sources = await gatherSources(article.title, 'nl');
      console.log('[Content Hub] Bronnen verzameld');
    } catch (error: any) {
      console.error('[Content Hub] Source gathering failed:', error);
      sources = { sources: [], insights: [] };
    }

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

    let articleResult;
    try {
      articleResult = await writeArticle({
        title: article.title,
        keywords: article.keywords,
        targetWordCount: serpAnalysis.suggestedLength || 2000,
        tone: 'professional',
        language: 'nl',
        serpAnalysis,
        includeFAQ,
      });

      console.log(`[Content Hub] Generated ${articleResult.wordCount} words`);
    } catch (writeError: any) {
      console.error('[Content Hub] Article writing failed:', writeError);
      
      // Update article status to failed
      await prisma.contentHubArticle.update({
        where: { id: articleId },
        data: { status: 'failed' },
      });
      
      return NextResponse.json(
        { error: writeError.message || 'Het schrijven van het artikel is mislukt' },
        { status: 500 }
      );
    }

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
    
    // First update with generated content
    await prisma.contentHubArticle.update({
      where: { id: articleId },
      data: {
        status: 'published',
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

    // Save to Content Library
    console.log('[Content Hub] Saving to Content Library...');
    
    const saveResult = await autoSaveToLibrary({
      clientId: client.id,
      type: 'blog',
      title: article.title,
      content: articleResult.content,
      contentHtml: articleResult.content, // Both are HTML in this case
      category: 'blog',
      tags: article.keywords,
      description: articleResult.excerpt,
      keywords: article.keywords,
      metaDesc: metaDescription,
      slug,
      thumbnailUrl: featuredImageUrl || undefined,
    });

    // Link contentId back to ContentHubArticle
    if (saveResult.success && saveResult.contentId) {
      try {
        await prisma.contentHubArticle.update({
          where: { id: articleId },
          data: { contentId: saveResult.contentId },
        });
        console.log(`[Content Hub] Content saved to library with ID: ${saveResult.contentId}`);
      } catch (contentIdError) {
        console.error('[Content Hub] Failed to link contentId (migration may not be applied):', contentIdError);
        // Don't throw - content is saved, just not linked
      }
    }

    // Auto-publish to WordPress if enabled
    let wordpressUrl: string | null = null;
    let wordpressPostId: number | null = null;

    if (autoPublish) {
      try {
        console.log('[Content Hub] Auto-publishing to WordPress...');
        
        // Get WordPress config for the site
        const wpConfig = await getWordPressConfig({
          clientEmail: session.user.email,
        });

        if (wpConfig && wpConfig.siteUrl && wpConfig.username && wpConfig.applicationPassword) {
          const publishResult = await publishToWordPress(
            wpConfig,
            {
              title: article.title,
              content: articleResult.content,
              excerpt: articleResult.excerpt,
              status: 'publish',
              tags: article.keywords,
              featuredImageUrl: featuredImageUrl || undefined,
              seoTitle: metaTitle,
              seoDescription: metaDescription,
              focusKeyword: article.keywords[0] || article.title,
              useGutenberg: true,
            }
          );

          wordpressUrl = publishResult.link;
          wordpressPostId = publishResult.id;

          // Update ContentHubArticle with WordPress info
          await prisma.contentHubArticle.update({
            where: { id: articleId },
            data: {
              wordpressPostId,
              wordpressUrl,
              publishedAt: new Date(),
            },
          });

          // Update SavedContent with WordPress info (separate try-catch)
          if (saveResult.contentId) {
            try {
              await prisma.savedContent.update({
                where: { id: saveResult.contentId },
                data: {
                  publishedUrl: wordpressUrl,
                  publishedAt: new Date(),
                },
              });
            } catch (updateError) {
              console.error('[Content Hub] Failed to update SavedContent with WordPress info:', updateError);
              // Don't throw - WordPress publish was successful
            }
          }

          console.log(`[Content Hub] Published to WordPress: ${wordpressUrl}`);
        } else {
          console.log('[Content Hub] WordPress credentials not configured, skipping auto-publish');
        }
      } catch (wpError: any) {
        console.error('[Content Hub] WordPress publish error:', wpError);
        console.log('[Content Hub] Content is saved in library, but WordPress publish failed');
        // Don't throw - content is already saved
      }
    }

    return NextResponse.json({
      success: true,
      message: autoPublish && wordpressUrl 
        ? 'Article generated and published to WordPress'
        : 'Article generated successfully',
      article: {
        id: article.id,
        title: article.title,
        wordCount: articleResult.wordCount,
        metaTitle,
        metaDescription,
        slug,
        featuredImage: featuredImageUrl,
        status: 'published',
        generationTime,
        contentId: saveResult.contentId || null,
        wordpressUrl,
        wordpressPostId,
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
