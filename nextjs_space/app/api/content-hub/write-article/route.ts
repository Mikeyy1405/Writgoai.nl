import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { writeArticle, generateFAQ } from '@/lib/content-hub/article-writer';
import { analyzeSERP, gatherSources } from '@/lib/content-hub/serp-analyzer';
import { generateFeaturedImage, insertImagesInContent } from '@/lib/content-hub/image-generator';
import { findLinkOpportunities } from '@/lib/content-hub/internal-linker';
import { generateMetaTitle, generateMetaDescription, generateSlug, generateArticleSchema, generateYoastMeta } from '@/lib/content-hub/seo-optimizer';
import { autoSaveToLibrary } from '@/lib/content-library-helper';
import { publishToWordPress, getWordPressConfig } from '@/lib/wordpress-publisher';
import { searchBolcomProducts, getBolcomProductDetails, type BolcomCredentials } from '@/lib/bolcom-api';

// Set maximum duration for this route to 5 minutes to handle long AI operations
export const maxDuration = 300;

// Constants for article generation
const MIN_WORD_COUNT = 1000; // Minimum recommended word count
const MIN_TARGET_WORD_COUNT = 1200; // Minimum target word count for generation
const TARGET_IMAGE_COUNT = 7; // Target number of images per article

/**
 * Fetch sitemap URLs from a WordPress site
 */
async function fetchSitemapUrls(siteUrl: string): Promise<Array<{ url: string; title: string }>> {
  try {
    const sitemapUrl = `${siteUrl}/sitemap.xml`;
    console.log(`[Sitemap] Fetching from: ${sitemapUrl}`);
    
    const response = await fetch(sitemapUrl, {
      headers: {
        'User-Agent': 'WritgoAI Content Hub Bot',
      },
    });

    if (!response.ok) {
      console.warn(`[Sitemap] Failed to fetch: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    
    // Parse XML and extract URLs (simple regex for <loc> tags)
    const locMatches = xml.match(/<loc>(.*?)<\/loc>/g);
    if (!locMatches) {
      console.warn('[Sitemap] No URLs found in sitemap');
      return [];
    }

    const urls = locMatches
      .map(loc => loc.replace(/<\/?loc>/g, '').trim())
      .filter(url => url.startsWith('http'))
      .map(url => ({
        url,
        title: url.split('/').pop() || url, // Use last segment as title
      }))
      .slice(0, 50); // Limit to 50 URLs for performance

    console.log(`[Sitemap] Found ${urls.length} URLs`);
    return urls;
  } catch (error: any) {
    console.error('[Sitemap] Error fetching sitemap:', error.message);
    return [];
  }
}

/**
 * Generate HTML for Bol.com product boxes
 */
function generateBolcomProductBoxes(products: any[]): string {
  if (!products || products.length === 0) return '';

  return products.map(product => {
    const price = product.bestOffer?.price || product.offer?.price || 'N/A';
    const image = product.images?.[0]?.url || product.image?.url || '';
    const rating = product.rating || 0;
    const stars = '⭐'.repeat(Math.round(rating));

    return `
<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; margin: 2rem 0; background: #f9fafb;">
  <div style="display: flex; gap: 1.5rem; align-items: start;">
    ${image ? `<img src="${image}" alt="${product.title}" style="width: 150px; height: 150px; object-fit: contain; border-radius: 4px;" />` : ''}
    <div style="flex: 1;">
      <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem;">
        <a href="${product.affiliateLink || product.url}" target="_blank" rel="nofollow sponsored" style="color: #1d4ed8; text-decoration: none;">
          ${product.title}
        </a>
      </h3>
      ${product.description ? `<p style="margin: 0.5rem 0; color: #6b7280; font-size: 0.875rem;">${product.description.substring(0, 150)}...</p>` : ''}
      <div style="display: flex; gap: 1rem; align-items: center; margin-top: 1rem;">
        <span style="font-size: 1.5rem; font-weight: bold; color: #059669;">€${price}</span>
        ${rating > 0 ? `<span style="color: #f59e0b;">${stars} (${rating.toFixed(1)})</span>` : ''}
      </div>
      <a href="${product.affiliateLink || product.url}" target="_blank" rel="nofollow sponsored" 
         style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: #0066c0; color: white; text-decoration: none; border-radius: 4px; font-weight: 600;">
        Bekijk op Bol.com →
      </a>
    </div>
  </div>
</div>`;
  }).join('\n');
}

/**
 * Insert Bol.com products into content after H2 sections
 */
function insertBolcomProductsInContent(html: string, productBoxesHtml: string): string {
  if (!productBoxesHtml) return html;

  // Split content by H2 tags
  const h2Regex = /<h2/gi;
  const sections = html.split(h2Regex);
  
  if (sections.length <= 2) {
    // Not enough sections, append at end
    return html + '\n' + productBoxesHtml;
  }

  // Insert products after the 2nd or 3rd H2 section
  const insertPosition = Math.min(3, sections.length - 1);
  let result = sections[0];

  for (let i = 1; i < sections.length; i++) {
    result += '<h2' + sections[i];
    
    if (i === insertPosition) {
      result += '\n' + productBoxesHtml + '\n';
    }
  }

  return result;
}

/**
 * Handle streaming article generation with SSE updates
 */
async function handleStreamingGeneration(
  article: any,
  client: any,
  options: {
    generateImages: boolean;
    includeFAQ: boolean;
    autoPublish: boolean;
    startTime: number;
  }
) {
  const { generateImages, includeFAQ, autoPublish, startTime } = options;

  // Start streaming response
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  interface SSEUpdate {
    step: string;
    status: 'in-progress' | 'completed' | 'failed' | 'success';
    progress?: number;
    message?: string;
    error?: string;
    metrics?: {
      wordCount?: number;
      lsiKeywords?: number;
      paaQuestions?: number;
      images?: number;
    };
    result?: any;
  }

  const sendUpdate = async (data: SSEUpdate) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch (error) {
      console.error('[SSE] Failed to send update:', error);
    }
  };

  // Process in background
  (async () => {
    try {
      // Update status to researching
      await prisma.contentHubArticle.update({
        where: { id: article.id },
        data: { status: 'researching' },
      });

      console.log(`[Content Hub] Starting article generation: ${article.title}`);

      // Phase 1: SERP Analysis
      await sendUpdate({
        step: 'serp-analysis',
        status: 'in-progress',
        progress: 5,
        message: `Top 10 Google resultaten analyseren voor ${article.keywords[0] || article.title}...`,
      });

      console.log('[Content Hub] Phase 1: Research & Analysis');
      console.log('[Content Hub] Performing real SERP analysis with web search...');
      
      let serpAnalysis;
      try {
        serpAnalysis = await analyzeSERP(
          article.keywords[0] || article.title,
          'nl'
        );
        console.log(`[Content Hub] SERP analysis voltooid - Target: ${serpAnalysis.suggestedLength} words, ${serpAnalysis.lsiKeywords?.length || 0} LSI keywords, ${serpAnalysis.paaQuestions?.length || 0} PAA questions`);
        
        await sendUpdate({
          step: 'serp-analysis',
          status: 'completed',
          progress: 20,
          message: '✅ SERP analyse voltooid',
          metrics: {
            wordCount: serpAnalysis.suggestedLength,
            lsiKeywords: serpAnalysis.lsiKeywords?.length || 0,
            paaQuestions: serpAnalysis.paaQuestions?.length || 0,
          },
        });
      } catch (error: any) {
        console.error('[Content Hub] SERP analysis failed, using defaults:', error);
        // Use default analysis if SERP analysis fails
        serpAnalysis = {
          keyword: article.keywords[0] || article.title,
          topResults: [],
          averageWordCount: 1500,
          commonHeadings: ['Introductie', 'Wat is het?', 'Voordelen', 'Nadelen', 'Best Practices', 'Tips', 'Conclusie'],
          topicsCovered: [article.keywords[0] || article.title],
          questionsFound: [`Wat is ${article.keywords[0] || article.title}?`],
          contentGaps: ['Praktische voorbeelden', 'Actuele statistieken'],
          suggestedLength: 1400,
          lsiKeywords: [
            article.keywords[0] || article.title,
            `${article.keywords[0] || article.title} tips`,
            `beste ${article.keywords[0] || article.title}`,
            `${article.keywords[0] || article.title} voordelen`,
          ],
          paaQuestions: [
            `Wat is ${article.keywords[0] || article.title}?`,
            `Hoe werkt ${article.keywords[0] || article.title}?`,
            `Waarom is ${article.keywords[0] || article.title} belangrijk?`,
            `Wat zijn de voordelen van ${article.keywords[0] || article.title}?`,
          ],
        };
        
        await sendUpdate({
          step: 'serp-analysis',
          status: 'completed',
          progress: 20,
          message: '✅ SERP analyse voltooid (defaults)',
          metrics: {
            wordCount: serpAnalysis.suggestedLength,
          },
        });
      }

      let sources;
      try {
        sources = await gatherSources(article.title, 'nl');
        console.log('[Content Hub] Bronnen verzameld');
      } catch (error: any) {
        console.error('[Content Hub] Source gathering failed:', error);
        sources = { sources: [], insights: [] };
      }

      // Fetch sitemap for internal linking
      console.log('[Content Hub] Fetching sitemap for internal links...');
      const sitemapUrls = await fetchSitemapUrls(article.site.wordpressUrl);
      
      // Generate internal link suggestions
      let internalLinks: Array<{ url: string; anchorText: string }> = [];
      if (sitemapUrls.length > 0) {
        internalLinks = sitemapUrls.slice(0, 7).map(page => ({
          url: page.url,
          anchorText: page.title.replace(/-/g, ' ').replace(/\//g, ''),
        }));
        console.log(`[Content Hub] Found ${internalLinks.length} internal link opportunities`);
      }

      // Phase 2: Content Generation
      await sendUpdate({
        step: 'content-generation',
        status: 'in-progress',
        progress: 25,
        message: 'AI schrijft artikel...',
      });

      console.log('[Content Hub] Phase 2: Content Generation');
      await prisma.contentHubArticle.update({
        where: { id: article.id },
        data: { 
          status: 'writing',
          researchData: {
            serpAnalysis,
            sources,
            sitemapUrls: sitemapUrls.slice(0, 20),
          } as any,
        },
      });

      let articleResult;
      try {
        const serpWordCount = serpAnalysis.suggestedLength || 1400;
        const targetWordCount = Math.min(
          Math.max(serpWordCount, MIN_TARGET_WORD_COUNT),
          1500
        );
        
        console.log(`[Content Hub] ═══════════════════════════════════════════════════`);
        console.log(`[Content Hub] STARTING CONTENT GENERATION`);
        console.log(`[Content Hub] ═══════════════════════════════════════════════════`);
        console.log(`[Content Hub] Article: ${article.title}`);
        console.log(`[Content Hub] Target word count: ${targetWordCount} words (SERP suggested: ${serpWordCount})`);
        console.log(`[Content Hub] Model: Claude 4.5 Sonnet (claude-4-5-sonnet-2025)`);
        console.log(`[Content Hub] Timestamp: ${new Date().toISOString()}`);
        
        const contentStartTime = Date.now();
        
        // Start heartbeat to send periodic updates during long AI operation
        const heartbeatInterval = setInterval(async () => {
          try {
            const elapsed = Math.floor((Date.now() - contentStartTime) / 1000);
            console.log(`[Content Hub] ⏱️ Content generation in progress... ${elapsed}s elapsed`);
            await sendUpdate({
              step: 'content-generation',
              status: 'in-progress',
              progress: Math.min(25 + Math.floor(elapsed / 3), 55), // Gradually increase from 25% to 55%
              message: `AI schrijft artikel... (${elapsed}s)`,
            });
          } catch (heartbeatError) {
            // Log but don't throw - heartbeat failures shouldn't stop generation
            console.error('[Content Hub] Heartbeat update failed:', heartbeatError);
          }
        }, 15000); // Send update every 15 seconds
        
        try {
          articleResult = await writeArticle({
            title: article.title,
            keywords: article.keywords,
            targetWordCount,
            tone: 'professional',
            language: 'nl',
            serpAnalysis,
            internalLinks: internalLinks.length > 0 ? internalLinks : undefined,
            includeFAQ,
          });
        } finally {
          clearInterval(heartbeatInterval);
        }

        const contentDuration = Math.floor((Date.now() - contentStartTime) / 1000);
        console.log(`[Content Hub] ═══════════════════════════════════════════════════`);
        console.log(`[Content Hub] CONTENT GENERATION COMPLETED`);
        console.log(`[Content Hub] ═══════════════════════════════════════════════════`);
        console.log(`[Content Hub] Success! Generated ${articleResult.wordCount} words in ${contentDuration}s`);
        console.log(`[Content Hub] Timestamp: ${new Date().toISOString()}`);
        
        await sendUpdate({
          step: 'content-generation',
          status: 'completed',
          progress: 60,
          message: `✅ ${articleResult.wordCount} woorden gegenereerd`,
          metrics: {
            wordCount: articleResult.wordCount,
            lsiKeywords: serpAnalysis.lsiKeywords?.length || 18,
            paaQuestions: serpAnalysis.paaQuestions?.length || 6,
          },
        });
      } catch (writeError: any) {
        console.error('[Content Hub] ═══════════════════════════════════════════════════');
        console.error('[Content Hub] CONTENT GENERATION FAILED');
        console.error('[Content Hub] ═══════════════════════════════════════════════════');
        console.error('[Content Hub] Article:', article.title);
        console.error('[Content Hub] Error type:', writeError.name || 'Unknown');
        console.error('[Content Hub] Error message:', writeError.message);
        console.error('[Content Hub] Error stack:', writeError.stack);
        console.error('[Content Hub] Timestamp:', new Date().toISOString());
        
        // Check for specific error types using error properties and status codes
        let userFriendlyMessage = 'Het schrijven van het artikel is mislukt';
        const errorMessage = writeError.message?.toLowerCase() || '';
        const errorCode = writeError.code || writeError.status || writeError.response?.status;
        
        // Check by error code/status first (more reliable)
        if (errorCode === 429 || errorCode === 'ETIMEDOUT' || errorCode === 'ESOCKETTIMEDOUT') {
          if (errorCode === 429) {
            userFriendlyMessage = 'Te veel verzoeken. Wacht een moment en probeer opnieuw.';
            console.error('[Content Hub] Error cause: RATE LIMIT - Too many API requests (429)');
          } else {
            userFriendlyMessage = 'Het artikel schrijven duurde te lang. Probeer het later opnieuw.';
            console.error('[Content Hub] Error cause: TIMEOUT - AI call took too long');
          }
        } else if (errorCode === 502 || errorCode === 503 || errorCode === 504) {
          userFriendlyMessage = 'De AI service is tijdelijk niet beschikbaar. Probeer het over enkele minuten opnieuw.';
          console.error(`[Content Hub] Error cause: API UNAVAILABLE - Service error (${errorCode})`);
        } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          userFriendlyMessage = 'Het artikel schrijven duurde te lang. Probeer het later opnieuw.';
          console.error('[Content Hub] Error cause: TIMEOUT - AI call took too long');
        } else if (errorMessage.includes('rate limit')) {
          userFriendlyMessage = 'Te veel verzoeken. Wacht een moment en probeer opnieuw.';
          console.error('[Content Hub] Error cause: RATE LIMIT - Too many API requests');
        } else {
          console.error('[Content Hub] Error cause: UNKNOWN - See error details above');
        }
        
        await prisma.contentHubArticle.update({
          where: { id: article.id },
          data: { 
            status: 'failed',
            researchData: {
              error: writeError.message,
              errorType: writeError.name || 'Unknown',
              timestamp: new Date().toISOString(),
            } as any,
          },
        });
        
        await sendUpdate({
          step: 'content-generation',
          status: 'failed',
          progress: 60,
          message: userFriendlyMessage,
          error: writeError.message,
        });
        
        throw writeError;
      }

      // Generate FAQ if requested and not included
      let faqSection = articleResult.faqSection;
      if (includeFAQ && !faqSection) {
        faqSection = await generateFAQ(article.title, 'nl');
      }

      // Phase 3: SEO & Images
      await sendUpdate({
        step: 'seo-optimization',
        status: 'in-progress',
        progress: 65,
        message: generateImages ? 'Meta data optimaliseren en afbeeldingen genereren...' : 'SEO metadata optimaliseren...',
      });

      console.log('[Content Hub] Phase 3: SEO Optimization & Image Generation');
      
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

      // Generate images (featured + article images)
      let featuredImageUrl = null;
      let articleImages: any[] = [];
      
      if (generateImages) {
        try {
          console.log('[Content Hub] Generating featured image...');
          const featuredImage = await generateFeaturedImage(
            article.title,
            article.keywords,
            { useFreeStock: true }
          );
          featuredImageUrl = featuredImage.url;
          console.log('[Content Hub] Featured image generated successfully');
          
          // Generate additional article images
          console.log('[Content Hub] Searching for article images...');
          const { generateArticleImagesWithAltText } = await import('@/lib/content-hub/image-generator');
          
          articleImages = await generateArticleImagesWithAltText(
            article.title,
            articleResult.content,
            article.keywords,
            TARGET_IMAGE_COUNT
          );
          
          console.log(`[Content Hub] Generated ${articleImages.length} article images`);
          
          await sendUpdate({
            step: 'seo-optimization',
            status: 'completed',
            progress: 80,
            message: '✅ SEO & afbeeldingen geoptimaliseerd',
            metrics: {
              images: articleImages.length,
            },
          });
        } catch (error) {
          console.error('[Content Hub] Image generation failed:', error);
          await sendUpdate({
            step: 'seo-optimization',
            status: 'completed',
            progress: 80,
            message: '✅ SEO geoptimaliseerd (afbeeldingen overgeslagen)',
          });
        }
      } else {
        await sendUpdate({
          step: 'seo-optimization',
          status: 'completed',
          progress: 80,
          message: '✅ SEO metadata geoptimaliseerd',
        });
      }

      // Phase 4: Enhance content with images and products
      console.log('[Content Hub] Phase 4: Enhancing content with images and products');
      let enhancedContent = articleResult.content;

      // Insert images into content
      if (articleImages.length > 0) {
        console.log(`[Content Hub] Inserting ${articleImages.length} images into content...`);
        enhancedContent = insertImagesInContent(enhancedContent, articleImages);
      }

      // Try to add Bol.com products if client has credentials
      try {
        const bolcomProject = await prisma.project.findFirst({
          where: {
            clientId: client.id,
            bolcomEnabled: true,
            bolcomClientId: { not: null },
            bolcomClientSecret: { not: null },
          },
          select: {
            bolcomClientId: true,
            bolcomClientSecret: true,
            bolcomAffiliateId: true,
          },
        });

        if (bolcomProject?.bolcomClientId && bolcomProject?.bolcomClientSecret) {
          console.log('[Content Hub] Searching for Bol.com products...');
          
          const bolcomCredentials: BolcomCredentials = {
            clientId: bolcomProject.bolcomClientId,
            clientSecret: bolcomProject.bolcomClientSecret,
            affiliateId: bolcomProject.bolcomAffiliateId || undefined,
          };

          const searchResults = await searchBolcomProducts(
            article.keywords[0] || article.title,
            bolcomCredentials,
            {
              resultsPerPage: 3,
              countryCode: 'NL',
            }
          );

          if (searchResults.results.length > 0) {
            console.log(`[Content Hub] Found ${searchResults.results.length} Bol.com products`);
            
            const productDetails = await Promise.all(
              searchResults.results.slice(0, 3).map(p =>
                getBolcomProductDetails(p.ean, bolcomCredentials).catch(() => null)
              )
            );

            const validProducts = productDetails.filter(p => p !== null);
            
            if (validProducts.length > 0) {
              const productBoxesHtml = generateBolcomProductBoxes(validProducts);
              enhancedContent = insertBolcomProductsInContent(enhancedContent, productBoxesHtml);
              console.log(`[Content Hub] Added ${validProducts.length} Bol.com product boxes to content`);
            }
          }
        }
      } catch (bolcomError: any) {
        console.error('[Content Hub] Bol.com integration error:', bolcomError.message);
      }

      // Generate schema markup
      const schema = generateArticleSchema({
        title: article.title,
        excerpt: articleResult.excerpt,
        content: enhancedContent,
        imageUrl: featuredImageUrl || undefined,
      });

      // Save article
      const generationTime = Math.floor((Date.now() - startTime) / 1000);
      
      await prisma.contentHubArticle.update({
        where: { id: article.id },
        data: {
          status: 'published',
          content: enhancedContent,
          metaTitle,
          metaDescription,
          featuredImage: featuredImageUrl,
          wordCount: articleResult.wordCount,
          slug,
          faqSection: faqSection as any,
          schemaMarkup: schema as any,
          generationTime,
          researchData: {
            serpAnalysis,
            sources,
            articleImages: articleImages.map(img => ({
              url: img.url,
              altText: img.altText,
              filename: img.filename,
              source: img.source,
            })),
            imageCount: articleImages.length,
          } as any,
        },
      });

      // Phase 5: Save to Content Library
      await sendUpdate({
        step: 'saving',
        status: 'in-progress',
        progress: 85,
        message: 'Content opslaan in bibliotheek...',
      });

      console.log('[Content Hub] Saving to Content Library...');
      
      const saveResult = await autoSaveToLibrary({
        clientId: client.id,
        type: 'blog',
        title: article.title,
        content: enhancedContent,
        contentHtml: enhancedContent,
        category: 'blog',
        tags: article.keywords,
        description: articleResult.excerpt,
        keywords: article.keywords,
        metaDesc: metaDescription,
        slug,
        thumbnailUrl: featuredImageUrl || undefined,
      });

      if (saveResult.success && saveResult.contentId) {
        try {
          await prisma.contentHubArticle.update({
            where: { id: article.id },
            data: { contentId: saveResult.contentId },
          });
          console.log(`[Content Hub] Content saved to library with ID: ${saveResult.contentId}`);
        } catch (contentIdError) {
          console.error('[Content Hub] Failed to link contentId:', contentIdError);
        }
      }

      // Phase 6: Auto-publish to WordPress if enabled
      let wordpressUrl: string | null = null;
      let wordpressPostId: number | null = null;

      if (autoPublish) {
        await sendUpdate({
          step: 'publishing',
          status: 'in-progress',
          progress: 90,
          message: 'Publiceren naar WordPress...',
        });

        try {
          console.log('[Content Hub] Auto-publishing to WordPress...');
          
          const wpConfig = await getWordPressConfig({
            clientEmail: client.email,
          });

          if (wpConfig && wpConfig.siteUrl && wpConfig.username && wpConfig.applicationPassword) {
            const publishResult = await publishToWordPress(
              wpConfig,
              {
                title: article.title,
                content: enhancedContent,
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

            await prisma.contentHubArticle.update({
              where: { id: article.id },
              data: {
                wordpressPostId,
                wordpressUrl,
                publishedAt: new Date(),
              },
            });

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
                console.error('[Content Hub] Failed to update SavedContent:', updateError);
              }
            }

            console.log(`[Content Hub] Published to WordPress: ${wordpressUrl}`);
            
            await sendUpdate({
              step: 'publishing',
              status: 'completed',
              progress: 100,
              message: '✅ Gepubliceerd naar WordPress',
            });
          } else {
            console.log('[Content Hub] WordPress credentials not configured');
            await sendUpdate({
              step: 'publishing',
              status: 'completed',
              progress: 100,
              message: '✅ Content opgeslagen in bibliotheek',
            });
          }
        } catch (wpError: any) {
          console.error('[Content Hub] WordPress publish error:', wpError);
          await sendUpdate({
            step: 'publishing',
            status: 'completed',
            progress: 100,
            message: '✅ Content opgeslagen (WordPress publicatie mislukt)',
          });
        }
      } else {
        await sendUpdate({
          step: 'saving',
          status: 'completed',
          progress: 100,
          message: '✅ Content opgeslagen in bibliotheek',
        });
      }

      console.log(`[Content Hub] Article completed in ${generationTime}s`);

      // Send final completion update
      await sendUpdate({
        step: 'complete',
        status: 'success',
        progress: 100,
        message: autoPublish && wordpressUrl 
          ? 'Article generated and published to WordPress'
          : 'Article generated successfully',
        result: {
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
            imageCount: articleImages.length,
            lsiKeywords: serpAnalysis.lsiKeywords?.length || 0,
            paaQuestions: serpAnalysis.paaQuestions?.length || 0,
          },
        },
      });
    } catch (error: any) {
      console.error('[Content Hub] Streaming generation error:', error);
      
      if (article?.id) {
        try {
          await prisma.contentHubArticle.update({
            where: { id: article.id },
            data: { status: 'failed' },
          });
        } catch (e) {
          console.error('[Content Hub] Secondary failure: Failed to update article status during error handling:', e);
        }
      }

      await sendUpdate({
        step: 'error',
        status: 'failed',
        error: error.message || 'Failed to generate article',
        message: error.message || 'Het genereren van het artikel is mislukt',
      });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * POST /api/content-hub/write-article
 * Generate a complete article with all SEO elements
 * Supports both SSE streaming and traditional JSON response
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
      streamUpdates = false, // New parameter to enable SSE streaming
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

    // If streaming is requested, use SSE
    if (streamUpdates) {
      return handleStreamingGeneration(article, client, {
        generateImages,
        includeFAQ,
        autoPublish,
        startTime,
      });
    }

    // Otherwise, use traditional approach (backward compatibility)
    // Update status to researching
    await prisma.contentHubArticle.update({
      where: { id: articleId },
      data: { status: 'researching' },
    });

    console.log(`[Content Hub] Starting article generation: ${article.title}`);

    // Phase 1: Research & SERP Analysis
    console.log('[Content Hub] Phase 1: Research & Analysis');
    console.log('[Content Hub] Performing real SERP analysis with web search...');
    
    let serpAnalysis;
    try {
      serpAnalysis = await analyzeSERP(
        article.keywords[0] || article.title,
        'nl'
      );
      console.log(`[Content Hub] SERP analysis voltooid - Target: ${serpAnalysis.suggestedLength} words, ${serpAnalysis.lsiKeywords?.length || 0} LSI keywords, ${serpAnalysis.paaQuestions?.length || 0} PAA questions`);
    } catch (error: any) {
      console.error('[Content Hub] SERP analysis failed, using defaults:', error);
      // Use default analysis if SERP analysis fails
      serpAnalysis = {
        keyword: article.keywords[0] || article.title,
        topResults: [],
        averageWordCount: 1500,
        commonHeadings: ['Introductie', 'Wat is het?', 'Voordelen', 'Nadelen', 'Best Practices', 'Tips', 'Conclusie'],
        topicsCovered: [article.keywords[0] || article.title],
        questionsFound: [`Wat is ${article.keywords[0] || article.title}?`],
        contentGaps: ['Praktische voorbeelden', 'Actuele statistieken'],
        suggestedLength: 1400,
        lsiKeywords: [
          article.keywords[0] || article.title,
          `${article.keywords[0] || article.title} tips`,
          `beste ${article.keywords[0] || article.title}`,
          `${article.keywords[0] || article.title} voordelen`,
        ],
        paaQuestions: [
          `Wat is ${article.keywords[0] || article.title}?`,
          `Hoe werkt ${article.keywords[0] || article.title}?`,
          `Waarom is ${article.keywords[0] || article.title} belangrijk?`,
          `Wat zijn de voordelen van ${article.keywords[0] || article.title}?`,
        ],
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

    // Fetch sitemap for internal linking
    console.log('[Content Hub] Fetching sitemap for internal links...');
    const sitemapUrls = await fetchSitemapUrls(article.site.wordpressUrl);
    
    // Generate internal link suggestions
    let internalLinks: Array<{ url: string; anchorText: string }> = [];
    if (sitemapUrls.length > 0) {
      // Select top 5-7 relevant URLs for internal linking
      internalLinks = sitemapUrls.slice(0, 7).map(page => ({
        url: page.url,
        anchorText: page.title.replace(/-/g, ' ').replace(/\//g, ''),
      }));
      console.log(`[Content Hub] Found ${internalLinks.length} internal link opportunities`);
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
          sitemapUrls: sitemapUrls.slice(0, 20), // Store first 20 for reference
        } as any,
      },
    });

    let articleResult;
    try {
      // Ensure word count is between 1200-1500 words based on SERP
      const serpWordCount = serpAnalysis.suggestedLength || 1400;
      const targetWordCount = Math.min(
        Math.max(serpWordCount, MIN_TARGET_WORD_COUNT),
        1500 // Cap at 1500 to avoid too long articles
      );
      
      console.log(`[Content Hub] Starting content generation - Target: ${targetWordCount} words (SERP suggested: ${serpWordCount})`);
      
      articleResult = await writeArticle({
        title: article.title,
        keywords: article.keywords,
        targetWordCount,
        tone: 'professional',
        language: 'nl',
        serpAnalysis,
        internalLinks: internalLinks.length > 0 ? internalLinks : undefined,
        includeFAQ,
      });

      console.log(`[Content Hub] Content generated successfully: ${articleResult.wordCount} words`);
      
      // Validate word count meets minimum requirement
      if (articleResult.wordCount < MIN_WORD_COUNT) {
        console.warn(`[Content Hub] Warning: Article is only ${articleResult.wordCount} words (minimum ${MIN_WORD_COUNT} recommended)`);
      }
      
    } catch (writeError: any) {
      console.error('[Content Hub] Article writing failed:', writeError);
      
      // Update article status to failed with detailed error
      await prisma.contentHubArticle.update({
        where: { id: articleId },
        data: { 
          status: 'failed',
          researchData: {
            error: writeError.message,
            timestamp: new Date().toISOString(),
          } as any,
        },
      });
      
      // Provide user-friendly Dutch error messages
      let userMessage = 'Het schrijven van het artikel is mislukt. Probeer het opnieuw.';
      
      if (writeError.message.includes('timeout') || writeError.message.includes('Timeout')) {
        userMessage = 'Het artikel schrijven duurde te lang. Probeer het artikel korter te maken of later opnieuw.';
      } else if (writeError.message.includes('rate limit') || writeError.message.includes('too many requests')) {
        userMessage = 'Te veel verzoeken. Wacht even en probeer het opnieuw.';
      } else if (writeError.message.includes('API') || writeError.message.includes('model')) {
        userMessage = 'De AI service is tijdelijk niet beschikbaar. Probeer het over een paar minuten opnieuw.';
      } else if (writeError.message.includes('parse') || writeError.message.includes('JSON')) {
        userMessage = 'De AI response kon niet worden verwerkt. Dit kan gebeuren bij complexe artikelen. Probeer het opnieuw.';
      }
      
      return NextResponse.json(
        { 
          error: userMessage,
          details: process.env.NODE_ENV === 'development' ? writeError.message : undefined,
        },
        { status: 500 }
      );
    }

    // Generate FAQ if requested and not included
    let faqSection = articleResult.faqSection;
    if (includeFAQ && !faqSection) {
      faqSection = await generateFAQ(article.title, 'nl');
    }

    // Phase 3: SEO & Images
    console.log('[Content Hub] Phase 3: SEO Optimization & Image Generation');
    
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

    // Generate images (featured + article images)
    let featuredImageUrl = null;
    let articleImages: any[] = [];
    
    if (generateImages) {
      try {
        console.log('[Content Hub] Generating featured image...');
        const featuredImage = await generateFeaturedImage(
          article.title,
          article.keywords,
          { useFreeStock: true }
        );
        featuredImageUrl = featuredImage.url;
        console.log('[Content Hub] Featured image generated successfully');
        
        // Generate additional article images (6-8 total with stock photos)
        console.log('[Content Hub] Searching for article images...');
        const { generateArticleImagesWithAltText } = await import('@/lib/content-hub/image-generator');
        
        articleImages = await generateArticleImagesWithAltText(
          article.title,
          articleResult.content,
          article.keywords,
          TARGET_IMAGE_COUNT
        );
        
        console.log(`[Content Hub] Generated ${articleImages.length} article images (featured + ${articleImages.length - 1} additional)`);
      } catch (error) {
        console.error('[Content Hub] Image generation failed:', error);
        // Continue without images - not critical
      }
    }

    // Phase 4: Enhance content with images and products
    console.log('[Content Hub] Phase 4: Enhancing content with images and products');
    let enhancedContent = articleResult.content;

    // Insert images into content (after H2 sections)
    if (articleImages.length > 0) {
      console.log(`[Content Hub] Inserting ${articleImages.length} images into content...`);
      enhancedContent = insertImagesInContent(enhancedContent, articleImages);
    }

    // Try to add Bol.com products if client has credentials
    try {
      // Check if client has active projects with Bol.com enabled
      const bolcomProject = await prisma.project.findFirst({
        where: {
          clientId: client.id,
          bolcomEnabled: true,
          bolcomClientId: { not: null },
          bolcomClientSecret: { not: null },
        },
        select: {
          bolcomClientId: true,
          bolcomClientSecret: true,
          bolcomAffiliateId: true,
        },
      });

      if (bolcomProject?.bolcomClientId && bolcomProject?.bolcomClientSecret) {
        console.log('[Content Hub] Searching for Bol.com products...');
        
        const bolcomCredentials: BolcomCredentials = {
          clientId: bolcomProject.bolcomClientId,
          clientSecret: bolcomProject.bolcomClientSecret,
          affiliateId: bolcomProject.bolcomAffiliateId || undefined,
        };

        // Search for products related to the article
        const searchResults = await searchBolcomProducts(
          article.keywords[0] || article.title,
          bolcomCredentials,
          {
            resultsPerPage: 3,
            countryCode: 'NL',
          }
        );

        if (searchResults.results.length > 0) {
          console.log(`[Content Hub] Found ${searchResults.results.length} Bol.com products`);
          
          // Get detailed info for products
          const productDetails = await Promise.all(
            searchResults.results.slice(0, 3).map(p =>
              getBolcomProductDetails(p.ean, bolcomCredentials).catch(() => null)
            )
          );

          const validProducts = productDetails.filter(p => p !== null);
          
          if (validProducts.length > 0) {
            const productBoxesHtml = generateBolcomProductBoxes(validProducts);
            enhancedContent = insertBolcomProductsInContent(enhancedContent, productBoxesHtml);
            console.log(`[Content Hub] Added ${validProducts.length} Bol.com product boxes to content`);
          }
        }
      }
    } catch (bolcomError: any) {
      console.error('[Content Hub] Bol.com integration error:', bolcomError.message);
      // Continue without Bol.com products - not critical
    }

    // Generate schema markup
    const schema = generateArticleSchema({
      title: article.title,
      excerpt: articleResult.excerpt,
      content: enhancedContent,
      imageUrl: featuredImageUrl || undefined,
    });

    // Save article
    const generationTime = Math.floor((Date.now() - startTime) / 1000);
    
    // First update with enhanced content
    await prisma.contentHubArticle.update({
      where: { id: articleId },
      data: {
        status: 'published',
        content: enhancedContent,
        metaTitle,
        metaDescription,
        featuredImage: featuredImageUrl,
        wordCount: articleResult.wordCount,
        slug,
        faqSection: faqSection as any,
        schemaMarkup: schema as any,
        generationTime,
        researchData: {
          ...((article.researchData as any) || {}),
          serpAnalysis,
          sources,
          articleImages: articleImages.map(img => ({
            url: img.url,
            altText: img.altText,
            filename: img.filename,
            source: img.source,
          })),
          imageCount: articleImages.length,
        } as any,
      },
    });

    console.log(`[Content Hub] Article completed in ${generationTime}s`);

    // Save to Content Library
    console.log('[Content Hub] Saving to Content Library...');
    
    const saveResult = await autoSaveToLibrary({
      clientId: client.id,
      type: 'blog',
      title: article.title,
      content: enhancedContent,
      contentHtml: enhancedContent, // Use enhanced content with images and products
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
              content: enhancedContent, // Use enhanced content with images and products
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
        imageCount: articleImages.length,
        lsiKeywords: serpAnalysis.lsiKeywords?.length || 0,
        paaQuestions: serpAnalysis.paaQuestions?.length || 0,
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
