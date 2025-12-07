/**
 * Image Generator for Content Hub
 * Generates featured images and article images using FLUX or free stock images
 * Enhanced with Pexels/Unsplash integration and SEO-optimized alt text
 */

import { generateSmartImage } from '../smart-image-generator';
import { searchFreeStockImages, type StockImageResult } from '../free-stock-images';
import { extractEnhancedImageContext } from '../image-context-enhancer';

// SEO constants for image optimization
const SEO_ALT_TEXT_MAX_WORDS = 15;
const SEO_ALT_TEXT_MAX_CHARS = 125;
const SEO_ALT_TEXT_MAX_CHARS_TRUNCATE = 122;
const SEO_FILENAME_MAX_LENGTH = 50;
const DEFAULT_IMAGE_EXTENSION = '.jpg';
const DEFAULT_IMAGES_PER_ARTICLE = 7;

export interface ImageGenerationOptions {
  prompt: string;
  model?: 'flux-pro' | 'flux-dev' | 'flux-schnell';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  useFreeStock?: boolean;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  source: 'ai' | 'stock';
  altText?: string; // SEO-optimized alt text
  filename?: string; // SEO-optimized filename
  photographer?: string;
  photographerUrl?: string;
}

/**
 * Generate an image for article content
 */
export async function generateArticleImage(
  options: ImageGenerationOptions
): Promise<GeneratedImage> {
  try {
    console.log(`[Image Generator] Generating image: ${options.prompt}`);
    
    // Map aspect ratio to width/height
    const aspectRatioDimensions: Record<string, { width: number; height: number }> = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1920, height: 1080 },
      '9:16': { width: 1080, height: 1920 },
      '4:3': { width: 1600, height: 1200 },
      '3:4': { width: 1200, height: 1600 },
    };
    
    const dimensions = aspectRatioDimensions[options.aspectRatio || '16:9'];
    
    const result = await generateSmartImage({
      prompt: options.prompt,
      // No projectId - Content Hub context without specific project
      type: 'featured', // Content hub images are featured images
      width: dimensions.width,
      height: dimensions.height,
    });
    
    if (!result.success || !result.imageUrl) {
      throw new Error(result.error || 'Image generation failed');
    }
    
    return {
      url: result.imageUrl,
      prompt: options.prompt,
      source: result.source === 'free-stock' ? 'stock' : 'ai',
    };
  } catch (error: any) {
    console.error('[Image Generator] Error:', error);
    throw new Error(`Image generation failed: ${error.message}`);
  }
}

/**
 * Generate multiple images for an article
 */
export async function generateArticleImages(
  prompts: string[],
  options?: Partial<ImageGenerationOptions>
): Promise<GeneratedImage[]> {
  const images: GeneratedImage[] = [];
  
  for (const prompt of prompts) {
    try {
      const image = await generateArticleImage({
        prompt,
        ...options,
      });
      images.push(image);
    } catch (error) {
      console.error(`[Image Generator] Failed to generate image for: ${prompt}`, error);
      // Continue with other images
    }
  }
  
  return images;
}

/**
 * Generate a featured image for an article
 */
export async function generateFeaturedImage(
  articleTitle: string,
  keywords: string[],
  options?: Partial<ImageGenerationOptions>
): Promise<GeneratedImage> {
  // Create ultra-realistic prompt for featured image
  const keywordContext = keywords.slice(0, 3).join(', ');
  const prompt = `Ultra realistic photograph, 8K quality, professional photography:
Subject: ${articleTitle}
Keywords: ${keywordContext}
Style: Professional blog header, documentary photography, natural colors, sharp focus
Setting: Real-world environment, natural lighting, authentic scene
Technical: Shot on Sony A7R IV, 50mm lens, f/2.8, professional studio or natural daylight
Quality: Hero image, photorealistic, magazine quality, suitable for article header
Composition: Wide aspect ratio, centered subject, professional framing
Exclude: NO cartoon, NO illustration, NO 3D render, NO digital art, NO text, NO watermarks`;
  
  return generateArticleImage({
    prompt,
    aspectRatio: '16:9',
    model: 'flux-pro', // Force Flux Pro for featured images
    ...options,
  });
}

/**
 * Generate ultra-realistic image prompts from article content
 * Enhanced to extract richer context including paragraphs for better relevance
 * Note: This function extracts text from HTML for use as AI image generation prompts only.
 * The output is never inserted back into HTML, so XSS concerns don't apply here.
 */
export function extractImagePrompts(
  content: string,
  articleTitle: string,
  maxImages: number = 3
): string[] {
  const prompts: string[] = [];
  
  // Extract H2 headings with their positions for context extraction
  // Using simple regex for extraction since output is only used for AI prompts, not HTML
  const headingMatches = Array.from(content.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi));
  
  // Limit to maxImages headings
  const selectedHeadings = headingMatches.slice(0, maxImages);
  
  selectedHeadings.forEach((match) => {
    const heading = match[1].replace(/<[^>]*>/g, '').replace(/[<>'"]/g, '').trim();
    const headingPosition = match.index || 0;
    
    // Extract enhanced context around this heading
    const context = extractEnhancedImageContext(content, headingPosition + match[0].length, {
      contextWindowBefore: 200,  // Small window before (just the heading area)
      contextWindowAfter: 600,   // Larger window after to get paragraph content
      maxParagraphs: 2,          // Get 2 paragraphs for context
    });
    
    // Build rich contextual prompt
    let contextualInfo = heading;
    if (context.paragraphs.length > 0) {
      // Add first paragraph snippet for richer context (limit to 150 chars)
      const paragraphSnippet = context.paragraphs[0].substring(0, 150);
      contextualInfo = `${heading}: ${paragraphSnippet}`;
    }
    
    // Generate ultra-realistic, specific prompts with enhanced context
    prompts.push(generateUltraRealisticPrompt(contextualInfo, articleTitle));
  });
  
  // If we don't have enough headings, add a generic one
  if (prompts.length === 0) {
    const cleanTitle = articleTitle.replace(/[<>'"]/g, '').substring(0, 200);
    prompts.push(generateUltraRealisticPrompt(cleanTitle, articleTitle));
  }
  
  return prompts.slice(0, maxImages);
}

/**
 * Generate ultra-realistic prompt for Flux Pro
 * Optimized for photorealistic, documentary-style images
 */
function generateUltraRealisticPrompt(topic: string, context: string): string {
  return `Ultra realistic photograph, 8K quality, professional photography:
Subject: ${topic}
Context: ${context}
Style: Documentary photography, natural colors, sharp focus, professional composition
Setting: Real-world authentic environment, natural lighting
Technical: Shot on Sony A7R IV, 85mm lens, f/1.8, natural daylight, high dynamic range
Quality: Photorealistic, crisp details, professional grade
Exclude: NO cartoon, NO illustration, NO 3D render, NO digital art, NO text overlays, NO watermarks, NO logos`;
}

/**
 * Generate SEO-optimized alt text for an image
 */
export function generateAltText(
  imageDescription: string,
  keywords: string[]
): string {
  // Create natural alt text that includes keywords
  const keyword = keywords[0] || '';
  const description = imageDescription
    .replace(/professional illustration for:/gi, '')
    .replace(/professional image for:/gi, '')
    .replace(/modern, clean style/gi, '')
    .trim();
  
  // Format: "Descriptive text met keyword in natuurlijke zin"
  let altText = description;
  
  // Add keyword if not already present
  if (keyword && !altText.toLowerCase().includes(keyword.toLowerCase())) {
    altText = `${description} - ${keyword}`;
  }
  
  // Ensure alt text is between 10-15 words and max 125 characters (SEO best practice)
  const words = altText.split(/\s+/);
  if (words.length > SEO_ALT_TEXT_MAX_WORDS) {
    altText = words.slice(0, SEO_ALT_TEXT_MAX_WORDS).join(' ');
  }
  
  if (altText.length > SEO_ALT_TEXT_MAX_CHARS) {
    altText = altText.substring(0, SEO_ALT_TEXT_MAX_CHARS_TRUNCATE) + '...';
  }
  
  return altText;
}

/**
 * Generate SEO-optimized filename for an image
 */
export function generateSEOFilename(
  description: string,
  keywords: string[],
  index: number = 0
): string {
  // Create descriptive filename with keywords
  const keyword = keywords[0] || 'image';
  const cleanDescription = description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, SEO_FILENAME_MAX_LENGTH);
  
  const cleanKeyword = keyword
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
  
  // Format: keyword-description-01.jpg
  return `${cleanKeyword}-${cleanDescription}-${String(index + 1).padStart(2, '0')}${DEFAULT_IMAGE_EXTENSION}`;
}

/**
 * Search for stock images with SEO optimization
 */
export async function searchStockImagesForArticle(
  prompts: string[],
  keywords: string[],
  count: number = 6
): Promise<GeneratedImage[]> {
  const images: GeneratedImage[] = [];
  
  console.log(`[Image Generator] Searching stock images for ${prompts.length} prompts...`);
  
  // Search for each prompt
  for (let i = 0; i < Math.min(prompts.length, count); i++) {
    const prompt = prompts[i];
    
    try {
      const results = await searchFreeStockImages({
        query: prompt.replace(/professional illustration for:/gi, '').trim(),
        orientation: 'horizontal',
        minWidth: 1200,
        minHeight: 600,
        count: 1,
      });
      
      if (results.length > 0) {
        const stockImage = results[0];
        const altText = generateAltText(prompt, keywords);
        const filename = generateSEOFilename(prompt, keywords, i);
        
        images.push({
          url: stockImage.url,
          prompt,
          source: 'stock',
          altText,
          filename,
          photographer: stockImage.photographer,
          photographerUrl: stockImage.photographerUrl,
        });
        
        console.log(`[Image Generator] Found stock image ${i + 1}: ${filename}`);
      }
    } catch (error) {
      console.error(`[Image Generator] Failed to find stock image for prompt ${i + 1}:`, error);
    }
  }
  
  console.log(`[Image Generator] Found ${images.length} stock images`);
  return images;
}

/**
 * Generate multiple images for an article (6-8 images)
 * Uses stock images as primary source for cost efficiency
 */
export async function generateArticleImagesWithAltText(
  articleTitle: string,
  articleContent: string,
  keywords: string[],
  targetImageCount: number = DEFAULT_IMAGES_PER_ARTICLE
): Promise<GeneratedImage[]> {
  console.log(`[Image Generator] Generating ${targetImageCount} images for article...`);
  
  // Extract image prompts from content
  const prompts = extractImagePrompts(articleContent, articleTitle, targetImageCount);
  
  // First try to get stock images (free and fast)
  const stockImages = await searchStockImagesForArticle(prompts, keywords, targetImageCount);
  
  // If we have enough stock images, return them
  if (stockImages.length >= Math.min(targetImageCount - 2, 5)) {
    console.log(`[Image Generator] Using ${stockImages.length} stock images`);
    return stockImages;
  }
  
  // Otherwise, combine stock images with AI-generated ones if needed
  console.log(`[Image Generator] Got ${stockImages.length} stock images, need ${targetImageCount - stockImages.length} more`);
  
  // For remaining images, we can generate AI images (but keep it minimal for cost)
  const remainingCount = Math.min(targetImageCount - stockImages.length, 2); // Max 2 AI images
  const aiImages: GeneratedImage[] = [];
  
  for (let i = 0; i < remainingCount && i < prompts.length; i++) {
    try {
      const aiImage = await generateArticleImage({
        prompt: prompts[stockImages.length + i],
        aspectRatio: '16:9',
        useFreeStock: false, // Force AI generation for fallback
      });
      
      aiImages.push({
        ...aiImage,
        altText: generateAltText(prompts[stockImages.length + i], keywords),
        filename: generateSEOFilename(prompts[stockImages.length + i], keywords, stockImages.length + i),
      });
    } catch (error) {
      console.error(`[Image Generator] Failed to generate AI image ${i + 1}:`, error);
    }
  }
  
  const allImages = [...stockImages, ...aiImages];
  console.log(`[Image Generator] Total images: ${allImages.length} (${stockImages.length} stock, ${aiImages.length} AI)`);
  
  return allImages;
}

/**
 * Insert images into article content after H2 sections
 * Places images strategically throughout the article
 */
export function insertImagesInContent(
  html: string,
  images: GeneratedImage[]
): string {
  if (!images || images.length === 0) {
    return html;
  }

  // Split content by H2 tags
  const h2Regex = /<h2/gi;
  const sections = html.split(h2Regex);
  
  if (sections.length <= 1) {
    // No H2 sections, return original content
    return html;
  }

  let result = sections[0]; // Intro section
  let imageIndex = 0;

  // Reconstruct content with images inserted after every 2-3 H2 sections
  for (let i = 1; i < sections.length; i++) {
    result += '<h2' + sections[i];

    // Insert image after every 2 sections (or 3 for longer articles)
    const insertFrequency = sections.length > 8 ? 3 : 2;
    
    if (i % insertFrequency === 0 && imageIndex < images.length) {
      const image = images[imageIndex];
      const altText = image.altText || `Afbeelding ${imageIndex + 1} bij artikel`;
      
      result += `
<figure style="margin: 2rem 0; text-align: center;">
  <img src="${image.url}" alt="${altText}" 
       style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" 
       loading="lazy" />
  ${image.photographer ? `<figcaption style="margin-top: 0.5rem; font-size: 0.875rem; color: #666;">Foto: ${image.photographer}</figcaption>` : ''}
</figure>`;
      imageIndex++;
    }
  }

  return result;
}

/**
 * Optimize image URL for WordPress upload
 */
export function prepareImageForWordPress(imageUrl: string): {
  url: string;
  filename: string;
} {
  // Extract filename from URL or generate one
  const urlParts = imageUrl.split('/');
  const lastPart = urlParts[urlParts.length - 1];
  const filename = lastPart.includes('.')
    ? lastPart
    : `image-${Date.now()}.jpg`;
  
  return {
    url: imageUrl,
    filename: filename.replace(/[^a-zA-Z0-9.-]/g, '_'),
  };
}
