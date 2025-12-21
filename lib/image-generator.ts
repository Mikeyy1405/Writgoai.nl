/**
 * AI Image Generation for WritGo Articles
 * Uses AIML API to generate relevant featured images
 */

interface ImageGenerationOptions {
  title: string;
  description?: string;
  style?: 'photorealistic' | 'illustration' | 'abstract' | 'minimalist';
  aspectRatio?: '16:9' | '4:3' | '1:1';
}

export async function generateFeaturedImage(options: ImageGenerationOptions): Promise<string | null> {
  const {
    title,
    description = '',
    style = 'photorealistic',
    aspectRatio = '16:9'
  } = options;

  try {
    // For now, use Unsplash API for free high-quality images
    // Later can be replaced with AIML image generation
    const keywords = extractKeywords(title);
    const imageUrl = await fetchUnsplashImage(keywords);
    
    return imageUrl;
  } catch (error) {
    console.error('Image generation error:', error);
    return null;
  }
}

function extractKeywords(title: string): string {
  // Extract main keywords from title
  const stopWords = ['de', 'het', 'een', 'voor', 'in', 'op', 'van', 'met', 'en', 'is', 'wat', 'hoe', 'waarom'];
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(' ')
    .filter(word => word.length > 3 && !stopWords.includes(word));
  
  // Return first 2-3 meaningful words
  return words.slice(0, 3).join(' ') || 'technology';
}

async function fetchUnsplashImage(keywords: string): Promise<string> {
  // Unsplash API (free tier)
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!accessKey) {
    // Fallback to placeholder if no API key
    return `https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200&h=630&fit=crop`;
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(keywords)}&orientation=landscape&w=1200&h=630`,
      {
        headers: {
          'Authorization': `Client-ID ${accessKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Unsplash API error');
    }

    const data = await response.json();
    return data.urls.regular;
  } catch (error) {
    console.error('Unsplash fetch error:', error);
    // Fallback to generic tech image
    return `https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200&h=630&fit=crop`;
  }
}

/**
 * Generate article images using AIML API (future implementation)
 */
export async function generateArticleImages(
  content: string,
  count: number = 3
): Promise<string[]> {
  // TODO: Implement AIML image generation
  // For now, return placeholder images
  const placeholders = [
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=400&fit=crop'
  ];
  
  return placeholders.slice(0, count);
}

/**
 * Optimize alt text for SEO
 */
export function generateAltText(title: string, imageContext: string = ''): string {
  const keywords = extractKeywords(title);
  return imageContext 
    ? `${imageContext} - ${keywords}` 
    : `Illustratie voor ${keywords}`;
}
