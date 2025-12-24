import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const VALID_MODELS = [
  'minimax/hailuo-02',
  'minimax/hailuo-2.3',
  'video-01',
  'video-01-live2d',
  'openai/sora-2-t2v',
  'openai/sora-2-i2v',
  'openai/sora-2-pro-t2v',
  'openai/sora-2-pro-i2v',
  'pixverse/v5/text-to-video',
  'pixverse/v5/image-to-video',
  'pixverse/v5/transition',
  'pixverse/v5-5-text-to-video',
  'pixverse/v5-5-image-to-video',
  'gen3a_turbo',
  'runway/gen4_turbo',
  'runway/gen4_aleph',
  'runway/act_two',
  'kling-video/v1.6/standard/text-to-video',
  'sber-ai/kandinsky5-t2v',
  'sber-ai/kandinsky5-distill-t2v',
  'veed/fabric-1.0',
  'veed/fabric-1.0-fast',
];

/**
 * POST /api/admin/fix-video-models
 * Fix all video scenes with invalid model names
 */
export async function POST(req: NextRequest) {
  try {
    console.log('🔍 Checking for scenes with invalid models...');

    // Get all scenes
    const { data: scenes, error: fetchError } = await supabase
      .from('video_scenes')
      .select('id, project_id, scene_number, model, status');

    if (fetchError) {
      console.error('Error fetching scenes:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch scenes', details: fetchError }, { status: 500 });
    }

    if (!scenes || scenes.length === 0) {
      return NextResponse.json({ message: 'No scenes found in database', updated: 0 });
    }

    // Find scenes with invalid models
    const invalidScenes = scenes.filter(scene => !VALID_MODELS.includes(scene.model));

    if (invalidScenes.length === 0) {
      return NextResponse.json({ message: 'All scenes have valid models', updated: 0 });
    }

    console.log(`Found ${invalidScenes.length} scenes with invalid models`);

    // Map old models to new ones
    const modelMapping: Record<string, string> = {
      'luma/ray-2': 'minimax/hailuo-02',
      'luma/ray-flash-2': 'video-01',
    };

    const updates: any[] = [];

    for (const scene of invalidScenes) {
      const newModel = modelMapping[scene.model] || 'minimax/hailuo-02';

      const { error: updateError } = await supabase
        .from('video_scenes')
        .update({ model: newModel })
        .eq('id', scene.id);

      if (updateError) {
        console.error(`Error updating scene ${scene.id}:`, updateError);
      } else {
        console.log(`✓ Updated scene ${scene.id}: ${scene.model} → ${newModel}`);
        updates.push({
          sceneId: scene.id,
          oldModel: scene.model,
          newModel: newModel,
        });
      }
    }

    return NextResponse.json({
      message: `Successfully updated ${updates.length} scenes`,
      updated: updates.length,
      total: scenes.length,
      invalid: invalidScenes.length,
      updates: updates,
    });

  } catch (error: any) {
    console.error('Fix video models error:', error);
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}

/**
 * GET /api/admin/fix-video-models
 * Check which scenes have invalid models (without updating)
 */
export async function GET(req: NextRequest) {
  try {
    const { data: scenes, error: fetchError } = await supabase
      .from('video_scenes')
      .select('id, project_id, scene_number, model, status');

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch scenes', details: fetchError }, { status: 500 });
    }

    if (!scenes || scenes.length === 0) {
      return NextResponse.json({ total: 0, invalid: 0, validModels: VALID_MODELS });
    }

    const invalidScenes = scenes.filter(scene => !VALID_MODELS.includes(scene.model));

    const modelCounts: Record<string, number> = {};
    invalidScenes.forEach(scene => {
      modelCounts[scene.model] = (modelCounts[scene.model] || 0) + 1;
    });

    return NextResponse.json({
      total: scenes.length,
      invalid: invalidScenes.length,
      valid: scenes.length - invalidScenes.length,
      invalidModelCounts: modelCounts,
      invalidScenes: invalidScenes.slice(0, 10), // Show first 10
      validModels: VALID_MODELS,
    });

  } catch (error: any) {
    console.error('Check video models error:', error);
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}
