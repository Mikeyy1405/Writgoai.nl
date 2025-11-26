
/**
 * Stock Video API Integration
 * Zoekt gratis stock video's via Pixabay en Pexels
 */

export interface StockVideo {
  id: string | number;
  source: 'pixabay' | 'pexels';
  previewURL: string;
  videoURL: string;
  width: number;
  height: number;
  duration: number;
  tags: string[];
  user: string;
  thumbnail: string;
}

export interface StockVideoSearchResult {
  total: number;
  videos: StockVideo[];
}

/**
 * Zoekt video's op Pixabay
 */
export async function searchPixabayVideos(
  query: string,
  options: {
    perPage?: number;
    page?: number;
    minDuration?: number;
    maxDuration?: number;
  } = {}
): Promise<StockVideoSearchResult> {
  const apiKey = process.env.PIXABAY_API_KEY;
  
  if (!apiKey) {
    throw new Error('Pixabay API key niet gevonden');
  }

  const params = new URLSearchParams({
    key: apiKey,
    q: encodeURIComponent(query),
    per_page: String(options.perPage || 20),
    page: String(options.page || 1),
    video_type: 'all',
  });

  try {
    const response = await fetch(`https://pixabay.com/api/videos/?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter by duration if specified
    let filteredHits = data.hits || [];
    if (options.minDuration) {
      filteredHits = filteredHits.filter((hit: any) => hit.duration >= options.minDuration!);
    }
    if (options.maxDuration) {
      filteredHits = filteredHits.filter((hit: any) => hit.duration <= options.maxDuration!);
    }

    const videos: StockVideo[] = filteredHits.map((hit: any) => ({
      id: hit.id,
      source: 'pixabay',
      previewURL: hit.videos?.tiny?.url || hit.videos?.small?.url || '',
      videoURL: hit.videos?.large?.url || hit.videos?.medium?.url || '',
      width: hit.videos?.large?.width || 1920,
      height: hit.videos?.large?.height || 1080,
      duration: hit.duration,
      tags: hit.tags?.split(', ') || [],
      user: hit.user || 'Unknown',
      thumbnail: hit.userImageURL || '',
    }));

    return {
      total: data.total || 0,
      videos,
    };
    
  } catch (error) {
    console.error('Pixabay video search error:', error);
    throw error;
  }
}

/**
 * Download een stock video (returns URL for client-side download)
 */
export async function getStockVideoDownloadUrl(video: StockVideo): Promise<string> {
  // Return the video URL directly for client-side download
  return video.videoURL;
}

/**
 * Zoekt video's met automatische Engels vertaling
 */
export async function searchStockVideosTranslated(
  query: string,
  options?: {
    perPage?: number;
    page?: number;
    minDuration?: number;
    maxDuration?: number;
  }
): Promise<StockVideoSearchResult> {
  // Import translation utility
  const { translateToEnglish } = await import('./prompt-translator');
  
  console.log('Original video search query:', query);
  const englishQuery = await translateToEnglish(query);
  console.log('Translated video query:', englishQuery);
  
  return searchPixabayVideos(englishQuery, options);
}
