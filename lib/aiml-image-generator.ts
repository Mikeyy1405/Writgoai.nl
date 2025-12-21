/**
 * AIML Image Generation with Flux Pro
 * Uses AIML API for high-quality AI-generated images
 */

interface ImageGenerationOptions {
  title: string;
  description?: string;
  style?: 'photorealistic' | 'illustration' | 'abstract' | 'minimalist';
  aspectRatio?: '16:9' | '4:3' | '1:1' | '3:4';
}

interface ImageGenerationResult {
  url: string;
  width: number;
  height: number;
  seed: number;
}

const AIML_API_KEY = process.env.AIML_API_KEY;
const AIML_API_URL = 'https://api.aimlapi.com/v1/images/generations';

/**
 * Generate featured image using Flux Pro 1.1
 */
export async function generateFeaturedImage(
  options: ImageGenerationOptions
): Promise<string | null> {
  if (!AIML_API_KEY) {
    console.warn('AIML_API_KEY not set, falling back to Unsplash');
    return fallbackToUnsplash(options.title);
  }

  try {
    const prompt = buildPrompt(options);
    const imageSize = getImageSize(options.aspectRatio || '16:9');

    const response = await fetch(AIML_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'flux-pro/v1.1',
        prompt: prompt,
        image_size: imageSize,
        num_images: 1,
        output_format: 'jpeg',
        safety_tolerance: '2',
        enable_safety_checker: true
      })
    });

    if (!response.ok) {
      throw new Error(`AIML API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.images && data.images.length > 0) {
      return data.images[0].url;
    }

    throw new Error('No image generated');

  } catch (error) {
    console.error('AIML image generation error:', error);
    // Fallback to Unsplash if AIML fails
    return fallbackToUnsplash(options.title);
  }
}

/**
 * Build optimized prompt for Flux Pro
 */
function buildPrompt(options: ImageGenerationOptions): string {
  const { title, description, style = 'photorealistic' } = options;

  // Extract main topic from title
  const topic = extractTopic(title);

  // Style presets for Flux Pro
  const stylePresets = {
    photorealistic: 'photorealistic, high quality, professional photography, sharp focus, detailed',
    illustration: 'digital illustration, modern, clean, professional, vector art style',
    abstract: 'abstract, modern, minimalist, geometric shapes, professional',
    minimalist: 'minimalist, clean, simple, professional, modern design'
  };

  const stylePrompt = stylePresets[style];

  // Build comprehensive prompt
  const prompt = `${topic}, ${stylePrompt}, suitable for blog header image, tech website aesthetic, modern and professional, high resolution, 4k quality`;

  return prompt;
}

/**
 * Extract main topic from article title
 */
function extractTopic(title: string): string {
  // Remove common SEO words
  const cleanTitle = title
    .toLowerCase()
    .replace(/complete guide|ultimate guide|how to|what is|waarom|hoe|wat is/gi, '')
    .trim();

  // Extract key concepts
  const keywords = cleanTitle.split(/[\s:]+/).filter(word => word.length > 3);

  // Build topic description
  if (keywords.includes('google') || keywords.includes('seo')) {
    return 'modern tech workspace with SEO analytics dashboard, Google search interface';
  }
  
  if (keywords.includes('ai') || keywords.includes('chatgpt') || keywords.includes('openai')) {
    return 'futuristic AI technology, neural network visualization, modern tech interface';
  }
  
  if (keywords.includes('wordpress') || keywords.includes('website')) {
    return 'modern website development, WordPress dashboard, web design workspace';
  }
  
  if (keywords.includes('content') || keywords.includes('marketing')) {
    return 'content creation workspace, digital marketing concept, modern office setup';
  }

  // Default: generic tech/SEO image
  return 'modern digital marketing workspace, SEO optimization concept, professional tech environment';
}

/**
 * Get image size based on aspect ratio
 */
function getImageSize(aspectRatio: string): { width: number; height: number } {
  const sizes = {
    '16:9': { width: 1280, height: 720 },   // Blog featured image
    '4:3': { width: 1024, height: 768 },    // Standard
    '1:1': { width: 1024, height: 1024 },   // Square
    '3:4': { width: 768, height: 1024 }     // Portrait
  };

  return sizes[aspectRatio as keyof typeof sizes] || sizes['16:9'];
}

/**
 * Fallback to Unsplash if AIML fails
 */
async function fallbackToUnsplash(title: string): Promise<string> {
  const keywords = extractKeywords(title);
  
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!accessKey) {
    // Ultimate fallback: generic tech image
    return 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1280&h=720&fit=crop';
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(keywords)}&orientation=landscape&w=1280&h=720`,
      {
        headers: {
          'Authorization': `Client-ID ${accessKey}`
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.urls.regular;
    }
  } catch (error) {
    console.error('Unsplash fallback error:', error);
  }

  // Ultimate fallback
  return 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1280&h=720&fit=crop';
}

/**
 * Extract keywords for Unsplash search
 */
function extractKeywords(title: string): string {
  const stopWords = ['de', 'het', 'een', 'voor', 'in', 'op', 'van', 'met', 'en', 'is', 'wat', 'hoe', 'waarom'];
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(' ')
    .filter(word => word.length > 3 && !stopWords.includes(word));
  
  return words.slice(0, 3).join(' ') || 'technology';
}

/**
 * Generate article images (for in-content images)
 */
export async function generateArticleImages(
  content: string,
  count: number = 2
): Promise<string[]> {
  // For now, use Unsplash for article images
  // Can be upgraded to Flux Pro later
  const placeholders = [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop', // Analytics
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop', // Tech workspace
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=400&fit=crop'  // Coding
  ];
  
  return placeholders.slice(0, count);
}

/**
 * Generate alt text for SEO
 */
export function generateAltText(title: string, imageContext: string = ''): string {
  const keywords = extractKeywords(title);
  return imageContext 
    ? `${imageContext} - ${keywords}` 
    : `Illustratie voor ${keywords}`;
}
