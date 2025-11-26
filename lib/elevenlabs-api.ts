
/**
 * ElevenLabs API Integration for Voiceovers
 * Generates natural-sounding voice from text
 */

export interface VoiceSettings {
  stability: number; // 0-1
  similarity_boost: number; // 0-1
  style?: number; // 0-1
  use_speaker_boost?: boolean;
}

export interface GenerateVoiceoverOptions {
  text: string;
  voiceId?: string; // Default: Rachel (English) or Laura (Dutch)
  modelId?: string; // Default: eleven_multilingual_v2
  voiceSettings?: VoiceSettings;
}

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: true,
};

// Popular ElevenLabs voice IDs
export const VOICES = {
  // English voices
  rachel: '21m00Tcm4TlvDq8ikWAM', // Female, calm
  bella: 'EXAVITQu4vr4xnSDxMaL', // Female, soft
  antoni: 'ErXwobaYiN019PkySvjV', // Male, deep
  elli: 'MF3mGyEYCl7XYWbV9V6O', // Female, energetic
  josh: 'TxGEqnHWrfWFTfGW9XjX', // Male, professional
  
  // Multilingual voices
  laura: 'FGY2WhTYpPnrIDTdsKH5', // Dutch/English female
  charlie: 'IKne3meq5aSn9XLyUdCD', // Australian male
  charlotte: 'XB0fDUnXU5powFXDhCwa', // British female
  liam: 'TX3LPaxmHKxFdv7VOQHJ', // American male
};

/**
 * Generates voiceover from text using ElevenLabs API
 * @returns base64-encoded audio data (MP3)
 */
export async function generateVoiceover(
  options: GenerateVoiceoverOptions
): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error('ElevenLabs API key niet gevonden');
  }

  // Detect language and select appropriate voice
  const isDutch = /[ëäöüïé]/i.test(options.text) || 
                 /\b(de|het|een|is|zijn|was|worden|kan)\b/i.test(options.text);
  
  const voiceId = options.voiceId || (isDutch ? VOICES.laura : VOICES.rachel);
  const modelId = options.modelId || 'eleven_multilingual_v2';
  const voiceSettings = options.voiceSettings || DEFAULT_VOICE_SETTINGS;

  console.log(`Generating voiceover: language=${isDutch ? 'Dutch' : 'English'}, voice=${voiceId}`);

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: options.text,
          model_id: modelId,
          voice_settings: voiceSettings,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', error);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // Convert audio to base64
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return `data:audio/mpeg;base64,${base64Audio}`;

  } catch (error) {
    console.error('Voiceover generation error:', error);
    throw error;
  }
}

/**
 * Get available characters count for the API key
 */
export async function getCharacterCount(): Promise<{
  characterCount: number;
  characterLimit: number;
}> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error('ElevenLabs API key niet gevonden');
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      characterCount: data.character_count,
      characterLimit: data.character_limit,
    };

  } catch (error) {
    console.error('Character count error:', error);
    throw error;
  }
}
