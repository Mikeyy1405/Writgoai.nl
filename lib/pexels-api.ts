
/**
 * Pexels API Integration
 * Zoekt gratis stock foto's en video's via Pexels
 */

export interface PexelsImage {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

export interface PexelsSearchResult {
  page: number;
  per_page: number;
  photos: PexelsImage[];
  total_results: number;
  next_page?: string;
}

/**
 * Zoekt afbeeldingen op Pexels
 */
export async function searchPexelsImages(
  query: string,
  options: {
    perPage?: number;
    page?: number;
    orientation?: 'landscape' | 'portrait' | 'square';
    size?: 'large' | 'medium' | 'small';
    color?: string;
    locale?: string;
  } = {}
): Promise<PexelsSearchResult> {
  const apiKey = process.env.PEXELS_API_KEY;
  
  if (!apiKey) {
    throw new Error('Pexels API key niet gevonden');
  }

  const params = new URLSearchParams({
    query: encodeURIComponent(query),
    per_page: String(options.perPage || 20),
    page: String(options.page || 1),
  });

  if (options.orientation) {
    params.append('orientation', options.orientation);
  }
  if (options.size) {
    params.append('size', options.size);
  }
  if (options.color) {
    params.append('color', options.color);
  }
  if (options.locale) {
    params.append('locale', options.locale);
  }

  try {
    const response = await fetch(`https://api.pexels.com/v1/search?${params.toString()}`, {
      headers: {
        'Authorization': apiKey,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data: PexelsSearchResult = await response.json();
    return data;
    
  } catch (error) {
    console.error('Pexels search error:', error);
    throw error;
  }
}

/**
 * Download een Pexels afbeelding
 */
export async function downloadPexelsImage(imageUrl: string): Promise<Buffer> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'Authorization': process.env.PEXELS_API_KEY || '',
      },
    });
    
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
 * Haal curated (handgepickte) foto's op
 */
export async function getPexelsCuratedImages(
  options: {
    perPage?: number;
    page?: number;
  } = {}
): Promise<PexelsSearchResult> {
  const apiKey = process.env.PEXELS_API_KEY;
  
  if (!apiKey) {
    throw new Error('Pexels API key niet gevonden');
  }

  const params = new URLSearchParams({
    per_page: String(options.perPage || 20),
    page: String(options.page || 1),
  });

  try {
    const response = await fetch(`https://api.pexels.com/v1/curated?${params.toString()}`, {
      headers: {
        'Authorization': apiKey,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data: PexelsSearchResult = await response.json();
    return data;
    
  } catch (error) {
    console.error('Pexels curated error:', error);
    throw error;
  }
}

