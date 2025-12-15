
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minuten voor complexe blog generatie
export const runtime = 'nodejs';

/**
 * QUICK GENERATE & PUBLISH API
 * 
 * 1-klik functionaliteit voor directe content generatie + publicatie
 * - Gebruikt dezelfde engine als Autopilot (aiml-agent.generateBlog)
 * - Publiceert direct naar WordPress
 * - Real-time progress updates via streaming
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { deductCredits, CREDIT_COSTS } from '@/lib/credits';
import { generateBlog } from '@/lib/aiml-agent';
import { getClientToneOfVoice } from '@/lib/tone-of-voice-helper';
import { autoSaveToLibrary } from '@/lib/content-library-helper';
import { isContentValid } from '@/lib/banned-words';
import { 
  loadWordPressSitemap, 
  findRelevantInternalLinksWithAI,
  insertInternalLinksIntoHTML,
  type SitemapData
} from '@/lib/sitemap-loader';
import { publishToWordPress } from '@/lib/wordpress-publisher';

/**
 * Helper functies voor image processing en SEO
 */

// Generate Flux Pro Image
async function generateFluxImage(
  prompt: string,
  width: number = 1920,
  height: number = 1080
): Promise<string> {
  try {
    console.log(`🎨 Flux Pro afbeelding genereren: ${prompt.substring(0, 100)}...`);
    
    let size = '1024x1024';
    if (width > height) {
      size = '1536x1024';
    } else if (height > width) {
      size = '1024x1536';
    }
    
    const response = await fetch(`https://api.aimlapi.com/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'flux-pro',  // Flux Pro: $0.05 - beste kwaliteit
        prompt: prompt,
        size: size,
        quality: 'high',
        n: 1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Flux Pro API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const imageUrl = result.images?.[0]?.url || result.data?.[0]?.url;
    
    if (!imageUrl) {
      throw new Error('No image URL returned from GPT Image API');
    }

    console.log('✅ GPT Image afbeelding gegenereerd:', imageUrl);
    return imageUrl;
    
  } catch (error) {
    console.error('❌ GPT Image generation failed:', error);
    throw error;
  }
}

// Replace IMAGE placeholders with real images (supports all formats)
async function replaceImagePlaceholders(
  content: string,
  topic: string,
  focusKeyword: string
): Promise<string> {
  try {
    // Find all image placeholder patterns:
    // - [IMAGE-X]
    // - IMAGE_PLACEHOLDER_X
    // - <img src="IMAGE_PLACEHOLDER_X" ... />
    const imagePlaceholderPattern = /\[IMAGE-(\d+)\]|IMAGE_PLACEHOLDER_(\d+)|<img[^>]*src=["']IMAGE_PLACEHOLDER_(\d+)["']/g;
    const allMatches = Array.from(content.matchAll(imagePlaceholderPattern));
    
    if (allMatches.length === 0) {
      console.log('⚠️ Geen image placeholders gevonden');
      return content;
    }
    
    // Extract unique placeholder numbers
    const uniquePlaceholders = new Set<string>();
    for (const match of allMatches) {
      const placeholderNum = match[1] || match[2] || match[3];
      if (placeholderNum) {
        uniquePlaceholders.add(placeholderNum);
      }
    }
    
    console.log(`🖼️ ${uniquePlaceholders.size} unieke image placeholders gevonden, genereren met Flux Pro...`);
    
    // Limit to maximum 2 images for cost optimization
    const placeholdersArray = Array.from(uniquePlaceholders).sort((a, b) => parseInt(a) - parseInt(b));
    const imagesToGenerate = placeholdersArray.slice(0, 2);
    
    if (placeholdersArray.length > 2) {
      console.log(`⚠️ Limiting to 2 images (found ${placeholdersArray.length}) for cost optimization`);
    }
    
    let updatedContent = content;
    
    // Generate images for each unique placeholder
    for (const placeholderNum of imagesToGenerate) {
      try {
        // Find the first occurrence of this placeholder to extract context
        const searchPatterns = [
          `[IMAGE-${placeholderNum}]`,
          `IMAGE_PLACEHOLDER_${placeholderNum}`,
          `<img[^>]*src=["']IMAGE_PLACEHOLDER_${placeholderNum}["']`
        ];
        
        let contextIndex = -1;
        for (const pattern of searchPatterns) {
          const regex = new RegExp(pattern);
          const match = regex.exec(updatedContent);
          if (match && match.index !== undefined) {
            contextIndex = match.index;
            break;
          }
        }
        
        // Extract context around the placeholder
        let surroundingContext = '';
        if (contextIndex >= 0) {
          const contextStart = Math.max(0, contextIndex - 300);
          const contextEnd = Math.min(updatedContent.length, contextIndex + 300);
          surroundingContext = updatedContent.substring(contextStart, contextEnd)
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }
        
        const imagePrompt = `Professional, high-quality, photorealistic blog article image.

ARTICLE TOPIC: ${topic}
KEYWORD: ${focusKeyword}

CONTEXT: ${surroundingContext.substring(0, 200)}

STYLE: Modern, professional, photorealistic, magazine-quality, high resolution, vibrant colors, sharp focus, excellent lighting, editorial photography style.

NO TEXT, NO WATERMARKS, NO LOGOS.`;

        const imageUrl = await generateFluxImage(imagePrompt, 1920, 1080);
        
        // Create proper HTML img tag
        const imgTag = `<img src="${imageUrl}" alt="${topic} - afbeelding ${placeholderNum}" loading="lazy" style="width: 100%; height: auto; border-radius: 8px; margin: 20px 0;" />`;
        
        // Replace ALL variations of this placeholder
        // 1. Replace [IMAGE-X] format
        updatedContent = updatedContent.replace(new RegExp(`\\[IMAGE-${placeholderNum}\\]`, 'g'), imgTag);
        
        // 2. Replace IMAGE_PLACEHOLDER_X format (not in img tag)
        updatedContent = updatedContent.replace(new RegExp(`IMAGE_PLACEHOLDER_${placeholderNum}(?![^<]*>)`, 'g'), imgTag);
        
        // 3. Replace <img src="IMAGE_PLACEHOLDER_X" ... /> format
        updatedContent = updatedContent.replace(
          new RegExp(`<img[^>]*src=["']IMAGE_PLACEHOLDER_${placeholderNum}["'][^>]*>`, 'g'),
          imgTag
        );
        
        console.log(`✅ Afbeelding ${placeholderNum} gegenereerd en alle variaties vervangen`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (imageError) {
        console.error(`❌ Failed to generate image ${placeholderNum}:`, imageError);
        // Remove ALL placeholder variations if generation fails
        updatedContent = updatedContent.replace(new RegExp(`\\[IMAGE-${placeholderNum}\\]`, 'g'), '');
        updatedContent = updatedContent.replace(new RegExp(`IMAGE_PLACEHOLDER_${placeholderNum}(?![^<]*>)`, 'g'), '');
        updatedContent = updatedContent.replace(
          new RegExp(`<img[^>]*src=["']IMAGE_PLACEHOLDER_${placeholderNum}["'][^>]*>`, 'g'),
          ''
        );
      }
    }
    
    // Remove any remaining placeholders beyond the first 2
    for (let i = 2; i < placeholdersArray.length; i++) {
      const placeholderNum = placeholdersArray[i];
      updatedContent = updatedContent.replace(new RegExp(`\\[IMAGE-${placeholderNum}\\]`, 'g'), '');
      updatedContent = updatedContent.replace(new RegExp(`IMAGE_PLACEHOLDER_${placeholderNum}(?![^<]*>)`, 'g'), '');
      updatedContent = updatedContent.replace(
        new RegExp(`<img[^>]*src=["']IMAGE_PLACEHOLDER_${placeholderNum}["'][^>]*>`, 'g'),
        ''
      );
    }
    
    console.log('✅ Alle image placeholders verwerkt');
    return updatedContent;
    
  } catch (error) {
    console.error('❌ Error replacing image placeholders:', error);
    return content;
  }
}

// Generate featured image for WordPress with retry and fallback
async function generateFeaturedImage(topic: string, focusKeyword: string): Promise<string | null> {
  const maxRetries = 2;
  let lastError: any = null;
  
  // Try AI image generation with retries
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🎨 Featured image generation attempt ${attempt}/${maxRetries}`);
      
      const imagePrompt = `Professional, high-quality, photorealistic featured image for blog article.

TOPIC: ${topic}
KEYWORD: ${focusKeyword}

STYLE: Modern, professional, photorealistic, magazine-quality, high resolution, vibrant colors, sharp focus, excellent lighting, suitable for blog header.

NO TEXT, NO WATERMARKS, NO LOGOS.

16:9 landscape format.`;

      const imageUrl = await generateFluxImage(imagePrompt, 1920, 1080);
      
      // Validate that the image URL is accessible
      const validateResponse = await fetch(imageUrl, { method: 'HEAD' });
      if (!validateResponse.ok) {
        throw new Error(`Image URL not accessible: ${validateResponse.status}`);
      }
      
      console.log(`✅ Featured image gegenereerd en gevalideerd (attempt ${attempt}):`, imageUrl);
      return imageUrl;
    } catch (error) {
      lastError = error;
      console.error(`❌ Featured image generation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt < maxRetries) {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  // If AI generation failed after all retries, try stock image fallback
  console.log('🔄 AI image generation failed, trying stock image fallback...');
  try {
    const stockImageUrl = await getStockImageFallback(focusKeyword || topic);
    if (stockImageUrl) {
      console.log('✅ Stock image fallback successful:', stockImageUrl);
      return stockImageUrl;
    }
  } catch (fallbackError) {
    console.error('❌ Stock image fallback also failed:', fallbackError);
  }
  
  console.error('❌ All featured image generation methods failed');
  return null;
}

// Get stock image as fallback
async function getStockImageFallback(searchTerm: string): Promise<string | null> {
  try {
    const pixabayApiKey = process.env.PIXABAY_API_KEY;
    if (!pixabayApiKey) {
      console.log('⚠️ No Pixabay API key configured');
      return null;
    }
    
    const searchQuery = encodeURIComponent(searchTerm);
    const url = `https://pixabay.com/api/?key=${pixabayApiKey}&q=${searchQuery}&image_type=photo&orientation=horizontal&per_page=5&safesearch=true`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.hits && data.hits.length > 0) {
      // Return the highest quality image available
      return data.hits[0].largeImageURL || data.hits[0].webformatURL;
    }
    
    return null;
  } catch (error) {
    console.error('Stock image fallback error:', error);
    return null;
  }
}

// Generate optimized SEO title (max 60 chars)
function generateSeoTitle(title: string): string {
  if (title.length <= 60) return title;
  
  // Try to cut at last word before 60 chars
  const shortened = title.substring(0, 57);
  const lastSpace = shortened.lastIndexOf(' ');
  if (lastSpace > 40) {
    return shortened.substring(0, lastSpace) + '...';
  }
  return shortened + '...';
}

// Generate meta description
async function generateMetaDescription(
  title: string,
  content: string,
  focusKeyword: string
): Promise<string> {
  try {
    // Extract first paragraph for context
    const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const firstParagraph = textContent.substring(0, 300);
    
    const response = await fetch(`https://api.aimlapi.com/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [{
          role: 'user',
          content: `Genereer een pakkende SEO meta description (150-160 karakters) voor dit artikel:

Titel: ${title}
Focus Keyword: ${focusKeyword}
Eerste alinea: ${firstParagraph}

Vereisten:
- Exact 150-160 karakters
- Gebruik het focus keyword "${focusKeyword}"
- Pakkend en informatief
- Eindigt niet halverwege een zin
- Maakt de lezer nieuwsgierig om te klikken

Geef ALLEEN de meta description terug, geen extra tekst.`
        }],
        max_tokens: 100,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate meta description');
    }

    const result = await response.json();
    const metaDesc = result.choices[0].message.content.trim();
    
    // Ensure it's within limits
    if (metaDesc.length > 160) {
      return metaDesc.substring(0, 157) + '...';
    }
    
    console.log('✅ Meta description gegenereerd:', metaDesc);
    return metaDesc;
    
  } catch (error) {
    console.error('❌ Meta description generation failed:', error);
    // Fallback: create simple description
    const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const fallback = textContent.substring(0, 157) + '...';
    return fallback;
  }
}

// Process YouTube embeds
function processYouTubeEmbeds(content: string): string {
  try {
    // Find YouTube iframes and ensure they have no surrounding text
    const youtubeRegex = /<iframe[^>]*src="[^"]*(?:youtube\.com|youtu\.be)[^"]*"[^>]*><\/iframe>/gi;
    const matches = content.match(youtubeRegex);
    
    if (!matches) {
      console.log('⚠️ Geen YouTube embeds gevonden');
      return content;
    }
    
    console.log(`🎥 ${matches.length} YouTube embeds gevonden, processing...`);
    
    let processedContent = content;
    
    for (const match of matches) {
      // Ensure iframe is wrapped cleanly without extra text
      const cleanEmbed = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 30px 0;">
  ${match}
</div>`;
      
      // Replace the iframe with clean embed
      processedContent = processedContent.replace(match, cleanEmbed);
    }
    
    // Remove common text patterns around YouTube embeds
    processedContent = processedContent.replace(/(Bekijk deze|Kijk naar de|Zie de|Check de)\s+video:?\s*<div/gi, '<div');
    processedContent = processedContent.replace(/<\/div>\s*voor meer informatie\.?/gi, '</div>');
    
    console.log('✅ YouTube embeds geprocessed');
    return processedContent;
    
  } catch (error) {
    console.error('❌ Error processing YouTube embeds:', error);
    return content;
  }
}

// Note: Featured image uploading is now handled by publishToWordPress() function

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Helper to send progress updates
  const sendProgress = async (progress: number, status: string, details?: string) => {
    const data = `data: ${JSON.stringify({ type: 'progress', progress, status, details })}\n\n`;
    await writer.write(encoder.encode(data));
  };

  const sendComplete = async (data: any) => {
    const message = `data: ${JSON.stringify({ type: 'complete', ...data })}\n\n`;
    await writer.write(encoder.encode(message));
  };

  const sendError = async (error: string) => {
    const data = `data: ${JSON.stringify({ type: 'error', error })}\n\n`;
    await writer.write(encoder.encode(data));
  };

  // Start generation in background
  (async () => {
    try {
      const body = await req.json();
      const { articleId, projectId } = body;

      if (!articleId) {
        await sendError('Article ID verplicht');
        await writer.close();
        return;
      }

      await sendProgress(5, '🔐 Authenticatie controleren...');

      // Get session
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        await sendError('Niet geautoriseerd');
        await writer.close();
        return;
      }

      // Get client
      const client = await prisma.client.findUnique({
        where: { email: session.user.email },
        select: { 
          id: true, 
          email: true,
          subscriptionCredits: true,
          topUpCredits: true,
          isUnlimited: true
        },
      });

      if (!client) {
        await sendError('Client niet gevonden');
        await writer.close();
        return;
      }

      await sendProgress(10, '📄 Artikel idee ophalen...');

      // Get article idea
      const articleIdea = await prisma.articleIdea.findUnique({
        where: { id: articleId },
      });

      if (!articleIdea) {
        await sendError('Article idea niet gevonden');
        await writer.close();
        return;
      }

      // Check if already has content
      if (articleIdea.hasContent && articleIdea.contentId) {
        await sendComplete({
          success: true,
          contentId: articleIdea.contentId,
          message: 'Content bestaat al',
        });
        await writer.close();
        return;
      }

      await sendProgress(15, '💰 Credits controleren...');

      // Credit check
      const totalCredits = client.subscriptionCredits + client.topUpCredits;
      const requiredCredits = CREDIT_COSTS.BLOG_POST;
      
      if (!client.isUnlimited && totalCredits < requiredCredits) {
        await sendError(`Je hebt niet genoeg credits. Dit kost ${requiredCredits} credits.`);
        await writer.close();
        return;
      }

      await sendProgress(20, '⚙️ Project instellingen laden...');

      // Update article status to writing
      await prisma.articleIdea.update({
        where: { id: articleId },
        data: { status: 'writing' },
      });

      // Get project for context
      let project = null;
      let projectContext = null;
      let sitemapUrl = null;
      let wordpressApiUrl = null;
      let wordpressCategory = null;
      let bolcomCredentials = null;
      let projectAffiliateLinks: any[] = [];
      let includeFAQ = false;
      let includeDirectAnswer = true;
      let includeYouTube = false;
      let projectLanguage = 'nl';

      if (projectId) {
        project = await prisma.project.findUnique({
          where: { id: projectId },
          select: {
            id: true,
            name: true,
            description: true,
            websiteUrl: true,
            language: true,
            wordpressUrl: true,
            wordpressCategory: true,
            bolcomClientId: true,
            bolcomClientSecret: true,
            bolcomAffiliateId: true,
            autopilotWordCount: true,
            autopilotIncludeFAQ: true,
            autopilotIncludeDirectAnswer: true,
            autopilotIncludeYouTube: true,
            autopilotPublishToWritgoaiBlog: true,
            affiliateLinks: {
              where: { isActive: true },
              select: {
                id: true,
                url: true,
                anchorText: true,
                category: true,
                description: true,
                keywords: true,
              },
            },
          },
        });

        if (project) {
          projectContext = {
            name: project.name,
            url: project.websiteUrl || undefined,
            description: project.description || undefined,
          };
          wordpressApiUrl = project.wordpressUrl || undefined;
          wordpressCategory = project.wordpressCategory || undefined;
          projectAffiliateLinks = project.affiliateLinks || [];
          projectLanguage = project.language || 'nl';
          
          // SEO Features from project settings
          includeFAQ = project.autopilotIncludeFAQ ?? false;
          includeDirectAnswer = project.autopilotIncludeDirectAnswer ?? true;
          includeYouTube = project.autopilotIncludeYouTube ?? false;
          
          if (project.bolcomClientId && project.bolcomClientSecret) {
            bolcomCredentials = {
              clientId: project.bolcomClientId,
              clientSecret: project.bolcomClientSecret,
              affiliateId: project.bolcomAffiliateId || undefined,
            };
          }
        }
      }

      await sendProgress(25, '🧠 AI tone of voice ophalen...');

      // Get tone of voice
      let toneOfVoice = undefined;
      try {
        toneOfVoice = await getClientToneOfVoice(client.id, projectId || undefined);
        console.log('🎭 Tone of voice loaded:', toneOfVoice ? 'Custom tone' : 'Default');
      } catch (error) {
        console.log('⚠️ Could not load tone of voice, using default');
      }

      await sendProgress(30, '🚀 Content generatie starten...', 'Dit kan enkele minuten duren');

      // Prepare keywords
      const keywords = [articleIdea.focusKeyword, ...(articleIdea.secondaryKeywords || [])].filter(Boolean);
      
      // Get brand info (tone of voice)
      const brandInfo = toneOfVoice?.customInstructions || undefined;

      // Prepare affiliate links for AI integration
      const allAffiliateLinks = projectAffiliateLinks.map(link => ({
        url: link.url,
        anchorText: link.anchorText,
        description: link.description || undefined,
      }));

      // Generate blog content
      const htmlContent = await generateBlog(
        articleIdea.title,
        keywords,
        toneOfVoice?.tone || 'professional',
        brandInfo,
        {
          affiliateLinks: allAffiliateLinks.length > 0 ? allAffiliateLinks : undefined,
          targetWordCount: project?.autopilotWordCount || undefined,
          includeFAQ,
          includeYouTube,
          includeDirectAnswer,
          language: projectLanguage.toUpperCase() as 'NL' | 'EN' | 'DE',
        }
      );

      await sendProgress(60, '🎨 Afbeeldingen genereren...', 'Featured image en mid-text afbeeldingen toevoegen');

      // Generate featured image FIRST (before replacing placeholders)
      let featuredImageUrl: string | null = null;
      try {
        await sendProgress(62, '🖼️ Featured image genereren...');
        featuredImageUrl = await generateFeaturedImage(articleIdea.title, keywords[0] || '');
        if (featuredImageUrl) {
          console.log('✅ Featured image gegenereerd:', featuredImageUrl);
        }
      } catch (imageError) {
        console.error('⚠️ Featured image generation failed:', imageError);
      }

      // Add featured image to content HTML at the top (so it's always visible)
      let contentWithFeaturedImage = htmlContent;
      if (featuredImageUrl) {
        const featuredImageHtml = `<div style="margin: 0 0 30px 0;">
  <img src="${featuredImageUrl}" alt="${articleIdea.title}" style="width: 100%; height: auto; border-radius: 8px; display: block;" loading="eager" />
</div>

`;
        // Insert featured image after the first <h1> or at the very beginning
        if (contentWithFeaturedImage.includes('<h1>')) {
          contentWithFeaturedImage = contentWithFeaturedImage.replace(/<\/h1>/, `</h1>\n\n${featuredImageHtml}`);
        } else {
          contentWithFeaturedImage = featuredImageHtml + contentWithFeaturedImage;
        }
        console.log('✅ Featured image toegevoegd aan HTML content');
      }

      // Replace image placeholders with GPT Image generated images
      let contentWithImages = contentWithFeaturedImage;
      try {
        await sendProgress(65, '🎨 Mid-text afbeeldingen genereren...');
        contentWithImages = await replaceImagePlaceholders(contentWithFeaturedImage, articleIdea.title, keywords[0] || 'blog');
        console.log('✅ Image placeholders vervangen');
      } catch (error) {
        console.log('⚠️ Could not replace image placeholders:', error);
      }

      // Process YouTube embeds
      contentWithImages = processYouTubeEmbeds(contentWithImages);

      await sendProgress(68, '🛍️ Producten toevoegen uit Bol.com...');

      // Add Bol.com products if credentials available
      let contentWithProducts = contentWithImages;
      if (bolcomCredentials && bolcomCredentials.clientId && bolcomCredentials.clientSecret) {
        try {
          console.log('🛍️ Searching for relevant products on Bol.com...');
          
          // Import product insertion logic
          const { searchBolcomProducts } = await import('@/lib/bolcom-api');
          const { chatCompletion } = await import('@/lib/aiml-api');
          
          // Search for products based on title keywords
          const searchQuery = articleIdea.title
            .replace(/\d{4}/g, '') // Remove years
            .replace(/beste|top|meest|guide|tips/gi, '') // Remove common words
            .trim();
          
          console.log(`🔍 Searching Bol.com for: "${searchQuery}"`);
          
          const searchResults = await searchBolcomProducts(
            searchQuery,
            {
              clientId: bolcomCredentials.clientId,
              clientSecret: bolcomCredentials.clientSecret,
            },
            {
              resultsPerPage: 10,
            }
          );
          
          if (searchResults.results && searchResults.results.length > 0) {
            console.log(`✅ Found ${searchResults.results.length} products`);
            
            // Take top 5-8 products with images
            const validProducts = searchResults.results
              .filter(p => p.image && p.image.url)
              .slice(0, 8);
            
            console.log(`✅ Selected ${validProducts.length} products with images`);
            
            if (validProducts.length > 0) {
              // Generate product reviews with AI
              console.log('🤖 Generating product reviews with AI...');
              
              const productReviewsPrompt = `Je bent een productexpert die eerlijke reviews schrijft. Genereer voor elk product:
- Een korte unieke intro (2-3 zinnen)
- 3-4 concrete pluspunten
- 2-3 eerlijke minpunten

Producten:
${validProducts.map((p, i) => `${i + 1}. ${p.title}`).join('\n')}

Geef output in dit JSON format:
{
  "reviews": [
    {
      "intro": "...",
      "pros": ["...", "...", "..."],
      "cons": ["...", "..."]
    }
  ]
}`;

              let productReviews: any[] = [];
              
              try {
                const reviewResponse = await chatCompletion({
                  messages: [{ role: 'user', content: productReviewsPrompt }],
                  model: 'claude-sonnet-4-20250514',
                  temperature: 0.9,
                });
                
                const content = reviewResponse.choices[0].message.content;
                // Extract JSON from markdown code blocks if present
                const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || content.match(/(\{[\s\S]*\})/);
                const jsonStr = jsonMatch ? jsonMatch[1] : content;
                
                const reviewData = JSON.parse(jsonStr);
                productReviews = reviewData.reviews || [];
                console.log(`✅ Generated ${productReviews.length} product reviews`);
              } catch (aiError) {
                console.error('⚠️ AI review generation failed:', aiError);
                // Create fallback reviews
                productReviews = validProducts.map(() => ({
                  intro: 'Een solide keuze met goede specificaties.',
                  pros: ['Goede kwaliteit', 'Betrouwbaar merk', 'Scherp geprijsd'],
                  cons: ['Kan beter', 'Beperkte garantie'],
                }));
              }
              
              // Build product sections
              let productSectionsHtml = '';
              
              for (let i = 0; i < validProducts.length; i++) {
                const product = validProducts[i];
                const review = productReviews[i] || productReviews[0];
                
                // Get image URL
                const imageUrl = product.image?.url || '';
                
                // Get price
                const price = product.offer?.price 
                  ? `€${product.offer.price.toFixed(2)}`
                  : 'Prijs onbekend';
                
                // Build affiliate URL
                const affiliateUrl = bolcomCredentials.affiliateId
                  ? `https://partner.bol.com/click/click?p=2&t=url&s=${bolcomCredentials.affiliateId}&url=${encodeURIComponent(product.url)}&f=API&name=${encodeURIComponent(product.title)}`
                  : product.url || '#';
                
                // Create product section HTML
                const productSectionHtml = `
<h2>${i + 1}. ${product.title}</h2>

<div style="margin: 20px 0;">
  <img src="${imageUrl}" alt="${product.title}" style="max-width: 800px; width: 100%; height: auto; border-radius: 8px;" loading="lazy" />
</div>

<p>${review.intro}</p>

<h3>Pluspunten</h3>
<ul>
${review.pros.map((pro: string) => `  <li>${pro}</li>`).join('\n')}
</ul>

<h3>Minpunten</h3>
<ul>
${review.cons.map((con: string) => `  <li>${con}</li>`).join('\n')}
</ul>

<p><strong>Prijs:</strong> ${price}</p>

<p><a href="${affiliateUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Bekijk beste prijs →</a></p>
`;
                
                productSectionsHtml += productSectionHtml;
                console.log(`✅ Created product section ${i + 1}: ${product.title}`);
              }
              
              // Insert product sections before the conclusion/FAQ
              // Find the last h2 section (usually conclusion)
              const lastH2Index = contentWithProducts.lastIndexOf('<h2>');
              
              if (lastH2Index > 0) {
                contentWithProducts = 
                  contentWithProducts.substring(0, lastH2Index) +
                  productSectionsHtml +
                  '\n\n' +
                  contentWithProducts.substring(lastH2Index);
              } else {
                // No conclusion found, append at the end
                contentWithProducts += '\n\n' + productSectionsHtml;
              }
              
              console.log(`✅ Total products inserted: ${validProducts.length}`);
            }
          } else {
            console.log('⚠️ No products found on Bol.com');
          }
        } catch (productError) {
          console.error('⚠️ Product insertion error:', productError);
          console.log('⚠️ Continuing without products');
        }
      } else {
        console.log('ℹ️ No Bol.com credentials configured, skipping product insertion');
      }

      await sendProgress(70, '🔗 Internal linking toepassen...');

      // Add internal links if sitemap available
      let finalHtml = contentWithProducts;
      if (project?.websiteUrl) {
        try {
          const sitemapData: SitemapData = await loadWordPressSitemap(project.websiteUrl);
          // Verhoog naar 7 links voor betere internal linking
          const relevantLinks = await findRelevantInternalLinksWithAI(
            sitemapData,
            articleIdea.title,
            keywords,
            7
          );
          
          if (relevantLinks && relevantLinks.length > 0) {
            // Vraag AI om 5-7 links toe te voegen (was 3)
            finalHtml = await insertInternalLinksIntoHTML(contentWithImages, relevantLinks, 7);
            console.log(`✅ Added ${relevantLinks.length} internal links (gevraagd: 7)`);
          }
        } catch (error) {
          console.log('⚠️ Could not add internal links:', error);
        }
      }

      await sendProgress(75, '🧹 Content valideren...');

      // Validate content
      const contentValidation = isContentValid(finalHtml);
      if (contentValidation.bannedWords.length > 0) {
        console.warn('⚠️ Found banned words in generated content:', contentValidation.bannedWords.slice(0, 5));
      }

      await sendProgress(80, '💾 Content opslaan in bibliotheek...');

      // Save to content library
      const saveResult = await autoSaveToLibrary({
        clientId: client.id,
        projectId: projectId || undefined,
        type: 'blog',
        title: articleIdea.title,
        content: finalHtml,
        category: articleIdea.category || 'blog',
        tags: keywords,
      });

      // Save featured image URL if generated
      if (saveResult.success && saveResult.contentId && featuredImageUrl) {
        try {
          await prisma.savedContent.update({
            where: { id: saveResult.contentId },
            data: { thumbnailUrl: featuredImageUrl },
          });
          console.log('✅ Featured image URL opgeslagen in content library');
        } catch (updateError) {
          console.error('⚠️ Could not save featured image URL:', updateError);
        }
      }

      await sendProgress(85, '📤 Publiceren...');

      // Determine if this is a WritgoAI project
      const isWritgoAiProject = client.email === 'info@WritgoAI.nl' && 
                                project?.websiteUrl?.includes('WritgoAI.nl');

      let publishedUrl = null;

      // 🚀 PUBLISH TO WRITGOAI BLOG IF ENABLED
      if (project?.autopilotPublishToWritgoaiBlog && isWritgoAiProject && saveResult.success && saveResult.contentId) {
        try {
          await sendProgress(87, '📝 Publiceren naar WritgoAI blog...');
          console.log('📝 Publishing to WritgoAI blog...');
          
          // Generate slug from focus keyword (short and SEO-friendly)
          let baseSlug = (keywords[0] || articleIdea.title)
            .toLowerCase()
            .replace(/[éèëê]/g, 'e')
            .replace(/[áàäâ]/g, 'a')
            .replace(/[óòöô]/g, 'o')
            .replace(/[úùüû]/g, 'u')
            .replace(/[íìïî]/g, 'i')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
          
          // Check if slug exists and make unique with numeric suffix
          let slug = baseSlug;
          let counter = 2;
          
          while (await prisma.blogPost.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
          }
          
          // Extract excerpt from first paragraph
          const firstParagraph = finalHtml.match(/<p>(.*?)<\/p>/)?.[1] || '';
          const excerpt = firstParagraph
            .replace(/<[^>]+>/g, '')
            .substring(0, 300)
            .trim();
          
          // Calculate word count and reading time
          const wordCount = finalHtml.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
          const readingTimeMinutes = Math.max(5, Math.round(wordCount / 200));
          
          // Use the featured image that was already generated (or fallback to first image in content)
          const featuredImage = featuredImageUrl || (finalHtml.match(/<img[^>]+src="([^">]+)"/)?.[1] || null);
          
          await sendProgress(90, '✍️ Blog post aanmaken...');
          
          // Create blog post
          const blogPost = await prisma.blogPost.create({
            data: {
              title: articleIdea.title,
              slug: slug,
              excerpt: excerpt || articleIdea.title,
              content: finalHtml,
              featuredImage: featuredImage,
              metaTitle: articleIdea.title.substring(0, 60),
              metaDescription: (excerpt || articleIdea.title).substring(0, 155),
              focusKeyword: keywords[0] || articleIdea.title.split(' ')[0],
              category: articleIdea.category || 'AI & Content Marketing',
              tags: keywords,
              status: 'published',
              publishedAt: new Date(),
              authorName: 'WritgoAI Redactie',
              readingTimeMinutes: readingTimeMinutes,
              views: 0
            }
          });
          
          publishedUrl = `https://WritgoAI.nl/${slug}`;
          console.log(`✅ Published to WritgoAI blog: ${publishedUrl}`);
          console.log(`   Blog Post ID: ${blogPost.id}`);
          
          await sendProgress(93, '🔗 URL bijwerken...');
          
          // Update saved content with published URL
          await prisma.savedContent.update({
            where: { id: saveResult.contentId },
            data: {
              publishedUrl: publishedUrl,
              publishedAt: new Date(),
            },
          });

        } catch (error) {
          console.error('❌ Failed to publish to WritgoAI blog:', error);
          await sendProgress(93, '⚠️ Publicatie mislukt, content is opgeslagen in bibliotheek');
          // Don't fail the whole job if blog publish fails
        }
      }

      // 🚀 PUBLISH TO WORDPRESS IF NOT A WRITGOAI PROJECT
      if (project && saveResult.success && saveResult.contentId && !isWritgoAiProject) {
        // Get WordPress credentials from project or client
        let wpConfig = {
          siteUrl: project.wordpressUrl || '',
          username: '',
          password: '',
        };

        // Get credentials from project or fallback to client
        if (project.wordpressUrl) {
          const projectWithCreds = await prisma.project.findUnique({
            where: { id: project.id },
            select: {
              wordpressUsername: true,
              wordpressPassword: true,
              client: {
                select: {
                  wordpressUsername: true,
                  wordpressPassword: true,
                }
              }
            },
          });

          if (projectWithCreds) {
            wpConfig.username = projectWithCreds.wordpressUsername || projectWithCreds.client.wordpressUsername || '';
            wpConfig.password = projectWithCreds.wordpressPassword || projectWithCreds.client.wordpressPassword || '';
          }
        }

        // Only publish if we have complete WordPress config
        if (wpConfig.siteUrl && wpConfig.username && wpConfig.password) {
          try {
            await sendProgress(87, '📝 SEO metadata genereren...');
            
            // Generate SEO metadata
            const seoTitle = generateSeoTitle(articleIdea.title);
            const metaDescription = await generateMetaDescription(articleIdea.title, finalHtml, keywords[0] || '');
            const focusKeyword = keywords[0] || '';
            
            console.log('✅ SEO Title:', seoTitle);
            console.log('✅ Meta Description:', metaDescription);
            console.log('✅ Focus Keyword:', focusKeyword);
            
            // Featured image is already generated earlier, no need to generate again
            console.log('✅ Featured image URL (already generated):', featuredImageUrl || 'none');
            
            await sendProgress(91, '🚀 Artikel publiceren naar WordPress...');
            
            // Use the same publish function as the Content Library
            const publishResult = await publishToWordPress(
              {
                siteUrl: wpConfig.siteUrl,
                username: wpConfig.username,
                applicationPassword: wpConfig.password,
              },
              {
                title: articleIdea.title,
                content: finalHtml,
                excerpt: metaDescription,
                status: 'publish',
                categories: wordpressCategory ? [parseInt(wordpressCategory)] : [],
                tags: keywords,
                featuredImageUrl: featuredImageUrl || undefined,
                seoTitle,
                seoDescription: metaDescription,
                focusKeyword,
                useGutenberg: true,
              }
            );

            publishedUrl = publishResult.link;
            
            // Update saved content with published URL and SEO data
            await prisma.savedContent.update({
              where: { id: saveResult.contentId },
              data: {
                publishedUrl,
                publishedAt: new Date(),
                metaDesc: metaDescription,
                keywords: keywords,
              },
            });
            
            console.log('✅ Published to WordPress:', publishedUrl);
            console.log('✅ SEO metadata toegevoegd');
            console.log('✅ Featured image ingesteld');
          } catch (wpError: any) {
            console.error('❌ WordPress publish error:', wpError);
            console.log('⚠️ WordPress publicatie mislukt:', wpError.message);
            console.log('⚠️ Content is wel opgeslagen in de Content Library');
            // Continue even if publish fails - content is already saved
          }
        } else {
          console.log('⚠️ WordPress credentials niet compleet, publicatie overgeslagen');
        }
      }

      await sendProgress(95, '✅ Finaliseren...');

      // Update article idea
      await prisma.articleIdea.update({
        where: { id: articleId },
        data: {
          status: 'published',
          hasContent: true,
          contentId: saveResult.contentId || null,
          publishedAt: publishedUrl ? new Date() : undefined,
        },
      });

      // Deduct credits
      if (!client.isUnlimited) {
        await deductCredits(client.id, requiredCredits, `Quick Generate & Publish: ${articleIdea.title}`);
      }

      await sendProgress(100, '🎉 Klaar!');
      await sendComplete({
        success: true,
        contentId: saveResult.contentId,
        publishedUrl,
        title: articleIdea.title,
        message: publishedUrl 
          ? '✅ Artikel gegenereerd en gepubliceerd!'
          : '✅ Artikel gegenereerd en opgeslagen!',
      });

    } catch (error: any) {
      console.error('Quick generate error:', error);
      await sendError(error.message || 'Er is een fout opgetreden tijdens het genereren');
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
