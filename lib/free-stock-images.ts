
/**
 * 🖼️ Gratis Stock Image Service
 * Integreert met Pixabay, Pexels en Unsplash voor kosteloze afbeeldingen
 * 
 * COST: $0 per image! 🎉
 */

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY || '';
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';

export interface StockImageOptions {
  query: string;
  orientation?: 'horizontal' | 'vertical' | 'square';
  minWidth?: number;
  minHeight?: number;
  count?: number;
}

export interface StockImageResult {
  url: string;
  width: number;
  height: number;
  photographer?: string;
  photographerUrl?: string;
  source: 'pixabay' | 'pexels' | 'unsplash';
}

/**
 * Haal gratis stock foto's op van Pixabay
 */
async function searchPixabay(options: StockImageOptions): Promise<StockImageResult[]> {
  if (!PIXABAY_API_KEY) {
    console.log('⚠️  Pixabay API key niet ingesteld');
    return [];
  }

  try {
    const params = new URLSearchParams({
      key: PIXABAY_API_KEY,
      q: options.query,
      image_type: 'photo',
      orientation: options.orientation || 'horizontal',
      min_width: String(options.minWidth || 1920),
      min_height: String(options.minHeight || 1080),
      per_page: String(options.count || 3),
      safesearch: 'true',
    });

    const apiUrl = 'https://pixabay.com/api/?' + params.toString();
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.hits || data.hits.length === 0) {
      return [];
    }

    return data.hits.slice(0, options.count || 1).map((hit: any) => {
      const userId = hit.user_id || '';
      const userName = hit.user || '';
      const baseUrl = 'https://pixabay.com/users/';
      const userUrl = baseUrl + userName + '-' + userId + '/';
      
      return {
        url: hit.largeImageURL || hit.webformatURL,
        width: hit.imageWidth,
        height: hit.imageHeight,
        photographer: userName,
        photographerUrl: userUrl,
        source: 'pixabay' as const,
      };
    });
  } catch (error) {
    console.error('❌ Pixabay search error:', error);
    return [];
  }
}

/**
 * Haal gratis stock foto's op van Pexels
 */
async function searchPexels(options: StockImageOptions): Promise<StockImageResult[]> {
  if (!PEXELS_API_KEY) {
    console.log('⚠️  Pexels API key niet ingesteld');
    return [];
  }

  try {
    const params = new URLSearchParams({
      query: options.query,
      orientation: options.orientation || 'landscape',
      per_page: String(options.count || 3),
    });

    const apiUrl = 'https://api.pexels.com/v1/search?' + params.toString();
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    const data = await response.json();

    if (!data.photos || data.photos.length === 0) {
      return [];
    }

    return data.photos.slice(0, options.count || 1).map((photo: any) => ({
      url: photo.src.large2x || photo.src.large,
      width: photo.width,
      height: photo.height,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      source: 'pexels' as const,
    }));
  } catch (error) {
    console.error('❌ Pexels search error:', error);
    return [];
  }
}

/**
 * Haal gratis stock foto's op van Unsplash
 */
async function searchUnsplash(options: StockImageOptions): Promise<StockImageResult[]> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.log('⚠️  Unsplash API key niet ingesteld');
    return [];
  }

  try {
    const params = new URLSearchParams({
      query: options.query,
      orientation: options.orientation || 'landscape',
      per_page: String(options.count || 3),
    });

    const apiUrl = 'https://api.unsplash.com/search/photos?' + params.toString();
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: 'Client-ID ' + UNSPLASH_ACCESS_KEY,
      },
    });

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return [];
    }

    return data.results.slice(0, options.count || 1).map((photo: any) => ({
      url: photo.urls.regular,
      width: photo.width,
      height: photo.height,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      source: 'unsplash' as const,
    }));
  } catch (error) {
    console.error('❌ Unsplash search error:', error);
    return [];
  }
}

/**
 * 🎯 HOOFD FUNCTIE: Zoek gratis stock foto's van meerdere bronnen
 */
export async function searchFreeStockImages(
  options: StockImageOptions
): Promise<StockImageResult[]> {
  console.log('🔍 Searching free stock images for: "' + options.query + '"');

  // Probeer alle diensten parallel voor snelheid
  const [pixabayResults, pexelsResults, unsplashResults] = await Promise.all([
    searchPixabay(options),
    searchPexels(options),
    searchUnsplash(options),
  ]);

  // Combineer resultaten (Pexels eerst, vaak beste kwaliteit)
  const allResults = [...pexelsResults, ...unsplashResults, ...pixabayResults];

  if (allResults.length === 0) {
    console.log('⚠️  Geen gratis stock foto\'s gevonden, fallback naar AI generatie');
    return [];
  }

  console.log('✅ Found ' + allResults.length + ' free stock images');
  return allResults.slice(0, options.count || 1);
}

/**
 * Helper: Download image van URL naar buffer (voor upload naar S3/WordPress)
 */
export async function downloadImageToBuffer(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Helper: Genereer attribution tekst voor free stock images
 */
export function generateAttribution(image: StockImageResult): string {
  if (!image.photographer) return '';
  
  switch (image.source) {
    case 'pixabay':
      return 'Foto door ' + image.photographer + ' via Pixabay';
    case 'pexels':
      return 'Foto door ' + image.photographer + ' via Pexels';
    case 'unsplash':
      return 'Foto door ' + image.photographer + ' via Unsplash';
    default:
      return '';
  }
}
