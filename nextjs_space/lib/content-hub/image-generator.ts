/**
 * Image Generator for Content Hub
 * Generates featured images and article images using FLUX or free stock images
 * Enhanced with Pexels/Unsplash integration and SEO-optimized alt text
 */

import { generateSmartImage } from '../smart-image-generator';
import { searchFreeStockImages, type StockImageResult } from '../free-stock-images';

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
  // Create a descriptive prompt for the featured image
  const prompt = `Professional, high-quality featured image for article titled "${articleTitle}". Related to: ${keywords.slice(0, 3).join(', ')}. Clean, modern style. Suitable for blog post header.`;
  
  return generateArticleImage({
    prompt,
    aspectRatio: '16:9',
    ...options,
  });
}

/**
 * Generate image prompts from article content
 * Note: This function extracts text from HTML for use as AI image generation prompts only.
 * The output is never inserted back into HTML, so XSS concerns don't apply here.
 */
export function extractImagePrompts(
  content: string,
  articleTitle: string,
  maxImages: number = 3
): string[] {
  const prompts: string[] = [];
  
  // Extract H2 headings as potential image topics
  // Using simple regex for extraction since output is only used for AI prompts, not HTML
  const headingMatches = content.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
  const headings = headingMatches
    .map(h => {
      // Strip HTML tags - safe here since we're generating prompts, not rendering HTML
      let text = h.replace(/<[^>]*>/g, '');
      // Remove potentially problematic characters for AI prompts
      text = text.replace(/[<>'"]/g, '').trim();
      return text;
    })
    .filter(h => h.length > 0 && h.length < 200) // Reasonable length for prompts
    .slice(0, maxImages);
  
  headings.forEach(heading => {
    prompts.push(`Professional illustration for: ${heading}. Modern, clean style.`);
  });
  
  // If we don't have enough headings, add a generic one
  if (prompts.length === 0) {
    const cleanTitle = articleTitle.replace(/[<>'"]/g, '').substring(0, 200);
    prompts.push(`Professional image for article about: ${cleanTitle}`);
  }
  
  return prompts.slice(0, maxImages);
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
