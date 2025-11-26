
/**
 * Abacus.AI Video Generation Service
 * Uses DeepAgent's video generation capabilities
 */

const ABACUS_API_KEY = process.env.ABACUSAI_API_KEY || '';
const ABACUS_API_BASE = 'https://apis.abacus.ai/v1';

export interface AbacusVideoOptions {
  prompt: string;
  model?: 'hailuo' | 'runway' | 'kling' | 'luma' | 'veo2';
  duration?: number; // seconds
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export interface AbacusVideoResponse {
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
}

/**
 * Generate video using Abacus.AI video generation
 */
export async function generateAbacusVideo(
  options: AbacusVideoOptions
): Promise<AbacusVideoResponse> {
  try {
    console.log('🎬 Generating video with Abacus.AI...');
    console.log('   Model:', options.model || 'hailuo');
    console.log('   Prompt:', options.prompt.substring(0, 100) + '...');
    
    // Use Abacus.AI video generation API
    // Format: POST to /v1/chat/completions with video generation request
    const response = await fetch(`${ABACUS_API_BASE}/video/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ABACUS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: options.prompt,
        model: options.model || 'hailuo',
        duration: options.duration || 10,
        aspect_ratio: options.aspectRatio || '9:16',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Abacus video generation failed: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log('✅ Video generated successfully');
    
    return {
      videoUrl: data.video_url || data.url,
      thumbnailUrl: data.thumbnail_url,
      duration: data.duration,
    };
    
  } catch (error) {
    console.error('❌ Abacus video generation error:', error);
    throw error;
  }
}

/**
 * Default video generation options optimized for social media
 */
export const DEFAULT_VIDEO_OPTIONS: Partial<AbacusVideoOptions> = {
  model: 'hailuo', // Good balance of quality and speed
  duration: 10, // 10 seconds for social media
  aspectRatio: '9:16', // Vertical for TikTok/Instagram/YouTube Shorts
};
