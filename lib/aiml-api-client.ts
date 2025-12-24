/**
 * AIML API Client for Video, Voice, and Music Generation
 * API Documentation: https://docs.aimlapi.com
 */

const AIML_API_URL = 'https://api.aimlapi.com';
const AIML_API_KEY = process.env.AIML_API_KEY!;

// Video model configurations
export const VIDEO_MODELS = {
  'luma/ray-2': {
    id: 'luma/ray-2',
    name: 'Luma Ray 2',
    description: 'High-quality cinematic video generation',
    credits: 15,
    maxDuration: 10,
    endpoint: '/v2/video/generations',
  },
  'luma/ray-flash-2': {
    id: 'luma/ray-flash-2',
    name: 'Luma Ray Flash 2',
    description: 'Fast video generation with good quality',
    credits: 8,
    maxDuration: 10,
    endpoint: '/v2/video/generations',
  },
  'kling-video/v1.6/standard/text-to-video': {
    id: 'kling-video/v1.6/standard/text-to-video',
    name: 'Kling 1.6 Standard',
    description: 'Excellent video quality with smooth motion',
    credits: 12,
    maxDuration: 10,
    endpoint: '/v2/generate/video/kling/generation',
  },
  'runway/gen4_turbo': {
    id: 'runway/gen4_turbo',
    name: 'Runway Gen-4 Turbo',
    description: 'State-of-the-art video generation',
    credits: 20,
    maxDuration: 10,
    endpoint: '/v2/generate/video/runway/generation',
  },
  'minimax/hailuo-02': {
    id: 'minimax/hailuo-02',
    name: 'MiniMax Hailuo 02',
    description: 'High quality with artistic styles',
    credits: 10,
    maxDuration: 10,
    endpoint: '/v2/generate/video/minimax/generation',
  },
} as const;

export type VideoModelId = keyof typeof VIDEO_MODELS;

// Voice models for text-to-speech
export const VOICE_MODELS = {
  'elevenlabs/eleven_multilingual_v2': {
    id: 'elevenlabs/eleven_multilingual_v2',
    name: 'ElevenLabs Multilingual v2',
    voices: ['Rachel', 'Drew', 'Clyde', 'Paul', 'Domi', 'Dave', 'Fin', 'Sarah', 'Antoni', 'Thomas', 'Charlie', 'Emily'],
    credits: 2,
  },
  'elevenlabs/eleven_turbo_v2_5': {
    id: 'elevenlabs/eleven_turbo_v2_5',
    name: 'ElevenLabs Turbo v2.5',
    voices: ['Rachel', 'Drew', 'Clyde', 'Paul', 'Domi', 'Dave', 'Fin', 'Sarah', 'Antoni', 'Thomas', 'Charlie', 'Emily'],
    credits: 1,
  },
} as const;

// Music models
export const MUSIC_MODELS = {
  'stable-audio': {
    id: 'stable-audio',
    name: 'Stable Audio',
    credits: 5,
  },
  'minimax-music': {
    id: 'minimax-music',
    name: 'MiniMax Music',
    credits: 5,
  },
} as const;

// Visual styles for video generation
export const VIDEO_STYLES = [
  { id: 'writgo_brand', name: 'WritGO Brand Style', prompt: 'modern professional design, black background, vibrant orange accents (#FF6B00), white text, clean typography, high contrast, sleek and sophisticated, corporate branding, premium feel' },
  { id: 'ultra_realistic', name: 'Ultra Realistic', prompt: 'ultra realistic, photorealistic, 8K quality, cinematic lighting' },
  { id: 'vintage_comic', name: 'Vintage Comic', prompt: 'vintage comic book style, halftone dots, bold outlines, retro colors' },
  { id: '3d_pixar', name: '3D Pixar Style', prompt: '3D Pixar animation style, smooth rendering, vibrant colors, family friendly' },
  { id: 'cyberpunk', name: 'Cyberpunk', prompt: 'cyberpunk aesthetic, neon lights, futuristic, dark atmosphere, rain' },
  { id: 'studio_ghibli', name: 'Studio Ghibli', prompt: 'Studio Ghibli animation style, soft colors, dreamy, hand-drawn aesthetic' },
  { id: 'cinematic_drone', name: 'Cinematic Drone', prompt: 'cinematic drone shot, aerial view, smooth camera movement, golden hour' },
  { id: 'noir', name: 'Film Noir', prompt: 'film noir style, black and white, dramatic shadows, detective movie aesthetic' },
  { id: 'synthwave', name: 'Synthwave', prompt: 'synthwave aesthetic, 80s retro, neon grid, sunset, purple and pink colors' },
  { id: 'watercolor', name: 'Watercolor', prompt: 'watercolor painting style, soft edges, flowing colors, artistic' },
  { id: 'documentary', name: 'Documentary', prompt: 'documentary style, natural lighting, handheld camera feel, authentic' },
  { id: 'anime', name: 'Anime', prompt: 'anime style, Japanese animation, expressive, detailed backgrounds' },
  { id: 'minimalist', name: 'Minimalist', prompt: 'minimalist design, clean lines, simple shapes, modern aesthetic' },
] as const;

/**
 * Generate a video using AIML API
 */
export async function generateVideo(
  prompt: string,
  model: VideoModelId,
  aspectRatio: '16:9' | '9:16' | '1:1' = '9:16',
  duration: number = 5
): Promise<{ generationId: string }> {
  const modelConfig = VIDEO_MODELS[model];
  if (!modelConfig) {
    throw new Error(`Unknown video model: ${model}`);
  }

  // Map aspect ratio to API format
  const aspectRatioMap: Record<string, string> = {
    '16:9': '16:9',
    '9:16': '9:16',
    '1:1': '1:1',
  };

  const response = await fetch(`${AIML_API_URL}${modelConfig.endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIML_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      aspect_ratio: aspectRatioMap[aspectRatio],
      duration: duration,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AIML API video generation error:', errorText);
    throw new Error(`Video generation failed: ${response.status}`);
  }

  const data = await response.json();
  return { generationId: data.generation_id || data.id };
}

/**
 * Check video generation status and get result
 */
export async function getVideoStatus(
  generationId: string,
  model: VideoModelId
): Promise<{ status: 'queued' | 'processing' | 'completed' | 'failed'; url?: string; error?: string }> {
  const modelConfig = VIDEO_MODELS[model];

  const response = await fetch(`${AIML_API_URL}${modelConfig.endpoint}?generation_id=${generationId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${AIML_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AIML API status check error:', errorText);
    throw new Error(`Status check failed: ${response.status}`);
  }

  const data = await response.json();

  // Normalize status response
  if (data.status === 'completed' || data.status === 'done') {
    return {
      status: 'completed',
      url: data.video?.url || data.output?.url || data.url,
    };
  } else if (data.status === 'failed' || data.status === 'error') {
    return {
      status: 'failed',
      error: data.error || 'Video generation failed',
    };
  } else {
    return {
      status: data.status === 'queued' ? 'queued' : 'processing',
    };
  }
}

/**
 * Generate video with polling until completion
 */
export async function generateVideoWithPolling(
  prompt: string,
  model: VideoModelId,
  aspectRatio: '16:9' | '9:16' | '1:1' = '9:16',
  duration: number = 5,
  maxWaitTimeMs: number = 300000, // 5 minutes
  pollIntervalMs: number = 15000 // 15 seconds
): Promise<string> {
  // Start generation
  const { generationId } = await generateVideo(prompt, model, aspectRatio, duration);
  console.log(`Started video generation: ${generationId}`);

  // Poll for completion
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitTimeMs) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

    const status = await getVideoStatus(generationId, model);
    console.log(`Video status: ${status.status}`);

    if (status.status === 'completed' && status.url) {
      return status.url;
    } else if (status.status === 'failed') {
      throw new Error(status.error || 'Video generation failed');
    }
  }

  throw new Error('Video generation timed out');
}

/**
 * Generate voice-over using ElevenLabs via AIML API
 */
export async function generateVoiceOver(
  text: string,
  voice: string = 'Rachel',
  model: string = 'elevenlabs/eleven_multilingual_v2'
): Promise<{ generationId: string }> {
  const response = await fetch(`${AIML_API_URL}/v1/audio/speech`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIML_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      input: text,
      voice: voice,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AIML API voice generation error:', errorText);
    throw new Error(`Voice generation failed: ${response.status}`);
  }

  const data = await response.json();
  return { generationId: data.generation_id || data.id };
}

/**
 * Get voice-over status
 */
export async function getVoiceOverStatus(
  generationId: string
): Promise<{ status: 'queued' | 'processing' | 'completed' | 'failed'; url?: string; error?: string }> {
  const response = await fetch(
    `${AIML_API_URL}/v1/audio/speech?generation_id=${generationId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AIML API voice status error:', errorText);
    throw new Error(`Voice status check failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.status === 'completed' || data.status === 'done') {
    return {
      status: 'completed',
      url: data.audio_file?.url || data.audio?.url || data.url,
    };
  } else if (data.status === 'failed' || data.status === 'error') {
    return {
      status: 'failed',
      error: data.error || 'Voice generation failed',
    };
  } else {
    return {
      status: data.status === 'queued' ? 'queued' : 'processing',
    };
  }
}

/**
 * Generate voice-over with polling
 */
export async function generateVoiceOverWithPolling(
  text: string,
  voice: string = 'Rachel',
  model: string = 'elevenlabs/eleven_multilingual_v2',
  maxWaitTimeMs: number = 60000,
  pollIntervalMs: number = 5000
): Promise<string> {
  const { generationId } = await generateVoiceOver(text, voice, model);
  console.log(`Started voice-over generation: ${generationId}`);

  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitTimeMs) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

    const status = await getVoiceOverStatus(generationId);
    console.log(`Voice-over status: ${status.status}`);

    if (status.status === 'completed' && status.url) {
      return status.url;
    } else if (status.status === 'failed') {
      throw new Error(status.error || 'Voice generation failed');
    }
  }

  throw new Error('Voice generation timed out');
}

/**
 * Generate background music
 */
export async function generateMusic(
  prompt: string,
  duration: number = 60,
  model: string = 'stable-audio'
): Promise<{ generationId: string }> {
  const response = await fetch(`${AIML_API_URL}/v2/generate/audio`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIML_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      seconds_total: duration,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AIML API music generation error:', errorText);
    throw new Error(`Music generation failed: ${response.status}`);
  }

  const data = await response.json();
  return { generationId: data.generation_id || data.id };
}

/**
 * Get music generation status
 */
export async function getMusicStatus(
  generationId: string
): Promise<{ status: 'queued' | 'processing' | 'completed' | 'failed'; url?: string; error?: string }> {
  const response = await fetch(
    `${AIML_API_URL}/v2/generate/audio?generation_id=${generationId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AIML API music status error:', errorText);
    throw new Error(`Music status check failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.status === 'completed' || data.status === 'done') {
    return {
      status: 'completed',
      url: data.audio_file?.url || data.audio?.url || data.url,
    };
  } else if (data.status === 'failed' || data.status === 'error') {
    return {
      status: 'failed',
      error: data.error || 'Music generation failed',
    };
  } else {
    return {
      status: data.status === 'queued' ? 'queued' : 'processing',
    };
  }
}

/**
 * Generate music with polling
 */
export async function generateMusicWithPolling(
  prompt: string,
  duration: number = 60,
  model: string = 'stable-audio',
  maxWaitTimeMs: number = 120000,
  pollIntervalMs: number = 10000
): Promise<string> {
  const { generationId } = await generateMusic(prompt, duration, model);
  console.log(`Started music generation: ${generationId}`);

  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitTimeMs) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

    const status = await getMusicStatus(generationId);
    console.log(`Music status: ${status.status}`);

    if (status.status === 'completed' && status.url) {
      return status.url;
    } else if (status.status === 'failed') {
      throw new Error(status.error || 'Music generation failed');
    }
  }

  throw new Error('Music generation timed out');
}

/**
 * Interface for a video scene
 */
export interface VideoScene {
  sceneNumber: number;
  prompt: string;
  narrationText: string;
  style: typeof VIDEO_STYLES[number]['id'];
  duration: number;
}

/**
 * Interface for a complete video project
 */
export interface VideoProject {
  title: string;
  description: string;
  scenes: VideoScene[];
  aspectRatio: '16:9' | '9:16' | '1:1';
  voiceId: string;
  musicPrompt: string;
}
