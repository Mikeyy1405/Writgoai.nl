

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as aimlAdvanced from '@/lib/aiml-advanced';

/**
 * Transcribe audio to text using AIML API
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { audioUrl } = await req.json();

    if (!audioUrl) {
      return NextResponse.json({ error: 'No audio URL provided' }, { status: 400 });
    }

    console.log('🎤 Transcribing audio:', audioUrl);

    // Transcribe using AIML API
    const result = await aimlAdvanced.speechToText(audioUrl, 'nl');

    if (!result.success) {
      throw new Error(result.error || 'Transcription failed');
    }

    return NextResponse.json({
      success: true,
      text: result.text,
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Transcription failed', message: error.message },
      { status: 500 }
    );
  }
}
