
/**
 * Vision Analysis Helper
 * Voor het analyseren van afbeeldingen met AI vision models
 */

import { chatCompletion } from './aiml-api';

export interface VisionAnalysisResult {
  success: boolean;
  description?: string;
  details?: string;
  objects?: string[];
  text?: string;
  error?: string;
}

/**
 * Analyseer een afbeelding met AI vision
 */
export async function analyzeImage(
  imageUrl: string,
  prompt: string = 'Beschrijf deze afbeelding in detail.'
): Promise<VisionAnalysisResult> {
  try {
    console.log('🔍 Analyzing image with vision model:', imageUrl.substring(0, 100));
    
    // Use GPT-4 Vision voor image analysis
    const response = await chatCompletion({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high'
              }
            }
          ] as any
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const description = response.choices[0]?.message?.content || '';
    
    if (!description) {
      throw new Error('Geen beschrijving gegenereerd');
    }

    console.log('✅ Image analysis complete:', description.substring(0, 200));
    
    return {
      success: true,
      description,
      details: description,
    };
  } catch (error: any) {
    console.error('❌ Vision analysis error:', error);
    return {
      success: false,
      error: error.message || 'Afbeelding analyse mislukt'
    };
  }
}

/**
 * Analyseer meerdere afbeeldingen
 */
export async function analyzeMultipleImages(
  images: Array<{ url: string; name: string }>,
  prompt: string = 'Beschrijf wat je ziet in deze afbeeldingen.'
): Promise<VisionAnalysisResult> {
  try {
    console.log(`🔍 Analyzing ${images.length} images with vision model`);
    
    // Build message content with all images
    const content: any[] = [
      {
        type: 'text',
        text: prompt
      }
    ];
    
    // Add all images
    for (const img of images) {
      content.push({
        type: 'image_url',
        image_url: {
          url: img.url,
          detail: 'high'
        }
      });
    }
    
    const response = await chatCompletion({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: content as any
        }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const description = response.choices[0]?.message?.content || '';
    
    if (!description) {
      throw new Error('Geen beschrijving gegenereerd');
    }

    console.log('✅ Multiple images analysis complete');
    
    return {
      success: true,
      description,
      details: description,
    };
  } catch (error: any) {
    console.error('❌ Vision analysis error:', error);
    return {
      success: false,
      error: error.message || 'Afbeelding analyse mislukt'
    };
  }
}
