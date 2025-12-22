/**
 * AIML Image Generation with Flux Pro
 * Uses AIML API for high-quality AI-generated images
 */

interface ImageGenerationOptions {
  prompt: string;
  style?: 'photorealistic' | 'illustration' | 'abstract' | 'minimalist' | 'artistic';
  aspectRatio?: '16:9' | '4:3' | '1:1' | '3:4' | '9:16';
  model?: 'flux-pro' | 'flux-pro/v1.1' | 'flux-pro/v1.1-ultra';
}

interface ImageGenerationResult {
  url: string;
  success: boolean;
  error?: string;
}

const AIML_API_KEY = process.env.AIML_API_KEY;
const AIML_API_URL = 'https://api.aimlapi.com/v2/generate/image';

/**
 * Generate image using Flux Pro via AIML API
 */
export async function generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
  if (!AIML_API_KEY) {
    console.error('AIML_API_KEY not set');
    return { url: '', success: false, error: 'API key niet geconfigureerd' };
  }

  try {
    const { prompt, style = 'photorealistic', aspectRatio = '16:9', model = 'flux-pro/v1.1' } = options;
    
    // Build enhanced prompt based on style
    const enhancedPrompt = buildEnhancedPrompt(prompt, style);
    const imageSize = getImageSize(aspectRatio);

    console.log('Generating image with Flux Pro:', { model, prompt: enhancedPrompt.substring(0, 100) });

    const response = await fetch(AIML_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: enhancedPrompt,
        image_size: `${imageSize.width}x${imageSize.height}`,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        safety_tolerance: 2
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AIML API error:', response.status, errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AIML response:', JSON.stringify(data).substring(0, 300));

    // Handle different response formats
    let imageUrl = '';
    
    if (data.images && data.images.length > 0) {
      imageUrl = data.images[0].url || data.images[0];
    } else if (data.data && data.data.length > 0) {
      imageUrl = data.data[0].url || data.data[0].b64_json;
    } else if (data.output && data.output.length > 0) {
      imageUrl = data.output[0];
    } else if (data.url) {
      imageUrl = data.url;
    } else if (data.image_url) {
      imageUrl = data.image_url;
    }

    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    return { url: imageUrl, success: true };

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
 */
export async function generateFeaturedImage(
  title: string,
  description?: string
): Promise<string | null> {
  const topic = extractTopic(title);
  const prompt = description 
    ? `${topic}, ${description}`
    : `${topic}, professional blog header image, modern design`;

  const result = await generateImage({
    prompt,
    style: 'photorealistic',
    aspectRatio: '16:9',
    model: 'flux-pro/v1.1'
  });

  if (result.success) {
    return result.url;
  }

  // Fallback to Unsplash
  return fallbackToUnsplash(title);
}

/**
 * Generate in-article image
 */
export async function generateArticleImage(
  prompt: string,
  style: 'photorealistic' | 'illustration' | 'abstract' = 'photorealistic'
): Promise<string | null> {
  const result = await generateImage({
    prompt,
    style,
    aspectRatio: '16:9',
    model: 'flux-pro/v1.1'
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
  
  return `${prompt}, ${enhancement}, suitable for professional blog, high resolution`;
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

  // Default: use cleaned title as base
  return `${cleanTitle}, modern professional concept, tech industry`;
}

/**
 * Get image size based on aspect ratio
 */
function getImageSize(aspectRatio: string): { width: number; height: number } {
  const sizes: Record<string, { width: number; height: number }> = {
    '16:9': { width: 1280, height: 720 },
    '4:3': { width: 1024, height: 768 },
    '1:1': { width: 1024, height: 1024 },
    '3:4': { width: 768, height: 1024 },
    '9:16': { width: 720, height: 1280 }
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
