'use server';

/**
 * 🎨 Media Server Actions
 * 
 * Consolidates all media generation functionality:
 * - Image generation (Flux, DALL-E, Stable Diffusion)
 * - Video generation (Luma AI, Runway ML)
 * - Smart featured image generation
 * - S3 upload
 * - Stock image search
 * 
 * Replaces 6+ API routes:
 * - /api/client/generate-image
 * - /api/client/generate-video
 * - /api/client/generate-video-simple
 * - /api/ai-agent/generate-image
 * - /api/ai-agent/generate-video-simple
 * - /api/client/images/search-stock
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { auth, getAuthenticatedClient } from '@/lib/auth';
import { hasEnoughCredits, deductCredits } from '@/lib/credits';
import { generateImage as aimlGenerateImage, IMAGE_MODELS } from '@/lib/aiml-api';
import { uploadToS3 } from '@/lib/s3';
import { searchFreeImages } from '@/lib/free-stock-images';

// ═════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═════════════════════════════════════════════════════════════════════

export type ImageModel =
  | 'FLUX_PRO'
  | 'FLUX_DEV'
  | 'FLUX_SCHNELL'
  | 'DALL_E_3'
  | 'SD_XL'
  | 'NANO_BANANA'
  | 'NANO_BANANA_PRO'
  | 'SD_3'
  | 'SD_35'
  | 'FLUX_REALISM'
  | 'IMAGEN_3';

export interface GenerateImageInput {
  prompt: string;
  model: ImageModel;
  style?: string;
  width?: number;
  height?: number;
  quality?: 'low' | 'medium' | 'high';
}

export interface GenerateImageResult {
  success: boolean;
  imageUrl: string;
  creditsUsed: number;
}

export interface GenerateVideoInput {
  prompt: string;
  provider: 'luma' | 'runway';
  duration?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export interface GenerateVideoResult {
  success: boolean;
  videoUrl: string;
  creditsUsed: number;
  estimatedTime: number;
}

// ═════════════════════════════════════════════════════════════════════
// IMAGE GENERATION
// ═════════════════════════════════════════════════════════════════════

/**
 * Model configuration with costs
 */
const IMAGE_MODEL_CONFIG = {
  NANO_BANANA: { model: IMAGE_MODELS.NANO_BANANA, credits: 2 },
  NANO_BANANA_PRO: { model: IMAGE_MODELS.NANO_BANANA_PRO, credits: 3 },
  SD_3: { model: IMAGE_MODELS.SD_3, credits: 4 },
  SD_35: { model: IMAGE_MODELS.SD_35, credits: 4 },
  FLUX_SCHNELL: { model: IMAGE_MODELS.FLUX_SCHNELL, credits: 3 },
  FLUX_DEV: { model: IMAGE_MODELS.FLUX_DEV, credits: 5 },
  FLUX_PRO: { model: IMAGE_MODELS.FLUX_PRO, credits: 5 },
  FLUX_REALISM: { model: IMAGE_MODELS.FLUX_REALISM, credits: 10 },
  DALL_E_3: { model: IMAGE_MODELS.DALLE_3, credits: 12 },
  SD_XL: { model: IMAGE_MODELS.SD_XL, credits: 4 },
  IMAGEN_3: { model: IMAGE_MODELS.IMAGEN_3, credits: 12 },
};

/**
 * 🎨 Generate Image
 * 
 * Generate images using various AI models
 */
export async function generateImage(
  input: GenerateImageInput
): Promise<GenerateImageResult> {
  try {
    const client = await getAuthenticatedClient();

    if (!input.prompt || input.prompt.trim().length === 0) {
      throw new Error('Prompt is verplicht');
    }

    // Get model config
    const modelConfig = IMAGE_MODEL_CONFIG[input.model];
    if (!modelConfig) {
      throw new Error(`Onbekend model: ${input.model}`);
    }

    // Check credits
    const creditCost = modelConfig.credits;
    const hasCredits = await hasEnoughCredits(client.id, creditCost);
    
    if (!hasCredits) {
      throw new Error(
        `Niet genoeg credits. Deze actie kost ${creditCost} credits.`
      );
    }

    console.log(`🎨 Generating image: ${input.prompt.substring(0, 50)}... (model: ${input.model})`);

    // Generate image
    const result = await aimlGenerateImage({
      prompt: input.prompt,
      model: modelConfig.model,
      width: input.width || 1024,
      height: input.height || 1024,
      style: input.style,
    });

    if (!result.success || !result.imageUrl) {
      throw new Error(result.error || 'Fout bij genereren van afbeelding');
    }

    // Deduct credits
    await deductCredits(
      client.id,
      creditCost,
      `Afbeelding generatie: ${input.prompt.substring(0, 30)}...`,
      {
        model: modelConfig.model,
        tool: 'image_generator',
      }
    );

    console.log(`✅ Image generated: ${result.imageUrl}`);

    return {
      success: true,
      imageUrl: result.imageUrl,
      creditsUsed: creditCost,
    };
  } catch (error: any) {
    console.error('❌ Error generating image:', error);
    throw new Error(error.message || 'Fout bij genereren van afbeelding');
  }
}

// ═════════════════════════════════════════════════════════════════════
// VIDEO GENERATION
// ═════════════════════════════════════════════════════════════════════

/**
 * 🎬 Generate Video
 * 
 * Generate videos using Luma AI or Runway ML
 */
export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoResult> {
  try {
    const client = await getAuthenticatedClient();

    if (!input.prompt || input.prompt.trim().length === 0) {
      throw new Error('Prompt is verplicht');
    }

    // Credit cost based on provider and duration
    const baseCost = input.provider === 'luma' ? 120 : 150;
    const durationMultiplier = (input.duration || 5) / 5;
    const creditCost = Math.round(baseCost * durationMultiplier);

    // Check credits
    const hasCredits = await hasEnoughCredits(client.id, creditCost);
    
    if (!hasCredits) {
      throw new Error(
        `Niet genoeg credits. Deze actie kost ${creditCost} credits.`
      );
    }

    console.log(`🎬 Generating video: ${input.prompt.substring(0, 50)}... (provider: ${input.provider})`);

    let videoUrl = '';
    let estimatedTime = 120; // 2 minutes default

    if (input.provider === 'luma') {
      // Use Luma AI
      const { generateLumaVideo } = await import('@/lib/latedev');
      const result = await generateLumaVideo({
        prompt: input.prompt,
        aspectRatio: input.aspectRatio || '16:9',
      });

      if (!result.success) {
        throw new Error(result.error || 'Fout bij genereren van video met Luma AI');
      }

      videoUrl = result.videoUrl || '';
      estimatedTime = 120; // Luma takes ~2 minutes
    } else {
      // Use Runway ML
      const { generateRunwayVideo } = await import('@/lib/runway-ml-api');
      const result = await generateRunwayVideo({
        prompt: input.prompt,
        duration: input.duration || 5,
      });

      if (!result.success) {
        throw new Error(result.error || 'Fout bij genereren van video met Runway ML');
      }

      videoUrl = result.videoUrl || '';
      estimatedTime = 180; // Runway takes ~3 minutes
    }

    // Deduct credits
    await deductCredits(
      client.id,
      creditCost,
      `Video generatie (${input.provider}): ${input.prompt.substring(0, 30)}...`,
      {
        model: input.provider,
        tool: 'video_generator',
      }
    );

    console.log(`✅ Video generated: ${videoUrl}`);

    return {
      success: true,
      videoUrl,
      creditsUsed: creditCost,
      estimatedTime,
    };
  } catch (error: any) {
    console.error('❌ Error generating video:', error);
    throw new Error(error.message || 'Fout bij genereren van video');
  }
}

// ═════════════════════════════════════════════════════════════════════
// SMART IMAGE GENERATION
// ═════════════════════════════════════════════════════════════════════

/**
 * 🖼️ Generate Featured Image
 * 
 * Generate context-aware featured image for article
 */
export async function generateFeaturedImage(
  articleTitle: string,
  keywords: string[]
): Promise<GenerateImageResult> {
  try {
    const client = await getAuthenticatedClient();

    // Create smart prompt
    const keywordList = keywords.join(', ');
    const prompt = `Professional featured image for article: "${articleTitle}". 
Style: Modern, clean, professional blog header. 
Keywords: ${keywordList}
High quality, 16:9 aspect ratio, suitable for blog post header.`;

    // Use Flux Pro for best quality
    return await generateImage({
      prompt,
      model: 'FLUX_PRO',
      width: 1920,
      height: 1080,
      quality: 'high',
    });
  } catch (error: any) {
    console.error('❌ Error generating featured image:', error);
    throw new Error(error.message || 'Fout bij genereren van featured image');
  }
}

// ═════════════════════════════════════════════════════════════════════
// S3 UPLOAD
// ═════════════════════════════════════════════════════════════════════

/**
 * 📤 Upload to S3
 * 
 * Upload file to AWS S3
 */
export async function uploadFileToS3(
  file: Buffer,
  filename: string,
  contentType?: string
): Promise<{ success: boolean; url: string }> {
  try {
    await auth(); // Verify authentication

    console.log(`📤 Uploading to S3: ${filename}`);

    const url = await uploadToS3(file, filename, contentType);

    console.log(`✅ Uploaded to S3: ${url}`);

    return {
      success: true,
      url,
    };
  } catch (error: any) {
    console.error('❌ Error uploading to S3:', error);
    throw new Error(error.message || 'Fout bij uploaden naar S3');
  }
}

// ═════════════════════════════════════════════════════════════════════
// STOCK IMAGE SEARCH
// ═════════════════════════════════════════════════════════════════════

/**
 * 🔍 Search Stock Images
 * 
 * Search free stock images from Pixabay or Pexels
 */
export async function searchStockImages(
  query: string,
  source: 'pixabay' | 'pexels' = 'pixabay',
  perPage: number = 20
): Promise<{
  success: boolean;
  images: Array<{
    id: string;
    url: string;
    thumbnail: string;
    width: number;
    height: number;
    photographer?: string;
    source: string;
  }>;
}> {
  try {
    await auth(); // Verify authentication

    console.log(`🔍 Searching stock images: ${query} (source: ${source})`);

    const results = await searchFreeImages(query, source, perPage);

    if (!results || results.length === 0) {
      return {
        success: true,
        images: [],
      };
    }

    return {
      success: true,
      images: results,
    };
  } catch (error: any) {
    console.error('❌ Error searching stock images:', error);
    throw new Error(error.message || 'Fout bij zoeken van stock images');
  }
}

// ═════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════════════

/**
 * Get image model info
 */
export async function getImageModels() {
  return {
    success: true,
    models: [
      {
        id: 'NANO_BANANA',
        name: 'Nano Banana 🍌',
        description: 'Ultra snel en budget-vriendelijk - GOEDKOOPSTE',
        quality: 'Goed',
        speed: '⚡⚡⚡⚡ Ultra Snel',
        credits: 2,
        recommended: true,
      },
      {
        id: 'NANO_BANANA_PRO',
        name: 'Nano Banana Pro 🍌⭐',
        description: 'Snelle pro versie met hogere kwaliteit',
        quality: 'Hoog',
        speed: '⚡⚡⚡ Super Snel',
        credits: 3,
      },
      {
        id: 'SD_3',
        name: 'Stable Diffusion 3',
        description: 'Bewezen kwaliteit, goede prijs/kwaliteit',
        quality: 'Hoog',
        speed: '⚡⚡ Snel',
        credits: 4,
      },
      {
        id: 'FLUX_PRO',
        name: 'Flux Pro',
        description: 'Premium kwaliteit voor professionele projecten',
        quality: 'Premium',
        speed: '⚡ Normaal',
        credits: 5,
        recommended: true,
      },
      {
        id: 'FLUX_SCHNELL',
        name: 'Flux Schnell',
        description: 'Snel en betrouwbaar',
        quality: 'Standaard',
        speed: '⚡⚡⚡ Super Snel',
        credits: 3,
      },
      {
        id: 'SD_35',
        name: 'Stable Diffusion 3.5',
        description: 'Nieuwste versie met verbeterde kwaliteit',
        quality: 'Hoog',
        speed: '⚡⚡ Snel',
        credits: 4,
      },
      {
        id: 'FLUX_DEV',
        name: 'Flux Dev',
        description: 'Goede balans tussen kwaliteit en snelheid',
        quality: 'Hoog',
        speed: '⚡⚡ Snel',
        credits: 5,
      },
      {
        id: 'FLUX_REALISM',
        name: 'Flux Realism',
        description: "Ultra-realistische foto's",
        quality: 'Ultra Realistisch',
        speed: '⚡ Normaal',
        credits: 10,
      },
      {
        id: 'DALL_E_3',
        name: 'DALL-E 3',
        description: "OpenAI's premium afbeelding generator",
        quality: 'Premium',
        speed: '⚡ Normaal',
        credits: 12,
      },
      {
        id: 'IMAGEN_3',
        name: 'Google Imagen 3',
        description: "Google's geavanceerde AI afbeeldingen",
        quality: 'Premium',
        speed: '⚡ Normaal',
        credits: 12,
      },
    ],
  };
}
