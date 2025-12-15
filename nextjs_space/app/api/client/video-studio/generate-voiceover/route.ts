
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateVoiceover, VOICES } from '@/lib/elevenlabs-api';

export const dynamic = 'force-dynamic';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await req.json();
    const { text, voiceId, language } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is verplicht' }, { status: 400 });
    }

    console.log('Generating voiceover for text length:', text.length);

    // Select voice based on language
    let selectedVoiceId = voiceId;
    if (!selectedVoiceId) {
      selectedVoiceId = language === 'Dutch' ? VOICES.laura : VOICES.rachel;
    }

    const audioData = await generateVoiceover({
      text,
      voiceId: selectedVoiceId,
    });

    return NextResponse.json({
      success: true,
      audioData,
      charactersUsed: text.length,
    });

  } catch (error) {
    console.error('Voiceover generation error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Er is een fout opgetreden' 
    }, { status: 500 });
  }
}
