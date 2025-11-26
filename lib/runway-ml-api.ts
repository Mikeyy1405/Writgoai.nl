
/**
 * Runway ML API Integration for Image-to-Video Generation
 * Generates motion video clips from static images using Runway ML's Gen-3 Alpha API
 */

interface RunwayMLTask {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  output?: string[];
  error?: string;
  createdAt: string;
  progress?: number;
}

interface ImageToVideoOptions {
  imageUrl: string;
  prompt?: string;
  duration?: number; // 5 or 10 seconds
  watermark?: boolean;
}

/**
 * Generate video from image using Runway ML
 */
export async function generateImageToVideo(options: ImageToVideoOptions): Promise<string> {
  const apiKey = process.env.RUNWAY_ML_API_KEY;
  if (!apiKey) {
    throw new Error('RUNWAY_ML_API_KEY niet geconfigureerd');
  }

  const {
    imageUrl,
    prompt = 'smooth camera movement, natural motion',
    duration = 5,
    watermark = false,
  } = options;

  try {
    console.log('[Runway ML] Starting image-to-video generation:', { imageUrl, prompt, duration });

    // Step 1: Create generation task
    const createResponse = await fetch('https://api.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        model: 'gen3a_turbo',
        promptImage: imageUrl,
        promptText: prompt,
        duration,
        watermark,
        ratio: '16:9',
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error('[Runway ML] Creation failed:', error);
      throw new Error(`Runway ML API error: ${error}`);
    }

    const task: RunwayMLTask = await createResponse.json();
    console.log('[Runway ML] Task created:', task.id);

    // Step 2: Poll for completion
    const videoUrl = await pollTaskStatus(task.id, apiKey);
    console.log('[Runway ML] Video generated successfully:', videoUrl);

    return videoUrl;
  } catch (error: any) {
    console.error('[Runway ML] Generation error:', error);
    throw new Error(`Runway ML generatie mislukt: ${error.message}`);
  }
}

/**
 * Poll task status until completion
 */
async function pollTaskStatus(taskId: string, apiKey: string): Promise<string> {
  const maxAttempts = 60; // 5 minutes max (5s intervals)
  const pollInterval = 5000; // 5 seconds

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    const response = await fetch(`https://api.runwayml.com/v1/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Runway-Version': '2024-11-06',
      },
    });

    if (!response.ok) {
      throw new Error('Task status check failed');
    }

    const task: RunwayMLTask = await response.json();
    console.log('[Runway ML] Task status:', task.status, task.progress ? `(${task.progress}%)` : '');

    if (task.status === 'SUCCEEDED' && task.output && task.output.length > 0) {
      return task.output[0];
    }

    if (task.status === 'FAILED') {
      throw new Error(task.error || 'Video generation failed');
    }
  }

  throw new Error('Video generation timeout (5 minutes exceeded)');
}

/**
 * Batch generate multiple videos from images
 */
export async function batchGenerateVideos(
  images: Array<{ url: string; prompt: string }>,
  duration: number = 5
): Promise<Array<{ url: string; prompt: string; videoUrl: string }>> {
  const results = [];

  for (const image of images) {
    try {
      const videoUrl = await generateImageToVideo({
        imageUrl: image.url,
        prompt: image.prompt,
        duration,
      });

      results.push({
        url: image.url,
        prompt: image.prompt,
        videoUrl,
      });
    } catch (error: any) {
      console.error(`[Runway ML] Failed to generate video for image:`, error);
      // Continue with next image even if one fails
    }
  }

  return results;
}

/**
 * Get estimated credit cost for generation
 */
export function getRunwayMLCreditCost(duration: number, count: number = 1): number {
  // Pricing: ~$0.05 per second of video
  const costPerSecond = 0.05;
  return duration * costPerSecond * count;
}

/**
 * Generate video directly from text prompt (Text-to-Video)
 * Perfect for creating complete video sequences
 */
export async function generateTextToVideo(options: {
  prompt: string;
  duration?: number; // 5 or 10 seconds
  watermark?: boolean;
}): Promise<string> {
  const apiKey = process.env.RUNWAY_ML_API_KEY;
  if (!apiKey) {
    throw new Error('RUNWAY_ML_API_KEY niet geconfigureerd');
  }

  const {
    prompt,
    duration = 10,
    watermark = false,
  } = options;

  try {
    console.log('[Runway ML] Starting text-to-video generation:', { prompt, duration });

    // Step 1: Create generation task
    const createResponse = await fetch('https://api.runwayml.com/v1/text_to_video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        model: 'gen3a_turbo',
        promptText: prompt,
        duration,
        watermark,
        ratio: '16:9',
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error('[Runway ML] Creation failed:', error);
      throw new Error(`Runway ML API error: ${error}`);
    }

    const task: RunwayMLTask = await createResponse.json();
    console.log('[Runway ML] Text-to-video task created:', task.id);

    // Step 2: Poll for completion
    const videoUrl = await pollTaskStatus(task.id, apiKey);
    console.log('[Runway ML] Video generated successfully:', videoUrl);

    return videoUrl;
  } catch (error: any) {
    console.error('[Runway ML] Text-to-video error:', error);
    throw new Error(`Runway ML text-to-video mislukt: ${error.message}`);
  }
}
