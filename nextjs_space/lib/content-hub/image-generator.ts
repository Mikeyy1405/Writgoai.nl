/**
 * Image Generator for Content Hub
 * Generates featured images and article images using FLUX or free stock images
 */

import { generateImage } from '../smart-image-generator';

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
}

/**
 * Generate an image for article content
 */
export async function generateArticleImage(
  options: ImageGenerationOptions
): Promise<GeneratedImage> {
  try {
    console.log(`[Image Generator] Generating image: ${options.prompt}`);
    
    const imageUrl = await generateImage({
      prompt: options.prompt,
      model: options.model || 'flux-pro',
      aspectRatio: options.aspectRatio || '16:9',
      projectId: null, // Content Hub context
      useFreeStockImages: options.useFreeStock || false,
    });
    
    return {
      url: imageUrl,
      prompt: options.prompt,
      source: options.useFreeStock ? 'stock' : 'ai',
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
