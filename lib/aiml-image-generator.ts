/**
 * AIML Image Generation with Flux Pro
 * Uses AIML API for high-quality AI-generated images
 * 
 * API Documentation: https://docs.aimlapi.com/api-references/image-models/flux
 */

interface ImageGenerationOptions {
  prompt: string;
  style?: 'photorealistic' | 'illustration' | 'abstract' | 'minimalist' | 'artistic';
  aspectRatio?: '16:9' | '4:3' | '1:1' | '3:4' | '9:16';
  model?: 'flux-pro' | 'flux-pro/v1.1' | 'flux-pro/v1.1-ultra' | 'flux-realism' | 'flux/schnell';
  timeout?: number; // Timeout in milliseconds
}

interface ImageGenerationResult {
  url: string;
  success: boolean;
  error?: string;
}

const AIML_API_KEY = process.env.AIML_API_KEY;
// Correct endpoint per AIML API documentation
const AIML_API_URL = 'https://api.aimlapi.com/v1/images/generations';

/**
 * Generate image using Flux Pro via AIML API
 */
export async function generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
  if (!AIML_API_KEY) {
    console.error('AIML_API_KEY not set');
    return { url: '', success: false, error: 'API key niet geconfigureerd' };
  }

  try {
    const { prompt, style = 'photorealistic', aspectRatio = '16:9', model = 'flux-pro/v1.1', timeout = 30000 } = options;
    
    // Build enhanced prompt based on style
    const enhancedPrompt = buildEnhancedPrompt(prompt, style);
    const imageSize = getImageSize(aspectRatio);

    console.log('Generating image with Flux:', { model, prompt: enhancedPrompt.substring(0, 100), timeout });

    // Build request body based on model type
    const requestBody: Record<string, any> = {
      model: model,
      prompt: enhancedPrompt,
    };

    // flux-pro/v1.1-ultra has fixed size, others can specify size
    if (model !== 'flux-pro/v1.1-ultra') {
      requestBody.size = `${imageSize.width}x${imageSize.height}`;
    }

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(AIML_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIML_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AIML API error:', response.status, errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('AIML response:', JSON.stringify(data).substring(0, 500));

      // Handle response format per AIML API documentation
      // Response: { images: [{ url: "...", width: ..., height: ..., content_type: "..." }], ... }
      let imageUrl = '';
      
      if (data.images && data.images.length > 0) {
        imageUrl = data.images[0].url || data.images[0];
      } else if (data.data && data.data.length > 0) {
        // OpenAI-compatible format fallback
        imageUrl = data.data[0].url || data.data[0].b64_json;
      } else if (data.output && data.output.length > 0) {
        imageUrl = data.output[0];
      } else if (data.url) {
        imageUrl = data.url;
      } else if (data.image_url) {
        imageUrl = data.image_url;
      }

      if (!imageUrl) {
        console.error('No image URL in response:', JSON.stringify(data));
        throw new Error('No image URL in response');
      }

      return { url: imageUrl, success: true };
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('Image generation timeout after', timeout, 'ms');
        throw new Error(`Image generation timeout after ${timeout}ms`);
      }
      throw fetchError;
    }

  } catch (error: any) {
    console.error('Image generation error:', error);
    return { 
      url: '', 
      success: false, 
      error: error.message || 'Fout bij genereren afbeelding' 
    };
  }
}

/**
 * Generate featured image for article
 * Uses faster flux/schnell model with timeout for better performance (< 30 seconds)
 */
export async function generateFeaturedImage(
  title: string,
  description?: string
): Promise<string | null> {
  const topic = extractTopic(title);
  const prompt = description 
    ? `${topic}, ${description}`
    : `${topic}, professional blog header image, modern design`;

  // Use flux/schnell for faster generation (typically 5-15 seconds vs 30-60+ seconds for flux-pro)
  const result = await generateImage({
    prompt,
    style: 'photorealistic',
    aspectRatio: '16:9',
    model: 'flux/schnell', // Faster model for featured images
    timeout: 25000, // 25 second timeout to ensure < 30 second total time
  });

  if (result.success) {
    return result.url;
  }

  console.warn('Flux Schnell failed, falling back to Unsplash:', result.error);
  // Fallback to Unsplash
  return fallbackToUnsplash(title);
}

/**
 * Generate social media image - optimized for social platforms
 * Uses faster model for quicker generation
 */
export async function generateSocialImage(
  prompt: string,
  aspectRatio: '1:1' | '16:9' | '9:16' = '1:1'
): Promise<string | null> {
  const result = await generateImage({
    prompt: `${prompt}, vibrant colors, eye-catching, social media optimized, no text`,
    style: 'photorealistic',
    aspectRatio,
    model: 'flux/schnell', // Faster model
    timeout: 20000, // 20 second timeout
  });

  if (result.success) {
    return result.url;
  }

  console.warn('Social image generation failed:', result.error);
  return null;
}

/**
 * Generate in-article image
 * Uses faster model for quicker generation
 */
export async function generateArticleImage(
  prompt: string,
  style: 'photorealistic' | 'illustration' | 'abstract' = 'photorealistic'
): Promise<string | null> {
  const result = await generateImage({
    prompt,
    style,
    aspectRatio: '16:9',
    model: 'flux/schnell', // Faster model
    timeout: 20000, // 20 second timeout
  });

  if (result.success) {
    return result.url;
  }

  return null;
}

/**
 * Build enhanced prompt based on style
 */
function buildEnhancedPrompt(prompt: string, style: string): string {
  const styleEnhancements: Record<string, string> = {
    photorealistic: 'photorealistic, high quality, professional photography, sharp focus, detailed, 8k resolution',
    illustration: 'digital illustration, modern, clean, professional, vector art style, vibrant colors',
    abstract: 'abstract art, modern, minimalist, geometric shapes, professional, artistic',
    minimalist: 'minimalist design, clean, simple, professional, modern, white space',
    artistic: 'artistic, creative, unique style, professional quality, visually striking'
  };

  const enhancement = styleEnhancements[style] || styleEnhancements.photorealistic;
  
  // Important: NO TEXT in images - Flux doesn't handle text well
  return `${prompt}, ${enhancement}, no text, no words, no letters, no watermarks`;
}

/**
 * Extract main topic from article title
 */
function extractTopic(title: string): string {
  const cleanTitle = title
    .toLowerCase()
    .replace(/complete guide|ultimate guide|how to|what is|waarom|hoe|wat is|beste|top \d+/gi, '')
    .trim();

  const keywords = cleanTitle.split(/[\s:]+/).filter(word => word.length > 3);

  // Topic mapping for common subjects
  if (keywords.some(k => ['google', 'seo', 'zoekmachine'].includes(k))) {
    return 'modern SEO analytics dashboard, search engine optimization concept, digital marketing';
  }
  
  if (keywords.some(k => ['ai', 'chatgpt', 'openai', 'kunstmatige', 'intelligentie'].includes(k))) {
    return 'futuristic AI technology, neural network visualization, artificial intelligence concept';
  }
  
  if (keywords.some(k => ['wordpress', 'website', 'blog'].includes(k))) {
    return 'modern website development, WordPress dashboard, web design workspace';
  }
  
  if (keywords.some(k => ['content', 'marketing', 'strategie'].includes(k))) {
    return 'content creation workspace, digital marketing concept, creative office setup';
  }

  if (keywords.some(k => ['code', 'programmeren', 'developer', 'software'].includes(k))) {
    return 'modern coding workspace, software development, programming concept';
  }

  if (keywords.some(k => ['yoga', 'meditatie', 'mindfulness', 'wellness'].includes(k))) {
    return 'peaceful yoga practice, serene meditation space, wellness and mindfulness';
  }

  if (keywords.some(k => ['fitness', 'sport', 'training', 'gym'].includes(k))) {
    return 'modern fitness training, gym workout, healthy lifestyle';
  }

  if (keywords.some(k => ['food', 'eten', 'koken', 'recept', 'gezond'].includes(k))) {
    return 'delicious healthy food, beautiful food photography, culinary art';
  }

  // Default: use cleaned title as base
  return `${cleanTitle}, modern professional concept, high quality`;
}

/**
 * Get image size based on aspect ratio
 * Sizes must be multiples of 32 for Flux Pro
 */
function getImageSize(aspectRatio: string): { width: number; height: number } {
  const sizes: Record<string, { width: number; height: number }> = {
    '16:9': { width: 1280, height: 736 },  // 736 is closest multiple of 32 to 720
    '4:3': { width: 1024, height: 768 },
    '1:1': { width: 1024, height: 1024 },
    '3:4': { width: 768, height: 1024 },
    '9:16': { width: 736, height: 1280 }   // 736 is closest multiple of 32 to 720
  };

  return sizes[aspectRatio] || sizes['16:9'];
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
 * Generate alt text for SEO
 */
export function generateAltText(title: string, imageContext: string = ''): string {
  const keywords = extractKeywords(title);
  return imageContext 
    ? `${imageContext} - ${keywords}` 
    : `Illustratie voor ${keywords}`;
}
