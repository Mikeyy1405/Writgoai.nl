
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { translateToEnglish } from '@/lib/prompt-translator';
import { searchPixabayImages, downloadPixabayImage } from '@/lib/pixabay-api';
import { searchPexelsImages, downloadPexelsImage } from '@/lib/pexels-api';
import { uploadFile } from '@/lib/s3';
import { getBucketConfig } from '@/lib/aws-config';

export const dynamic = 'force-dynamic';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const body = await req.json();
    const { 
      query, 
      orientation = 'all',
      imageType = 'photo',
      category,
      perPage = 20,
      page = 1,
      source = 'both' // 'pixabay', 'pexels', of 'both'
    } = body;

    if (!query) {
      return NextResponse.json({ error: 'Zoekopdracht is verplicht' }, { status: 400 });
    }

    // Vertaal query naar Engels voor betere resultaten
    console.log('Original query:', query);
    const englishQuery = await translateToEnglish(query);
    console.log('Translated query:', englishQuery);

    let allImages: any[] = [];
    let totalResults = 0;

    // Zoek op Pixabay
    if (source === 'pixabay' || source === 'both') {
      try {
        const results = await searchPixabayImages(englishQuery, {
          orientation,
          imageType,
          category,
          perPage: source === 'both' ? Math.floor(perPage / 2) : perPage,
          page,
          minWidth: 640,
          minHeight: 480,
          safeSearch: true,
        });

        const pixabayImages = results.hits.map(hit => ({
          id: `pixabay-${hit.id}`,
          preview: hit.webformatURL,
          full: hit.largeImageURL,
          width: hit.imageWidth,
          height: hit.imageHeight,
          tags: hit.tags.split(', '),
          user: hit.user,
          userImage: hit.userImageURL,
          likes: hit.likes,
          downloads: hit.downloads,
          views: hit.views,
          source: 'pixabay',
          pageUrl: hit.pageURL,
        }));

        allImages = [...allImages, ...pixabayImages];
        totalResults += results.total;
      } catch (error) {
        console.error('Pixabay search error:', error);
      }
    }

    // Zoek op Pexels
    if (source === 'pexels' || source === 'both') {
      try {
        // Map orientation naar Pexels format
        let pexelsOrientation: 'landscape' | 'portrait' | 'square' | undefined;
        if (orientation === 'horizontal') pexelsOrientation = 'landscape';
        else if (orientation === 'vertical') pexelsOrientation = 'portrait';
        else if (orientation === 'square') pexelsOrientation = 'square';

        const results = await searchPexelsImages(englishQuery, {
          perPage: source === 'both' ? Math.floor(perPage / 2) : perPage,
          page,
          orientation: pexelsOrientation,
        });

        const pexelsImages = results.photos.map(photo => ({
          id: `pexels-${photo.id}`,
          preview: photo.src.medium,
          full: photo.src.original,
          width: photo.width,
          height: photo.height,
          tags: photo.alt ? photo.alt.split(' ') : [],
          user: photo.photographer,
          userImage: '',
          likes: 0,
          downloads: 0,
          views: 0,
          source: 'pexels',
          pageUrl: photo.url,
          avgColor: photo.avg_color,
        }));

        allImages = [...allImages, ...pexelsImages];
        totalResults += results.total_results;
      } catch (error) {
        console.error('Pexels search error:', error);
      }
    }

    // Shuffle als beide bronnen gebruikt worden
    if (source === 'both') {
      allImages = allImages.sort(() => Math.random() - 0.5);
    }

    return NextResponse.json({
      success: true,
      total: totalResults,
      totalHits: allImages.length,
      images: allImages,
      query: query,
      translatedQuery: englishQuery,
    });

  } catch (error) {
    console.error('Stock image search error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Er is een fout opgetreden' 
    }, { status: 500 });
  }
}

// Download and save a stock image
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const body = await req.json();
    const { imageUrl, imageId, tags, projectId, source = 'pixabay' } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is verplicht' }, { status: 400 });
    }

    // Download image based on source
    let imageBuffer: Buffer;
    if (source === 'pexels') {
      imageBuffer = await downloadPexelsImage(imageUrl);
    } else {
      imageBuffer = await downloadPixabayImage(imageUrl);
    }

    // Upload naar S3
    const { folderPrefix } = getBucketConfig();
    const fileName = `${folderPrefix}stock-images/${Date.now()}-${imageId}.jpg`;
    const s3Key = await uploadFile(imageBuffer, fileName);

    // Save to database als project is specified
    if (projectId) {
      await prisma.generatedImage.create({
        data: {
          projectId,
          clientId: client.id,
          prompt: tags?.join(', ') || 'stock image',
          translatedPrompt: tags?.join(', ') || 'stock image',
          model: `${source}-stock`,
          imageUrl: s3Key,
          cost: 0, // Stock images are free
        },
      });
    }

    // Generate signed URL voor directe toegang
    const { getDownloadUrl } = await import('@/lib/s3');
    const signedUrl = await getDownloadUrl(s3Key);

    return NextResponse.json({
      success: true,
      imageUrl: s3Key,  // S3 key voor opslag
      signedUrl: signedUrl,  // Signed URL voor directe download
      source: source,
    });

  } catch (error) {
    console.error('Stock image download error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Er is een fout opgetreden' 
    }, { status: 500 });
  }
}
