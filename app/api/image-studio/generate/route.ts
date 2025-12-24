import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkCredits, deductCredits } from '@/lib/credit-manager';
import { getModelById } from '@/lib/image-models';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const AIML_API_KEY = process.env.AIML_API_KEY!;
const AIML_BASE_URL = 'https://api.aimlapi.com/v1';

interface GenerateImageRequest {
  model: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string;
  width?: number;
  height?: number;
  numImages?: number;
  guidanceScale?: number;
  numInferenceSteps?: number;
  seed?: number;
  textOverlay?: {
    text: string;
    position: 'top' | 'center' | 'bottom';
    fontSize?: number;
    color?: string;
  };
  imageUrl?: string; // For image-to-image models
}

/**
 * POST /api/image-studio/generate
 * Generate images using AIML image models
 */
export async function POST(req: NextRequest) {
  try {
    // Get user from session
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: GenerateImageRequest = await req.json();
    const {
      model: modelId,
      prompt,
      negativePrompt,
      aspectRatio = '1:1',
      width,
      height,
      numImages = 1,
      guidanceScale = 7.5,
      numInferenceSteps = 50,
      seed,
      textOverlay,
      imageUrl,
    } = body;

    // Validate input
    if (!modelId || !prompt) {
      return NextResponse.json(
        { error: 'Model and prompt are required' },
        { status: 400 }
      );
    }

    // Get model configuration
    const modelConfig = getModelById(modelId);
    if (!modelConfig) {
      return NextResponse.json(
        { error: 'Invalid model ID' },
        { status: 400 }
      );
    }

    // Check if model supports the requested capability
    if (imageUrl && !modelConfig.capabilities.imageToImage) {
      return NextResponse.json(
        { error: 'This model does not support image-to-image generation' },
        { status: 400 }
      );
    }

    // Calculate total credits needed (credits per image × number of images)
    const totalCredits = modelConfig.credits * numImages;

    // Check credits
    const hasCredits = await checkCredits(user.id, modelId as any);
    if (!hasCredits) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: totalCredits,
        },
        { status: 402 }
      );
    }

    // Calculate dimensions from aspect ratio if not provided
    let finalWidth = width;
    let finalHeight = height;

    if (!width || !height) {
      const dimensions = getAspectRatioDimensions(aspectRatio);
      finalWidth = dimensions.width;
      finalHeight = dimensions.height;
    }

    // Prepare API request
    const apiPayload: any = {
      model: modelConfig.apiModel,
      prompt: prompt,
      n: numImages,
      size: `${finalWidth}x${finalHeight}`,
    };

    // Add optional parameters
    if (negativePrompt) {
      apiPayload.negative_prompt = negativePrompt;
    }
    if (guidanceScale) {
      apiPayload.guidance_scale = guidanceScale;
    }
    if (numInferenceSteps) {
      apiPayload.num_inference_steps = numInferenceSteps;
    }
    if (seed) {
      apiPayload.seed = seed;
    }
    if (imageUrl) {
      apiPayload.image = imageUrl;
    }

    console.log('Generating image with AIML API:', {
      model: modelConfig.apiModel,
      prompt: prompt.substring(0, 100),
      size: `${finalWidth}x${finalHeight}`,
      numImages,
    });

    // Call AIML API
    const response = await fetch(`${AIML_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AIML API error:', errorText);

      return NextResponse.json(
        {
          error: 'Image generation failed',
          details: errorText,
          model: modelConfig.name,
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Process images
    const images = result.data || [];
    const processedImages = await Promise.all(
      images.map(async (img: any, index: number) => {
        let imageUrl = img.url || img.b64_json;

        // If base64, convert to data URL
        if (img.b64_json && !img.url) {
          imageUrl = `data:image/png;base64,${img.b64_json}`;
        }

        // Apply text overlay if requested
        if (textOverlay && textOverlay.text) {
          // Note: Text overlay would need to be implemented on the client side
          // or using a separate image processing service
          // For now, we'll include the overlay data in the response
        }

        return {
          url: imageUrl,
          index,
          width: finalWidth,
          height: finalHeight,
          textOverlay: textOverlay || null,
        };
      })
    );

    // Deduct credits
    for (let i = 0; i < numImages; i++) {
      await deductCredits(user.id, modelId as any);
    }

    console.log(`Generated ${images.length} images, deducted ${totalCredits} credits`);

    // Return result
    return NextResponse.json({
      success: true,
      images: processedImages,
      model: {
        id: modelConfig.id,
        name: modelConfig.name,
        provider: modelConfig.provider,
      },
      creditsUsed: totalCredits,
      metadata: {
        prompt,
        negativePrompt,
        aspectRatio,
        width: finalWidth,
        height: finalHeight,
        guidanceScale,
        numInferenceSteps,
        seed: seed || 'random',
      },
    });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/image-studio/generate
 * Get user's image generation history
 */
export async function GET(req: NextRequest) {
  try {
    // Get user from session
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get credit usage logs for image generation
    const { data: logs, error: logsError } = await supabase
      .from('credit_usage_logs')
      .select('*')
      .eq('user_id', user.id)
      .like('action', 'image_%')
      .order('created_at', { ascending: false })
      .limit(50);

    if (logsError) {
      console.error('Error fetching image history:', logsError);
      return NextResponse.json(
        { error: 'Failed to fetch image history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      history: logs || [],
    });

  } catch (error: any) {
    console.error('Error fetching image history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get dimensions from aspect ratio
 */
function getAspectRatioDimensions(aspectRatio: string): { width: number; height: number } {
  const ratioMap: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1024, height: 1024 },
    '16:9': { width: 1024, height: 576 },
    '9:16': { width: 576, height: 1024 },
    '4:3': { width: 1024, height: 768 },
    '3:4': { width: 768, height: 1024 },
    '21:9': { width: 1024, height: 439 },
    '9:21': { width: 439, height: 1024 },
  };

  return ratioMap[aspectRatio] || ratioMap['1:1'];
}
