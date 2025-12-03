
/**
 * Vadoo AI API Service
 * Complete integration for AI video generation
 */

const VADOO_API_KEY = process.env.VADOO_API_KEY || '';
const VADOO_BASE_URL = 'https://viralapi.vadoo.tv/api';

export interface VadooVideoOptions {
  topic?: string;
  voice?: string;
  theme?: string;
  style?: string;
  language?: string;
  duration?: string;
  aspect_ratio?: string;
  prompt?: string;
  custom_instruction?: string;
  use_ai?: string;
  include_voiceover?: string;
  size?: string;
  ypos?: string;
  url?: string;
  bg_music?: string;
  bg_music_volume?: string;
}

export interface VadooAudioToVideoOptions {
  audio_base64: string;
  audio_format: string;
  style?: string;
  aspect_ratio?: string;
  theme?: string;
  bg_music?: string;
  bg_music_volume?: string;
  custom_instruction?: string;
}

export interface VadooVideoResponse {
  vid: string;
}

export interface VadooWebhookData {
  vid: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  status: 'completed' | 'failed';
  error?: string;
}

/**
 * Get list of available video topics/niches
 */
export async function getVideoTopics(): Promise<string[]> {
  try {
    const response = await fetch(`${VADOO_BASE_URL}/get_topics`, {
      headers: {
        'X-API-KEY': VADOO_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch topics: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Vadoo topics:', error);
    return [];
  }
}

/**
 * Get list of available voices
 */
export async function getAvailableVoices(): Promise<string[]> {
  try {
    const response = await fetch(`${VADOO_BASE_URL}/get_voices`, {
      headers: {
        'X-API-KEY': VADOO_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Vadoo voices:', error);
    return ['Charlie', 'George', 'Callum', 'Sarah', 'Laura', 'Charlotte'];
  }
}

/**
 * Get list of available caption themes
 */
export async function getCaptionThemes(): Promise<string[]> {
  try {
    const response = await fetch(`${VADOO_BASE_URL}/get_themes`, {
      headers: {
        'X-API-KEY': VADOO_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch caption themes: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Vadoo caption themes:', error);
    return ['Hormozi_1', 'Beast', 'Tracy', 'Noah', 'Karl', 'Luke'];
  }
}

/**
 * Get list of available AI image themes/styles
 */
export async function getImageThemes(): Promise<string[]> {
  try {
    const response = await fetch(`${VADOO_BASE_URL}/get_styles`, {
      headers: {
        'X-API-KEY': VADOO_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image themes: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Vadoo image themes:', error);
    return ['None', '3d model', 'anime', 'cinematic', 'digital art', 'fantasy art'];
  }
}

/**
 * Get list of available background music
 */
export async function getBackgroundMusic(): Promise<string[]> {
  try {
    const response = await fetch(`${VADOO_BASE_URL}/get_background_music`, {
      headers: {
        'X-API-KEY': VADOO_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch background music: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Vadoo background music:', error);
    return [];
  }
}

/**
 * Get list of supported languages
 */
export async function getSupportedLanguages(): Promise<string[]> {
  try {
    const response = await fetch(`${VADOO_BASE_URL}/get_languages`, {
      headers: {
        'X-API-KEY': VADOO_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch languages: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Vadoo languages:', error);
    return ['English'];
  }
}

/**
 * Create an AI Video
 * @returns Video ID (vid) - The video will be generated and sent to webhook in 2-3 minutes
 */
export async function createAIVideo(
  options: VadooVideoOptions
): Promise<VadooVideoResponse> {
  try {
    const response = await fetch(`${VADOO_BASE_URL}/generate_video`, {
      method: 'POST',
      headers: {
        'X-API-KEY': VADOO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create video: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Vadoo video:', error);
    throw error;
  }
}

/**
 * Create video from audio file
 * @returns Video ID (vid) - The video will be generated and sent to webhook
 */
export async function createAudioToVideo(
  options: VadooAudioToVideoOptions
): Promise<VadooVideoResponse> {
  try {
    const response = await fetch(`${VADOO_BASE_URL}/audio_to_video`, {
      method: 'POST',
      headers: {
        'X-API-KEY': VADOO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create audio video: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Vadoo audio video:', error);
    throw error;
  }
}

/**
 * Get video URL by video ID
 * @param vid Video ID from Vadoo
 * @returns { url: string, status: 'complete' | 'processing' | 'failed' }
 */
export async function getVideoUrl(vid: string): Promise<{ url: string | null; status: string }> {
  try {
    const response = await fetch(`${VADOO_BASE_URL}/get_video_url?id=${vid}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': VADOO_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get video URL: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      url: data.url || null,
      status: data.status || 'processing'
    };
  } catch (error) {
    console.error('Error getting Vadoo video URL:', error);
    return { url: null, status: 'error' };
  }
}

/**
 * Options for adding AI captions to existing video
 */
export interface VadooAddCaptionsOptions {
  url: string;
  theme?: string;
  language?: string;
}

/**
 * Options for creating AI clips from long-form video
 */
export interface VadooCreateClipsOptions {
  url: string;
  theme?: string;
  language?: string;
  num_clips?: number;
}

/**
 * Add AI Captions to an existing video
 * @returns Video ID (vid) - The video will be generated and sent to webhook in 2-3 minutes
 */
export async function addAICaptions(
  options: VadooAddCaptionsOptions
): Promise<VadooVideoResponse> {
  try {
    const payload = {
      url: options.url,
      theme: options.theme || 'Hormozi_1',
      language: options.language || 'English',
    };

    const response = await fetch(`${VADOO_BASE_URL}/add_captions`, {
      method: 'POST',
      headers: {
        'X-API-KEY': VADOO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add captions: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding AI captions:', error);
    throw error;
  }
}

/**
 * Create AI clips from a long-form video (YouTube URL)
 * @returns Video ID (vid) - The clips will be generated and sent to webhook in 2-3 minutes
 */
export async function createAIClips(
  options: VadooCreateClipsOptions
): Promise<VadooVideoResponse> {
  try {
    const payload = {
      url: options.url,
      theme: options.theme || 'Hormozi_1',
      language: options.language || 'English',
      num_clips: options.num_clips || 1,
    };

    const response = await fetch(`${VADOO_BASE_URL}/create_ai_clips`, {
      method: 'POST',
      headers: {
        'X-API-KEY': VADOO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create AI clips: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating AI clips:', error);
    throw error;
  }
}

/**
 * Default options for video generation
 */
export const DEFAULT_VIDEO_OPTIONS = {
  voice: 'Charlie',
  theme: 'Hormozi_1',
  language: 'English',
  duration: '30-60',
  aspect_ratio: '9:16',
  use_ai: '1',
  include_voiceover: '1',
  bg_music_volume: '50',
};

