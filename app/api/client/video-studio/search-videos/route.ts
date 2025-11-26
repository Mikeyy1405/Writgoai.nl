
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { searchStockVideosTranslated } from '@/lib/stock-video-api';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await req.json();
    const { query, perPage = 20, page = 1, minDuration, maxDuration } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is verplicht' }, { status: 400 });
    }

    console.log('Searching stock videos for:', query);
    const results = await searchStockVideosTranslated(query, {
      perPage,
      page,
      minDuration,
      maxDuration,
    });

    return NextResponse.json({
      success: true,
      ...results,
    });

  } catch (error) {
    console.error('Video search error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Er is een fout opgetreden' 
    }, { status: 500 });
  }
}
