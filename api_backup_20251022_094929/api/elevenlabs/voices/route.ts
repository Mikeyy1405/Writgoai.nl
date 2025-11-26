
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getElevenLabsVoices } from '@/lib/elevenlabs';

/**
 * GET /api/elevenlabs/voices
 * Get all available ElevenLabs voices
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const voices = await getElevenLabsVoices();

    return NextResponse.json({
      success: true,
      voices,
    });

  } catch (error) {
    console.error('Error fetching voices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voices' },
      { status: 500 }
    );
  }
}
