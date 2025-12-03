
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { searchMusicTracks, getRecommendedMusic, MUSIC_LIBRARY } from '@/lib/royalty-free-music';

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const genre = searchParams.get('genre') || undefined;
    const mood = searchParams.get('mood') || undefined;
    const tempo = searchParams.get('tempo') as 'slow' | 'medium' | 'fast' | undefined;
    const videoStyle = searchParams.get('videoStyle') || undefined;
    const videoDuration = searchParams.get('videoDuration') 
      ? parseInt(searchParams.get('videoDuration')!) 
      : undefined;

    let tracks;

    // If video style and duration are provided, get recommendations
    if (videoStyle && videoDuration) {
      tracks = getRecommendedMusic(videoStyle, videoDuration);
    } 
    // If filters are provided, search with filters
    else if (genre || mood || tempo) {
      tracks = searchMusicTracks({ genre, mood, tempo });
    }
    // Otherwise return empty array (users must upload their own)
    else {
      tracks = [];
    }

    return NextResponse.json({
      success: true,
      tracks,
      message: tracks.length === 0 ? 'Upload je eigen muziek om te gebruiken' : undefined,
    });

  } catch (error) {
    console.error('Music library error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Er is een fout opgetreden' 
    }, { status: 500 });
  }
}
