
/**
 * Pixabay API Integration
 * Zoekt gratis stock foto's via Pixabay
 */

export interface PixabayImage {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  previewURL: string;
  previewWidth: number;
  previewHeight: number;
  webformatURL: string;
  webformatWidth: number;
  webformatHeight: number;
  largeImageURL: string;
  imageWidth: number;
  imageHeight: number;
  imageSize: number;
  views: number;
  downloads: number;
  likes: number;
  user: string;
  userImageURL: string;
}

export interface PixabaySearchResult {
  total: number;
  totalHits: number;
  hits: PixabayImage[];
}

/**
 * Zoekt afbeeldingen op Pixabay
 */
export async function searchPixabayImages(
  query: string,
  options: {
    perPage?: number;
    page?: number;
    orientation?: 'horizontal' | 'vertical' | 'all';
    category?: string;
    minWidth?: number;
    minHeight?: number;
    colors?: string;
    imageType?: 'photo' | 'illustration' | 'vector' | 'all';
    order?: 'popular' | 'latest';
    safeSearch?: boolean;
  } = {}
): Promise<PixabaySearchResult> {
  const apiKey = process.env.PIXABAY_API_KEY;
  
  if (!apiKey) {
    throw new Error('Pixabay API key niet gevonden');
  }

  const params = new URLSearchParams({
    key: apiKey,
    q: encodeURIComponent(query),
    per_page: String(options.perPage || 20),
    page: String(options.page || 1),
    orientation: options.orientation || 'all',
    image_type: options.imageType || 'photo',
    order: options.order || 'popular',
    safesearch: options.safeSearch !== false ? 'true' : 'false',
  });

  if (options.category) {
    params.append('category', options.category);
  }
  if (options.minWidth) {
    params.append('min_width', String(options.minWidth));
  }
  if (options.minHeight) {
    params.append('min_height', String(options.minHeight));
  }
  if (options.colors) {
    params.append('colors', options.colors);
  }

  try {
    const response = await fetch(`https://pixabay.com/api/?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status}`);
    }

    const data: PixabaySearchResult = await response.json();
    return data;
    
  } catch (error) {
    console.error('Pixabay search error:', error);
    throw error;
  }
}

/**
 * Download een Pixabay afbeelding naar onze S3
 */
export async function downloadPixabayImage(imageUrl: string): Promise<Buffer> {
  try {
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
    
  } catch (error) {
    console.error('Image download error:', error);
    throw error;
  }
}

/**
 * Legacy function for backwards compatibility
 */
export async function getPixabayImageForTopic(topic: string): Promise<string | null> {
  try {
    const results = await searchPixabayImages(topic, {
      perPage: 1,
      orientation: 'horizontal',
      imageType: 'photo',
    });

    if (results.hits && results.hits.length > 0) {
      return results.hits[0].largeImageURL;
    }

    return null;
  } catch (error) {
    console.error('Failed to get Pixabay image:', error);
    return null;
  }
}

/**
 * Legacy function for backwards compatibility
 */
export async function getPixabayImagesForArticle(keywords: string[], count: number = 3): Promise<string[]> {
  try {
    const query = keywords.join(' ');
    const results = await searchPixabayImages(query, {
      perPage: count,
      orientation: 'horizontal',
      imageType: 'photo',
    });

    if (results.hits && results.hits.length > 0) {
      return results.hits.map(hit => hit.largeImageURL);
    }

    return [];
  } catch (error) {
    console.error('Failed to get Pixabay images:', error);
    return [];
  }
}
