import Replicate from 'replicate';

// Image model definitions
export const IMAGE_MODELS = {
  // Best overall quality
  FLUX_PRO: 'black-forest-labs/flux-1.1-pro',
  
  // Fast and good quality
  FLUX_SCHNELL: 'black-forest-labs/flux-schnell',
  
  // Budget option
  FLUX_DEV: 'black-forest-labs/flux-dev',
  
  // Stable Diffusion (fallback)
  SDXL: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
} as const;

export type ImageModel = typeof IMAGE_MODELS[keyof typeof IMAGE_MODELS];

// Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY || 'dummy-key',
});

// Generate image
export async function generateImage(params: {
  prompt: string;
  model?: ImageModel;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  numImages?: number;
}): Promise<string[]> {
  const {
    prompt,
    model = IMAGE_MODELS.FLUX_PRO,
    aspectRatio = '16:9',
    numImages = 1,
  } = params;

  try {
    console.log(`Generating image with ${model}...`);
    
    const output = await replicate.run(model as any, {
      input: {
        prompt,
        aspect_ratio: aspectRatio,
        num_outputs: numImages,
        output_format: 'webp',
        output_quality: 90,
      },
    });

    // Output is array of URLs
    return Array.isArray(output) ? output : [output as string];
  } catch (error: any) {
    console.error('Image generation error:', error.message);
    
    // Fallback to SDXL if Flux fails
    if (model !== IMAGE_MODELS.SDXL) {
      console.log('Falling back to SDXL...');
      return generateImage({ ...params, model: IMAGE_MODELS.SDXL });
    }
    
    throw error;
  }
}

// Generate featured image for article
export async function generateFeaturedImage(params: {
  articleTitle: string;
  articleSummary?: string;
  style?: 'professional' | 'modern' | 'minimalist' | 'vibrant';
}): Promise<string> {
  const { articleTitle, articleSummary, style = 'professional' } = params;

  const stylePrompts = {
    professional: 'professional, clean, corporate, high-quality photography',
    modern: 'modern, sleek, contemporary design, bold colors',
    minimalist: 'minimalist, simple, clean lines, white space',
    vibrant: 'vibrant, colorful, energetic, eye-catching',
  };

  const prompt = `Create a featured blog image for an article titled "${articleTitle}". ${
    articleSummary ? `The article is about: ${articleSummary}. ` : ''
  }Style: ${stylePrompts[style]}. High quality, professional, suitable for blog header. No text in image.`;

  const images = await generateImage({
    prompt,
    aspectRatio: '16:9',
    numImages: 1,
  });

  return images[0];
}

// Generate multiple images for article sections
export async function generateArticleImages(params: {
  sections: Array<{
    heading: string;
    content: string;
  }>;
  count?: number;
}): Promise<Array<{ heading: string; imageUrl: string }>> {
  const { sections, count = 3 } = params;

  // Select most important sections
  const selectedSections = sections.slice(0, count);

  const results = await Promise.all(
    selectedSections.map(async (section) => {
      const prompt = `Create an illustration for a blog section titled "${section.heading}". ${
        section.content.substring(0, 200)
      }... Professional, clean, suitable for blog content. No text in image.`;

      try {
        const images = await generateImage({
          prompt,
          aspectRatio: '16:9',
          numImages: 1,
          model: IMAGE_MODELS.FLUX_SCHNELL, // Use faster model for multiple images
        });

        return {
          heading: section.heading,
          imageUrl: images[0],
        };
      } catch (error) {
        console.error(`Failed to generate image for "${section.heading}"`);
        return null;
      }
    })
  );

  return results.filter((r) => r !== null) as Array<{ heading: string; imageUrl: string }>;
}

// Download image from URL and return base64
export async function downloadImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/webp';
  return `data:${contentType};base64,${base64}`;
}

export default {
  generateImage,
  generateFeaturedImage,
  generateArticleImages,
  downloadImageAsBase64,
  IMAGE_MODELS,
};
