
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion, generateImage, IMAGE_MODELS, TEXT_MODELS } from '@/lib/aiml-api';
import { generateBlog } from '@/lib/aiml-agent';
import { getWordPressConfig, publishToWordPress, updateWordPressPost } from '@/lib/wordpress-publisher';
import { getBannedWordsForLanguage, removeBannedWords } from '@/lib/banned-words';
import { loadWordPressSitemap, findRelevantInternalLinksWithAI, insertInternalLinksIntoHTML } from '@/lib/sitemap-loader';
import { CREDIT_COSTS } from '@/lib/credits';
import { getClientToneOfVoice, generateToneOfVoicePrompt } from '@/lib/tone-of-voice-helper';
import { autoLinkProducts } from '@/lib/auto-link-products';

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minuten voor AI rewrite
export const runtime = 'nodejs';

interface WordPressPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  link: string;
  featured_media: number;
  categories: number[];
  tags: number[];
  yoast_head_json?: {
    title?: string;
    description?: string;
    focus_keyphrase?: string;
  };
}

/**
 * Helper functies voor image processing en YouTube embeds
 */

// Generate AI Image using Flux Pro
async function generateFluxImage(
  prompt: string,
  width: number = 1920,
  height: number = 1080
): Promise<string> {
  try {
    // Truncate prompt to max 400 characters (API limit)
    const truncatedPrompt = prompt.length > 400 
      ? prompt.substring(0, 397) + '...' 
      : prompt;
    
    console.log(`🎨 Generating Flux Pro image: ${truncatedPrompt.substring(0, 100)}...`);
    
    // Use Flux Pro for beste kwaliteit: $0.05
    const result = await generateImage({
      prompt: truncatedPrompt,
      model: 'FLUX_PRO', // Flux Pro - beste kwaliteit
      width,
      height,
      num_images: 1,
    });

    if (!result.success || !result.images || result.images.length === 0) {
      throw new Error(result.error || 'No image generated');
    }

    const imageUrl = result.images[0];
    console.log('✅ AI image generated successfully');
    return imageUrl;
    
  } catch (error) {
    console.error('❌ Image generation failed:', error);
    throw error;
  }
}

// Replace [IMAGE-X] placeholders with real images
async function replaceImagePlaceholders(
  content: string,
  topic: string,
  focusKeyword: string
): Promise<string> {
  try {
    const placeholderRegex = /\[IMAGE-(\d+)\]/g;
    const matches = Array.from(content.matchAll(placeholderRegex));
    
    if (matches.length === 0) {
      console.log('⚠️ Geen [IMAGE-X] placeholders gevonden');
      return content;
    }
    
    console.log(`🖼️ ${matches.length} image placeholders gevonden, genereren met GPT Image...`);
    
    // Limit to maximum 2 images for cost optimization
    const imagesToGenerate = matches.slice(0, 2);
    if (matches.length > 2) {
      console.log(`⚠️ Limiting to 2 images (found ${matches.length}) for cost optimization`);
    }
    
    let updatedContent = content;
    
    // Remove placeholders beyond the first 2
    if (matches.length > 2) {
      for (let i = 2; i < matches.length; i++) {
        updatedContent = updatedContent.replace(matches[i][0], '');
      }
    }
    
    // Generate images for each placeholder
    for (const match of imagesToGenerate) {
      const fullMatch = match[0];
      const placeholderNum = match[1];
      
      try {
        // Extract context around the placeholder
        const matchIndex = match.index || 0;
        const contextStart = Math.max(0, matchIndex - 300);
        const contextEnd = Math.min(content.length, matchIndex + 300);
        const surroundingContext = content.substring(contextStart, contextEnd)
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        const imagePrompt = `Professional, high-quality, photorealistic blog article image.

ARTICLE TOPIC: ${topic}
KEYWORD: ${focusKeyword}

CONTEXT: ${surroundingContext.substring(0, 200)}

STYLE: Modern, professional, photorealistic, magazine-quality, high resolution, vibrant colors, sharp focus, excellent lighting, editorial photography style.

NO TEXT, NO WATERMARKS, NO LOGOS.`;

        const imageUrl = await generateFluxImage(imagePrompt, 1920, 1080);
        
        // Create proper WordPress-compatible HTML
        const imgTag = `<figure class="wp-block-image size-large">
  <img src="${imageUrl}" alt="${topic} - afbeelding ${placeholderNum}" loading="lazy" />
</figure>`;
        updatedContent = updatedContent.replace(fullMatch, imgTag);
        
        console.log(`✅ Afbeelding ${placeholderNum} gegenereerd en geplaatst`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (imageError) {
        console.error(`❌ Failed to generate image ${placeholderNum}:`, imageError);
        // Remove placeholder if generation fails
        updatedContent = updatedContent.replace(fullMatch, '');
      }
    }
    
    return updatedContent;
    
  } catch (error) {
    console.error('❌ Error replacing image placeholders:', error);
    return content;
  }
}

// Process YouTube embeds
function processYouTubeEmbeds(content: string): string {
  return content.replace(
    /\[YOUTUBE:\s*([a-zA-Z0-9_-]+)\]/gi,
    (match, videoId) => {
      return `<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
  <div class="wp-block-embed__wrapper">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
  </div>
</figure>`;
    }
  );
}

// Generate featured image for WordPress
async function generateFeaturedImage(topic: string, focusKeyword: string): Promise<string | null> {
  try {
    const imagePrompt = `Professional, high-quality, photorealistic featured image for blog article.

TOPIC: ${topic}
KEYWORD: ${focusKeyword}

STYLE: Modern, professional, photorealistic, magazine-quality, high resolution, vibrant colors, sharp focus, excellent lighting, suitable for blog header.

NO TEXT, NO WATERMARKS, NO LOGOS.

16:9 landscape format.`;

    const imageUrl = await generateFluxImage(imagePrompt, 1920, 1080);
    console.log('✅ Featured image gegenereerd:', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('❌ Featured image generation failed:', error);
    return null;
  }
}

// Generate optimized SEO title (max 60 chars)
function generateSeoTitle(title: string): string {
  if (title.length <= 60) return title;
  
  // Try to cut at last word before 60 chars
  const cutoff = title.substring(0, 60).lastIndexOf(' ');
  return cutoff > 0 ? title.substring(0, cutoff) + '...' : title.substring(0, 57) + '...';
}

/**
 * Helper to send progress updates
 */
function sendProgress(encoder: TextEncoder, controller: ReadableStreamDefaultController, message: string) {
  const data = JSON.stringify({ type: 'progress', message }) + '\n';
  controller.enqueue(encoder.encode(data));
}

function sendError(encoder: TextEncoder, controller: ReadableStreamDefaultController, error: string, details?: string) {
  const data = JSON.stringify({ type: 'error', error, details }) + '\n';
  controller.enqueue(encoder.encode(data));
}

function sendSuccess(encoder: TextEncoder, controller: ReadableStreamDefaultController, result: any) {
  const data = JSON.stringify({ type: 'success', ...result }) + '\n';
  controller.enqueue(encoder.encode(data));
}

/**
 * POST /api/client/wordpress/rewrite
 * Herschrijft een bestaande WordPress post met AI en publiceert de update
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  const { projectId, postId, improvements, includeFAQ = false } = await req.json();

  if (!projectId || !postId) {
    return NextResponse.json({ 
      error: 'Project ID en Post ID zijn verplicht' 
    }, { status: 400 });
  }

  // Create streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        sendProgress(encoder, controller, '🔍 Validating project and credentials...');

        // Get project and client info
        const project = await prisma.project.findFirst({
          where: {
            id: projectId,
            client: { email: session.user.email }
          },
          include: {
            client: {
              select: {
                id: true,
                email: true,
                name: true,
                wordpressUrl: true,
                wordpressUsername: true,
                wordpressPassword: true,
                wordpressSitemap: true,
                totalCreditsPurchased: true,
                totalCreditsUsed: true,
                subscriptionCredits: true,
                topUpCredits: true,
              }
            }
          }
        });

        if (!project) {
          sendError(encoder, controller, 'Project niet gevonden');
          controller.close();
          return;
        }

        const client = project.client;

        // Check credits
        const availableCredits = (client.subscriptionCredits || 0) + (client.topUpCredits || 0);
        const rewriteCost = CREDIT_COSTS.BLOG_POST + (CREDIT_COSTS.IMAGE_PREMIUM * 2); // Blog + 2 images

        if (availableCredits < rewriteCost) {
          sendError(encoder, controller, `Onvoldoende credits. Deze actie kost ${rewriteCost} credits, maar je hebt ${availableCredits} credits beschikbaar.`);
          controller.close();
          return;
        }

        // Get WordPress credentials
        const wordpressUrl = project.wordpressUrl || client.wordpressUrl;
        const wordpressUsername = project.wordpressUsername || client.wordpressUsername;
        const wordpressPassword = project.wordpressPassword || client.wordpressPassword;

        if (!wordpressUrl || !wordpressUsername || !wordpressPassword) {
          sendError(encoder, controller, 'WordPress configuratie ontbreekt');
          controller.close();
          return;
        }

        sendProgress(encoder, controller, '✅ Validation successful');
        sendProgress(encoder, controller, '📡 Connecting to WordPress...');

        // Validate WordPress REST API
        const testUrl = `${wordpressUrl}/wp-json/wp/v2`;
        try {
          const testResponse = await fetch(testUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!testResponse.ok && testResponse.status === 404) {
            sendError(encoder, controller, 'Dit is geen WordPress website of de REST API is niet beschikbaar');
            controller.close();
            return;
          }

          const contentType = testResponse.headers.get('content-type');
          if (!contentType?.includes('application/json')) {
            sendError(encoder, controller, 'Dit is geen WordPress website');
            controller.close();
            return;
          }
        } catch (error: any) {
          sendError(encoder, controller, 'WordPress website is niet bereikbaar');
          controller.close();
          return;
        }

        sendProgress(encoder, controller, '✅ WordPress connection verified');
        sendProgress(encoder, controller, '📄 Fetching original post...');

        // Fetch original post from WordPress
        const wpAuth = Buffer.from(`${wordpressUsername}:${wordpressPassword}`).toString('base64');
        const fetchUrl = `${wordpressUrl}/wp-json/wp/v2/posts/${postId}`;
        
        const postResponse = await fetch(fetchUrl, {
          headers: { 'Authorization': `Basic ${wpAuth}` }
        });

        if (!postResponse.ok) {
          if (postResponse.status === 401 || postResponse.status === 403) {
            sendError(encoder, controller, 'WordPress authenticatie mislukt');
            controller.close();
            return;
          }
          sendError(encoder, controller, 'WordPress post niet gevonden');
          controller.close();
          return;
        }

        const originalPost: WordPressPost = await postResponse.json();
        const originalTitle = originalPost.title.rendered;
        const originalContent = originalPost.content.rendered.replace(/<[^>]*>/g, '');
        const originalWordCount = originalContent.split(/\s+/).length;

        sendProgress(encoder, controller, `✅ Original post loaded: "${originalTitle}" (${originalWordCount} words)`);

        // Get tone of voice
        sendProgress(encoder, controller, '⚙️ Loading project settings...');
        const toneOfVoiceData = await getClientToneOfVoice(client.id, projectId);
        const brandInfo = toneOfVoiceData?.customInstructions || undefined;

        // Get project language
        const projectLanguage = project.language || 'NL';

        // Get affiliate links from project
        let projectAffiliateLinks: Array<{
          url: string;
          anchorText: string;
          keywords: string[];
          category?: string;
          description?: string;
        }> = [];
        
        try {
          const affiliateLinksData = await prisma.affiliateLink.findMany({
            where: {
              projectId,
              isActive: true,
            },
            select: {
              url: true,
              anchorText: true,
              keywords: true,
              category: true,
              description: true,
            },
            orderBy: {
              usageCount: 'asc',
            },
            take: 10,
          });
          
          projectAffiliateLinks = affiliateLinksData;
        } catch (affiliateError) {
          console.error('❌ Error loading affiliate links:', affiliateError);
        }

        // Load sitemap for internal linking
        sendProgress(encoder, controller, '🗺️ Loading sitemap...');
        let sitemapData: any = null;
        try {
          sitemapData = await loadWordPressSitemap(wordpressUrl);
          if (sitemapData.pages?.length > 0) {
            sendProgress(encoder, controller, `✅ Loaded ${sitemapData.pages.length} sitemap URLs`);
          }
        } catch (error) {
          console.warn('⚠️ Could not load sitemap:', error);
          sendProgress(encoder, controller, '⚠️ Sitemap not available, continuing...');
        }

        // STEP 1: Generate rewritten content
        sendProgress(encoder, controller, '🤖 AI is rewriting your content (this may take 60-90 seconds)...');
        
        const keywords = originalTitle.split(' ').slice(0, 5);

        const allAffiliateLinks = projectAffiliateLinks.map(link => ({
          url: link.url,
          anchorText: link.anchorText,
          description: link.description || undefined,
        }));

        const improvedBrandInfo = improvements 
          ? `${brandInfo || ''}\n\nSPECIFIEKE VERBETERINGEN:\n${improvements}\n\nDit is een HERSCHRIJVING van een bestaande post. Moderniseer de content, verbeter structuur en SEO, en maak het minimaal 20% langer.`
          : `${brandInfo || ''}\n\nDit is een HERSCHRIJVING van een bestaande post. Moderniseer de content, verbeter structuur en SEO, en maak het minimaal 20% langer.`;

        let rewrittenContent: string;
        try {
          rewrittenContent = await generateBlog(
            originalTitle,
            keywords,
            toneOfVoiceData?.toneOfVoice || 'professional',
            improvedBrandInfo,
            {
              affiliateLinks: allAffiliateLinks.length > 0 ? allAffiliateLinks : undefined,
              targetWordCount: Math.floor(originalWordCount * 1.2),
              includeFAQ: includeFAQ,
              includeYouTube: true,
              includeDirectAnswer: true,
              language: projectLanguage.toUpperCase() as 'NL' | 'EN' | 'DE',
            }
          );
        } catch (generateError: any) {
          console.error('❌ Error generating blog:', generateError);
          sendError(encoder, controller, 'AI content generation failed', generateError.message);
          return;
        }

        if (!rewrittenContent || rewrittenContent.trim().length === 0) {
          sendError(encoder, controller, 'AI generated empty content', 'Please try again');
          return;
        }

        sendProgress(encoder, controller, '✅ Content rewritten successfully');

        // STEP 2: Replace image placeholders
        sendProgress(encoder, controller, '🖼️ Generating AI images...');
        try {
          rewrittenContent = await replaceImagePlaceholders(rewrittenContent, originalTitle, keywords[0] || 'blog');
          sendProgress(encoder, controller, '✅ Images generated and inserted');
        } catch (error) {
          sendProgress(encoder, controller, '⚠️ Could not generate images, continuing...');
        }

        // STEP 3: Process YouTube embeds
        sendProgress(encoder, controller, '📹 Processing YouTube embeds...');
        rewrittenContent = processYouTubeEmbeds(rewrittenContent);
        sendProgress(encoder, controller, '✅ YouTube embeds processed');

        // STEP 4: Add internal links
        if (sitemapData && sitemapData.pages?.length > 0) {
          sendProgress(encoder, controller, '🔗 Adding internal links...');
          try {
            const relevantLinks = await findRelevantInternalLinksWithAI(
              sitemapData,
              originalTitle,
              keywords,
              3
            );

            if (relevantLinks.length > 0) {
              rewrittenContent = await insertInternalLinksIntoHTML(rewrittenContent, relevantLinks);
              sendProgress(encoder, controller, `✅ Added ${relevantLinks.length} internal links`);
            }
          } catch (error) {
            sendProgress(encoder, controller, '⚠️ Could not add internal links');
          }
        }

        // STEP 5: Add auto-link products
        sendProgress(encoder, controller, '🛍️ Processing affiliate products...');
        try {
          const autoLinkResult = await autoLinkProducts({
            projectId,
            content: rewrittenContent,
            credentials: project.bolcomClientId && project.bolcomClientSecret ? {
              clientId: project.bolcomClientId,
              clientSecret: project.bolcomClientSecret
            } : undefined
          });
          
          rewrittenContent = autoLinkResult.content;
          if (autoLinkResult.linksInserted > 0) {
            sendProgress(encoder, controller, `✅ Added ${autoLinkResult.linksInserted} affiliate links`);
          }
        } catch (error) {
          sendProgress(encoder, controller, '⚠️ Could not process affiliate products');
        }

        // STEP 6: Generate SEO metadata
        sendProgress(encoder, controller, '📊 Generating SEO metadata...');
        
        const languageMap: Record<string, string> = {
          'NL': 'Nederlands',
          'EN': 'Engels',
          'DE': 'Duits'
        };
        const languageName = languageMap[projectLanguage] || 'Nederlands';

        const seoPrompt = `Genereer verbeterde SEO metadata voor deze herschreven blogpost:

TITEL: ${originalTitle}
CONTENT: ${rewrittenContent.substring(0, 1000)}...

Genereer in EXACT dit JSON formaat:
{
  "title": "SEO-geoptimaliseerde titel (max 60 tekens, pakkend en keyword-rijk)",
  "metaDescription": "Meta beschrijving (150-160 tekens, actief en verleidelijk)",
  "focusKeyword": "primair focus keyword (2-4 woorden)",
  "newTitle": "Verbeterde hoofdtitel voor de post (mag langer zijn dan SEO title)"
}

Schrijf in het ${languageName} en zorg dat het natuurlijk klinkt.`;

        const seoResponse = await chatCompletion({
          messages: [{ role: 'user', content: seoPrompt }],
          model: TEXT_MODELS.CLAUDE_45, // Claude Sonnet 4.5 - Latest version
          max_tokens: 500,
          temperature: 0.7
        });

        const seoData = JSON.parse(
          seoResponse.choices[0].message.content
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim()
        );

        sendProgress(encoder, controller, '✅ SEO metadata generated');

        // STEP 7: Generate and upload featured image
        sendProgress(encoder, controller, '🖼️ Generating featured image...');
        let featuredMediaId: number | undefined;
        
        try {
          const featuredImageUrl = await generateFeaturedImage(originalTitle, seoData.focusKeyword);
          
          if (featuredImageUrl) {
            const imageBuffer = await fetch(featuredImageUrl).then(r => r.arrayBuffer());
            const uploadAuth = Buffer.from(`${wordpressUsername}:${wordpressPassword}`).toString('base64');
            
            const uploadResponse = await fetch(`${wordpressUrl}/wp-json/wp/v2/media`, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${uploadAuth}`,
                'Content-Type': 'image/jpeg',
                'Content-Disposition': `attachment; filename="featured-${Date.now()}.jpg"`
              },
              body: imageBuffer
            });

            if (uploadResponse.ok) {
              const mediaData = await uploadResponse.json();
              featuredMediaId = mediaData.id;
              sendProgress(encoder, controller, '✅ Featured image uploaded');
            }
          }
        } catch (error) {
          sendProgress(encoder, controller, '⚠️ Could not upload featured image');
        }

        // STEP 8: Update WordPress post with NEW publication date
        sendProgress(encoder, controller, '📤 Publishing to WordPress...');
        
        const auth = Buffer.from(`${wordpressUsername}:${wordpressPassword}`).toString('base64');
        const postUrl = `${wordpressUrl}/wp-json/wp/v2/posts/${postId}`;

        // Get current date in WordPress format (ISO 8601)
        const now = new Date().toISOString();

        // Update the post with new content, SEO, and UPDATED date
        const updateData: any = {
          title: seoData.newTitle,
          content: rewrittenContent,
          excerpt: seoData.metaDescription,
          date: now, // ⭐ Update publication date to NOW
          modified: now, // ⭐ Update modified date to NOW
          meta: {
            _yoast_wpseo_title: seoData.title,
            _yoast_wpseo_metadesc: seoData.metaDescription,
            _yoast_wpseo_focuskw: seoData.focusKeyword,
            rank_math_title: seoData.title,
            rank_math_description: seoData.metaDescription,
            rank_math_focus_keyword: seoData.focusKeyword,
          }
        };

        if (featuredMediaId) {
          updateData.featured_media = featuredMediaId;
        }

        const updateResponse = await fetch(postUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          sendError(encoder, controller, 'Failed to update WordPress post', JSON.stringify(errorData));
          controller.close();
          return;
        }

        const updatedPost = await updateResponse.json();
        sendProgress(encoder, controller, '✅ Post published to WordPress with updated date!');

        // STEP 9: Deduct credits
        sendProgress(encoder, controller, '💰 Processing credits...');
        const creditsUsed = rewriteCost;
        
        if (client.subscriptionCredits >= creditsUsed) {
          await prisma.client.update({
            where: { id: client.id },
            data: {
              subscriptionCredits: { decrement: creditsUsed },
              totalCreditsUsed: { increment: creditsUsed }
            }
          });
        } else {
          const fromSubscription = client.subscriptionCredits;
          const fromTopUp = creditsUsed - fromSubscription;
          
          await prisma.client.update({
            where: { id: client.id },
            data: {
              subscriptionCredits: 0,
              topUpCredits: { decrement: fromTopUp },
              totalCreditsUsed: { increment: creditsUsed }
            }
          });
        }

        // Log credit transaction
        await prisma.creditTransaction.create({
          data: {
            clientId: client.id,
            amount: -creditsUsed,
            description: `WordPress post herschreven: ${seoData.newTitle}`,
            type: 'usage',
            balanceAfter: (client.subscriptionCredits + client.topUpCredits) - creditsUsed
          }
        });

        sendProgress(encoder, controller, `✅ ${creditsUsed} credits deducted`);

        // Send final success message
        sendSuccess(encoder, controller, {
          post: {
            id: updatedPost.id,
            title: seoData.newTitle,
            link: updatedPost.link,
            wordCount: rewrittenContent.replace(/<[^>]*>/g, '').split(/\s+/).length,
            featuredImageSet: !!featuredMediaId,
            seo: {
              title: seoData.title,
              description: seoData.metaDescription,
              focusKeyword: seoData.focusKeyword
            }
          },
          creditsUsed,
          newBalance: (client.subscriptionCredits + client.topUpCredits) - creditsUsed
        });

        controller.close();

      } catch (error: any) {
        console.error('Error rewriting WordPress post:', error);
        sendError(encoder, controller, 'Fout bij herschrijven post', error.message);
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
