import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

interface StockPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  largeUrl: string;
  width: number;
  height: number;
  photographer: string;
  photographerUrl: string;
  source: 'pixabay' | 'pexels' | 'unsplash';
  alt: string;
  tags?: string;
  likes?: number;
  downloads?: number;
}

interface SearchResponse {
  photos: StockPhoto[];
  totalResults: number;
  page: number;
  perPage: number;
  source: string;
}

/**
 * Common Dutch to English translations for image search
 */
const dutchToEnglish: Record<string, string> = {
  'technologie': 'technology', 'computer': 'computer', 'telefoon': 'phone',
  'smartphone': 'smartphone', 'internet': 'internet', 'software': 'software',
  'bedrijf': 'business', 'economie': 'economy', 'geld': 'money',
  'beurs': 'stock market', 'investering': 'investment', 'ondernemer': 'entrepreneur',
  'nieuws': 'news', 'politiek': 'politics', 'overheid': 'government',
  'verkiezingen': 'elections', 'klimaat': 'climate', 'energie': 'energy',
  'gezondheid': 'health', 'wetenschap': 'science', 'natuur': 'nature',
  'dieren': 'animals', 'mensen': 'people', 'stad': 'city',
  'landschap': 'landscape', 'zee': 'sea', 'strand': 'beach',
  'berg': 'mountain', 'bos': 'forest', 'bloemen': 'flowers',
  'auto': 'car', 'vliegtuig': 'airplane', 'trein': 'train',
  'eten': 'food', 'restaurant': 'restaurant', 'koken': 'cooking',
  'sport': 'sports', 'voetbal': 'soccer', 'fitness': 'fitness',
  'muziek': 'music', 'kunst': 'art', 'film': 'movie',
  'mode': 'fashion', 'kleding': 'clothing', 'kantoor': 'office',
  'huis': 'house', 'gebouw': 'building', 'architectuur': 'architecture',
  'abstract': 'abstract', 'achtergrond': 'background', 'textuur': 'texture',
};

function translateToEnglish(query: string): string {
  let translated = query.toLowerCase();
  for (const [dutch, english] of Object.entries(dutchToEnglish)) {
    translated = translated.replace(new RegExp(`\\b${dutch}\\b`, 'gi'), english);
  }
  return translated;
}

async function searchPixabay(query: string, page: number = 1, perPage: number = 20): Promise<SearchResponse | null> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) return null;

  const englishQuery = translateToEnglish(query);

  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(englishQuery)}&image_type=photo&orientation=horizontal&per_page=${perPage}&page=${page}&safesearch=true&lang=en`
    );

    if (!response.ok) {
      console.error('Pixabay API error:', response.status);
      return null;
    }

    const data = await response.json();

    const photos: StockPhoto[] = (data.hits || []).map((photo: any) => ({
      id: `pixabay-${photo.id}`,
      url: photo.webformatURL,
      thumbnailUrl: photo.previewURL,
      largeUrl: photo.largeImageURL,
      width: photo.imageWidth,
      height: photo.imageHeight,
      photographer: photo.user,
      photographerUrl: `https://pixabay.com/users/${photo.user}-${photo.user_id}/`,
      source: 'pixabay' as const,
      alt: photo.tags,
      tags: photo.tags,
      likes: photo.likes,
      downloads: photo.downloads,
    }));

    return {
      photos,
      totalResults: data.totalHits || 0,
      page,
      perPage,
      source: 'Pixabay',
    };
  } catch (error) {
    console.error('Pixabay search error:', error);
    return null;
  }
}

async function searchPexels(query: string, page: number = 1, perPage: number = 20): Promise<SearchResponse | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  const englishQuery = translateToEnglish(query);

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(englishQuery)}&per_page=${perPage}&page=${page}&orientation=landscape`,
      {
        headers: { 'Authorization': apiKey },
      }
    );

    if (!response.ok) {
      console.error('Pexels API error:', response.status);
      return null;
    }

    const data = await response.json();

    const photos: StockPhoto[] = (data.photos || []).map((photo: any) => ({
      id: `pexels-${photo.id}`,
      url: photo.src.large,
      thumbnailUrl: photo.src.medium,
      largeUrl: photo.src.large2x || photo.src.original,
      width: photo.width,
      height: photo.height,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      source: 'pexels' as const,
      alt: photo.alt || query,
    }));

    return {
      photos,
      totalResults: data.total_results || 0,
      page,
      perPage,
      source: 'Pexels',
    };
  } catch (error) {
    console.error('Pexels search error:', error);
    return null;
  }
}

async function searchUnsplash(query: string, page: number = 1, perPage: number = 20): Promise<SearchResponse | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  const englishQuery = translateToEnglish(query);

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(englishQuery)}&per_page=${perPage}&page=${page}&orientation=landscape`,
      {
        headers: { 'Authorization': `Client-ID ${accessKey}` },
      }
    );

    if (!response.ok) {
      console.error('Unsplash API error:', response.status);
      return null;
    }

    const data = await response.json();

    const photos: StockPhoto[] = (data.results || []).map((photo: any) => ({
      id: `unsplash-${photo.id}`,
      url: photo.urls.regular,
      thumbnailUrl: photo.urls.small,
      largeUrl: photo.urls.full,
      width: photo.width,
      height: photo.height,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      source: 'unsplash' as const,
      alt: photo.alt_description || query,
      likes: photo.likes,
    }));

    return {
      photos,
      totalResults: data.total || 0,
      page,
      perPage,
      source: 'Unsplash',
    };
  } catch (error) {
    console.error('Unsplash search error:', error);
    return null;
  }
}

/**
 * GET /api/image-studio/stock-photos
 * Search for stock photos from Pixabay, Pexels, and Unsplash
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const source = searchParams.get('source') || 'all'; // pixabay, pexels, unsplash, all
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');

    if (!query.trim()) {
      return NextResponse.json({
        error: 'Zoekopdracht is verplicht'
      }, { status: 400 });
    }

    let allPhotos: StockPhoto[] = [];
    let totalResults = 0;
    let sources: string[] = [];

    // Search based on source selection
    if (source === 'all' || source === 'pixabay') {
      const pixabayResult = await searchPixabay(query, page, perPage);
      if (pixabayResult) {
        allPhotos.push(...pixabayResult.photos);
        totalResults += pixabayResult.totalResults;
        sources.push('Pixabay');
      }
    }

    if (source === 'all' || source === 'pexels') {
      const pexelsResult = await searchPexels(query, page, perPage);
      if (pexelsResult) {
        allPhotos.push(...pexelsResult.photos);
        totalResults += pexelsResult.totalResults;
        sources.push('Pexels');
      }
    }

    if (source === 'all' || source === 'unsplash') {
      const unsplashResult = await searchUnsplash(query, page, perPage);
      if (unsplashResult) {
        allPhotos.push(...unsplashResult.photos);
        totalResults += unsplashResult.totalResults;
        sources.push('Unsplash');
      }
    }

    // Shuffle photos if searching all sources for variety
    if (source === 'all') {
      allPhotos = allPhotos.sort(() => Math.random() - 0.5);
    }

    return NextResponse.json({
      photos: allPhotos,
      totalResults,
      page,
      perPage,
      sources: sources.join(', '),
      translatedQuery: translateToEnglish(query),
    });
  } catch (error: any) {
    console.error('Stock photo search error:', error);
    return NextResponse.json({
      error: `Er is een fout opgetreden: ${error.message}`
    }, { status: 500 });
  }
}
