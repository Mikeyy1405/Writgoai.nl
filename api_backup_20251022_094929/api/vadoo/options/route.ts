
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getVideoTopics,
  getCaptionThemes,
  getImageThemes,
  getBackgroundMusic,
  getSupportedLanguages,
} from '@/lib/vadoo';

/**
 * GET /api/vadoo/options
 * Get all available Vadoo options (topics, voices, themes, etc.)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all options in parallel (excluding voices - now using ElevenLabs)
    const [topics, captionThemes, imageThemes, backgroundMusic, languages] =
      await Promise.all([
        getVideoTopics(),
        getCaptionThemes(),
        getImageThemes(),
        getBackgroundMusic(),
        getSupportedLanguages(),
      ]);

    return NextResponse.json({
      topics,
      captionThemes,
      imageThemes,
      backgroundMusic,
      languages,
      durations: ['30-60', '60-90', '90-120', '5 min', '10 min'],
      aspectRatios: ['9:16', '1:1', '16:9'],
    });
  } catch (error) {
    console.error('Error fetching Vadoo options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Vadoo options' },
      { status: 500 }
    );
  }
}

