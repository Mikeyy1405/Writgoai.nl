import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCreditBalance, deductCredits } from '@/lib/credit-manager';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY!;

// Video model configurations
const VIDEO_MODELS: Record<string, { name: string; credits: number; replicateModel: string }> = {
  'luma/dream-machine': {
    name: 'Luma Dream Machine',
    credits: 10,
    replicateModel: 'luma/dream-machine',
  },
  'runway/gen-3': {
    name: 'Runway Gen-3',
    credits: 15,
    replicateModel: 'runway/gen-3-turbo',
  },
  'pika/pika-2.0': {
    name: 'Pika 2.0',
    credits: 8,
    replicateModel: 'pika-labs/pika-2.0',
  },
};

interface GenerateVideoRequest {
  model: string;
  prompt: string;
  duration?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

/**
 * POST /api/video-studio/generate
 * Generate videos using AI video models
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

    const body: GenerateVideoRequest = await req.json();
    const {
      model: modelId,
      prompt,
      duration = 5,
      aspectRatio = '16:9',
    } = body;

    // Validate input
    if (!modelId || !prompt) {
      return NextResponse.json(
        { error: 'Model and prompt are required' },
        { status: 400 }
      );
    }

    // Get model configuration
    const modelConfig = VIDEO_MODELS[modelId];
    if (!modelConfig) {
      return NextResponse.json(
        { error: 'Invalid model ID' },
        { status: 400 }
      );
    }

    // Get user's credit balance
    const balance = await getCreditBalance(user.id);
    if (!balance) {
      return NextResponse.json(
        { error: 'Unable to fetch credit balance' },
        { status: 500 }
      );
    }

    // Admin users have unlimited credits, skip checks for them
    if (!balance.is_admin) {
      // Check if subscription is active
      if (!balance.subscription_active) {
        return NextResponse.json(
          { error: 'Subscription not active' },
          { status: 402 }
        );
      }

      // Check if user has enough credits
      if (balance.credits_remaining < modelConfig.credits) {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            required: modelConfig.credits,
            available: balance.credits_remaining
          },
          { status: 402 }
        );
      }
    }

    console.log('Generating video with Replicate:', {
      model: modelConfig.replicateModel,
      prompt: prompt.substring(0, 100),
      duration,
      aspectRatio,
    });

    // Call Replicate API
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: modelConfig.replicateModel,
        input: {
          prompt,
          duration,
          aspect_ratio: aspectRatio,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Replicate API error:', errorText);

      return NextResponse.json(
        {
          error: 'Video generation failed',
          details: errorText,
          model: modelConfig.name,
        },
        { status: response.status }
      );
    }

    const prediction = await response.json();

    // Poll for completion
    let videoUrl = '';
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5 second intervals

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            'Authorization': `Token ${REPLICATE_API_KEY}`,
          },
        }
      );

      const statusData = await statusResponse.json();

      if (statusData.status === 'succeeded') {
        videoUrl = statusData.output;
        break;
      } else if (statusData.status === 'failed') {
        return NextResponse.json(
          { error: 'Video generation failed', details: statusData.error },
          { status: 500 }
        );
      }

      // Wait 5 seconds before polling again
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video generation timed out' },
        { status: 504 }
      );
    }

    // Deduct credits
    await deductCredits(user.id, 'video_generation' as any, modelConfig.credits);

    console.log(`Generated video, deducted ${modelConfig.credits} credits`);

    // Return result
    return NextResponse.json({
      success: true,
      url: videoUrl,
      model: {
        id: modelId,
        name: modelConfig.name,
      },
      creditsUsed: modelConfig.credits,
      metadata: {
        prompt,
        duration,
        aspectRatio,
      },
    });

  } catch (error: any) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    );
  }
}
