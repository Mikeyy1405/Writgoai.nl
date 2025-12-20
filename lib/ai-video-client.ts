import Replicate from 'replicate';

// Video model definitions
export const VIDEO_MODELS = {
  // Luma Dream Machine
  LUMA: 'luma/dream-machine',
  
  // Runway Gen-3
  RUNWAY: 'runway/gen-3',
  
  // Pika
  PIKA: 'pika/pika-2.0',
} as const;

export type VideoModel = typeof VIDEO_MODELS[keyof typeof VIDEO_MODELS];

// Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY || 'dummy-key',
});

// Generate video
export async function generateVideo(params: {
  prompt: string;
  model?: VideoModel;
  duration?: number; // seconds
  aspectRatio?: '16:9' | '9:16' | '1:1';
}): Promise<string> {
  const {
    prompt,
    model = VIDEO_MODELS.LUMA,
    duration = 5,
    aspectRatio = '16:9',
  } = params;

  try {
    console.log(`Generating video with ${model}...`);
    
    // Note: This is a placeholder implementation
    // Actual API calls depend on the specific model's API
    const output = await replicate.run(model as any, {
      input: {
        prompt,
        duration,
        aspect_ratio: aspectRatio,
      },
    });

    // Output is typically a URL to the generated video
    return typeof output === 'string' ? output : (output as any).url || '';
  } catch (error: any) {
    console.error('Video generation error:', error.message);
    throw error;
  }
}

// Generate intro video for article
export async function generateArticleIntro(params: {
  articleTitle: string;
  articleSummary?: string;
}): Promise<string> {
  const { articleTitle, articleSummary } = params;

  const prompt = `Create a professional intro video for a blog article titled "${articleTitle}". ${
    articleSummary ? `The article is about: ${articleSummary}. ` : ''
  }Style: clean, modern, professional. Duration: 5 seconds.`;

  return generateVideo({
    prompt,
    duration: 5,
    aspectRatio: '16:9',
  });
}

// Generate social media video clip
export async function generateSocialClip(params: {
  text: string;
  style?: 'professional' | 'casual' | 'energetic';
}): Promise<string> {
  const { text, style = 'professional' } = params;

  const stylePrompts = {
    professional: 'clean, corporate, modern design',
    casual: 'friendly, relaxed, approachable',
    energetic: 'dynamic, vibrant, eye-catching',
  };

  const prompt = `Create a short social media video clip. Text: "${text}". Style: ${stylePrompts[style]}. Duration: 10 seconds.`;

  return generateVideo({
    prompt,
    duration: 10,
    aspectRatio: '9:16', // Vertical for social media
  });
}

export default {
  generateVideo,
  generateArticleIntro,
  generateSocialClip,
  VIDEO_MODELS,
};
