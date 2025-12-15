
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateVoiceover } from '@/lib/elevenlabs-api';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, language } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Clean text for natural speech
    let cleanedText = text
      .replace(/<[^>]*>/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/^\s*>\s+/gm, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    // Skip very short text
    if (cleanedText.length < 5) {
      return NextResponse.json({ 
        error: 'Text too short',
        audioData: null 
      }, { status: 200 });
    }

    console.log('[ElevenLabs TTS] Generating audio for text length:', cleanedText.length);
    console.log('[ElevenLabs TTS] Language:', language);

    // Select voice based on language
    // User's preferred voice IDs
    const voiceId = language === 'en' 
      ? 'Kx485Z9dUCufrWYpKMSR' // English voice
      : 'ac1yu51XoSHVMyEhZeSx'; // Dutch voice

    const audioData = await generateVoiceover({
      text: cleanedText,
      voiceId,
    });

    return NextResponse.json({
      success: true,
      audioData,
    });

  } catch (error) {
    console.error('[ElevenLabs TTS] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 }
    );
  }
}
