
/**
 * 🎨 Smart Image Generator
 * Gebruikt project settings om hoogwaardige afbeeldingen te genereren
 * - Featured images: AI-generated (Flux Pro/GPT Image/Stable Diffusion)
 * - Mid-text images: Gratis stock foto's (indien enabled) of AI
 */

import { generateImage, IMAGE_MODELS } from './aiml-api';
import { searchFreeStockImages, downloadImageToBuffer, type StockImageResult } from './free-stock-images';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SmartImageOptions {
  prompt: string;
  projectId?: string;
  type: 'featured' | 'mid-text';  // Featured = altijd AI, Mid-text = gratis indien mogelijk
  width?: number;
  height?: number;
}

export interface SmartImageResult {
  success: boolean;
  imageUrl?: string;
  buffer?: Buffer;
  model?: string;
  cost: number;  // in credits
  source: 'ai-generated' | 'free-stock';
  attribution?: string;
  error?: string;
}

/**
 * Map project image model setting naar AIML API model
 */
function getImageModel(projectSetting: string): keyof typeof IMAGE_MODELS {
  switch (projectSetting) {
    case 'stable-diffusion-3':
      return 'SD_3';
    case 'stable-diffusion-35':
      return 'SD_35';
    case 'flux-pro':
      return 'FLUX_PRO';
    case 'gpt-image-1':
      return 'GPT_IMAGE_1';
    case 'nano-banana':
      return 'NANO_BANANA';
    case 'nano-banana-pro':
      return 'NANO_BANANA_PRO';
    default:
      return 'SD_35';  // Default: Stable Diffusion 3.5 - BESTE kwaliteit/prijs ratio (4 credits vs 5 voor Flux)
  }
}

/**
 * Bereken credit cost op basis van model
 */
function getCreditCost(projectSetting: string): number {
  switch (projectSetting) {
    case 'stable-diffusion-3':
    case 'stable-diffusion-35':
      return 4;  // $0.037
    case 'flux-pro':
      return 5;  // $0.05
    case 'gpt-image-1':
      return 18;  // $0.18
    case 'nano-banana':
      return 2;  // Ultra snel en budget-vriendelijk
    case 'nano-banana-pro':
      return 3;  // Snelle pro versie met hogere kwaliteit
    default:
      return 5;  // Default: Flux Pro
  }
}

/**
 * 🎯 HOOFD FUNCTIE: Genereer afbeelding op basis van project settings
 */
export async function generateSmartImage(
  options: SmartImageOptions
): Promise<SmartImageResult> {
  try {
    // Haal project settings op als projectId beschikbaar is
    let imageModel = 'stable-diffusion-35';  // Default: SD 3.5 - beste kwaliteit/prijs
    let useFreeStockImages = true;  // Default

    if (options.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: options.projectId },
        select: {
          imageModel: true,
          useFreeStockImages: true,
        },
      });

      if (project) {
        imageModel = project.imageModel;
        useFreeStockImages = project.useFreeStockImages;
      }
    }

    // 💰 STRATEGIE 1: Probeer gratis stock foto's voor mid-text images
    if (options.type === 'mid-text' && useFreeStockImages) {
      console.log('🔍 Trying free stock images for mid-text image...');
      
      const stockImages = await searchFreeStockImages({
        query: options.prompt,
        orientation: 'horizontal',
        minWidth: options.width || 1920,
        minHeight: options.height || 1080,
        count: 1,
      });

      if (stockImages.length > 0) {
        const image = stockImages[0];
        console.log(`✅ Found free stock image from ${image.source}!`);
        
        return {
          success: true,
          imageUrl: image.url,
          cost: 0,  // GRATIS! 🎉
          source: 'free-stock',
          attribution: image.photographer 
            ? `Foto: ${image.photographer} (${image.source})` 
            : undefined,
        };
      }

      console.log('⚠️  No free stock images found, falling back to AI generation');
    }

    // 🎨 STRATEGIE 2: AI-generated images
    console.log(`🎨 Generating AI image with ${imageModel}...`);
    
    const aiModel = getImageModel(imageModel);
    const result = await generateImage({
      prompt: options.prompt,
      model: aiModel,
      width: options.width || 1920,
      height: options.height || 1080,
      num_images: 1,
    });

    if (!result.success || !result.images || result.images.length === 0) {
      return {
        success: false,
        cost: 0,
        source: 'ai-generated',
        error: result.error || 'Geen afbeelding gegenereerd',
      };
    }

    const imageUrl = result.images[0];
    const cost = getCreditCost(imageModel);

    console.log(`✅ AI image generated with ${imageModel} (${cost} credits)`);

    return {
      success: true,
      imageUrl,
      model: imageModel,
      cost,
      source: 'ai-generated',
    };

  } catch (error: any) {
    console.error('❌ Smart image generation error:', error);
    return {
      success: false,
      cost: 0,
      source: 'ai-generated',
      error: error.message,
    };
  }
}

/**
 * Helper: Genereer meerdere afbeeldingen tegelijk
 */
export async function generateMultipleSmartImages(
  images: SmartImageOptions[]
): Promise<SmartImageResult[]> {
  return Promise.all(images.map(img => generateSmartImage(img)));
}

/**
 * Helper: Download afbeelding naar buffer (voor upload)
 */
export async function downloadImageFromResult(
  result: SmartImageResult
): Promise<Buffer | null> {
  if (!result.success || !result.imageUrl) {
    return null;
  }

  try {
    return await downloadImageToBuffer(result.imageUrl);
  } catch (error) {
    console.error('❌ Image download error:', error);
    return null;
  }
}
