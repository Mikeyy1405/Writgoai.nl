import { NextResponse } from 'next/server';
import {
  getVideoTopics,
  getAvailableVoices,
  getCaptionThemes,
  getImageThemes,
  getBackgroundMusic,
  getSupportedLanguages,
} from '@/lib/vadoo';

/**
 * Get all Vadoo options (topics, voices, themes, etc.)
 * GET /api/vadoo/options
 */
export async function GET() {
  try {
    // Fetch all options in parallel
    const [topics, voices, themes, styles, music, languages] = await Promise.all([
      getVideoTopics(),
      getAvailableVoices(),
      getCaptionThemes(),
      getImageThemes(),
      getBackgroundMusic(),
      getSupportedLanguages(),
    ]);

    return NextResponse.json({
      topics,
      voices,
      themes,
      styles,
      music,
      languages,
      // Duration options
      durations: ['30-60', '60-90', '90-120', '5 min', '10 min'],
      // Aspect ratio options
      aspectRatios: ['9:16', '1:1', '16:9'],
    });
  } catch (error: any) {
    console.error('❌ Error fetching Vadoo options:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch options' },
      { status: 500 }
    );
  }
}
