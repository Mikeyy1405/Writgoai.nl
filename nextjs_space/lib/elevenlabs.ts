
/**
 * ElevenLabs API Service
 * Integration for high-quality AI voice generation
 */

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
  labels?: {
    accent?: string;
    age?: string;
    gender?: string;
    use_case?: string;
  };
  preview_url?: string;
}

export interface TextToSpeechOptions {
  voice_id: string;
  text: string;
  model_id?: string;
  voice_settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

/**
 * Get all available voices from ElevenLabs
 */
export async function getElevenLabsVoices(): Promise<ElevenLabsVoice[]> {
  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`);
    }

    const data = await response.json();
    return data.voices || [];
  } catch (error) {
    console.error('Error fetching ElevenLabs voices:', error);
    // Return valid default voices as fallback (these are confirmed available in the account)
    return [
      {
        voice_id: 'CwhRBWXzGAHq8TQ4Fs17',
        name: 'Roger',
        labels: { accent: 'american', gender: 'male', age: 'middle-aged' },
        description: 'Easy going and perfect for casual conversations. Supports Dutch!',
      },
      {
        voice_id: 'EXAVITQu4vr4xnSDxMaL',
        name: 'Sarah',
        labels: { accent: 'american', gender: 'female', age: 'young' },
        description: 'Young adult woman with a confident and warm voice.',
      },
      {
        voice_id: '2EiwWnXFnvU5JabPnv8n',
        name: 'Clyde',
        labels: { accent: 'american', gender: 'male', age: 'middle-aged' },
        description: 'Great for character use-cases.',
      },
      {
        voice_id: 'FGY2WhTYpPnrIDTdsKH5',
        name: 'Laura',
        labels: { accent: 'american', gender: 'female', age: 'young' },
        description: 'Sunny enthusiasm with a quirky attitude.',
      },
      {
        voice_id: 'IKne3meq5aSn9XLyUdCD',
        name: 'Charlie',
        labels: { accent: 'australian', gender: 'male', age: 'young' },
        description: 'A young Australian male with a confident and energetic voice.',
      },
      {
        voice_id: 'JBFqnCBsd6RMkjVDRZzb',
        name: 'George',
        labels: { accent: 'british', gender: 'male', age: 'middle-aged' },
        description: 'Warm resonance that instantly captivates listeners.',
      },
      {
        voice_id: 'N2lVS1w4EtoT3dr4eOWO',
        name: 'Callum',
        labels: { accent: '', gender: 'male', age: 'middle-aged' },
        description: 'Deceptively gravelly, yet unsettling edge.',
      },
      {
        voice_id: 'SAz9YHcvj6GT2YYXdXww',
        name: 'River',
        labels: { accent: 'american', gender: 'neutral', age: 'middle-aged' },
        description: 'A relaxed, neutral voice ready for narrations.',
      },
    ];
  }
}

/**
 * Generate speech from text using ElevenLabs
 */
export async function textToSpeech(
  options: TextToSpeechOptions
): Promise<ArrayBuffer> {
  try {
    const response = await fetch(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${options.voice_id}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: options.text,
          model_id: options.model_id || 'eleven_multilingual_v2',
          voice_settings: options.voice_settings || {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to generate speech: ${response.statusText}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
}

/**
 * Get voice settings for a specific voice
 */
export async function getVoiceSettings(voiceId: string) {
  try {
    const response = await fetch(
      `${ELEVENLABS_BASE_URL}/voices/${voiceId}/settings`,
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch voice settings: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching voice settings:', error);
    return {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true,
    };
  }
}

/**
 * Get models available for text-to-speech
 */
export async function getModels() {
  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/models`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
}

/**
 * Default voice settings
 */
export const DEFAULT_VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: true,
};
