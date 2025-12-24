/**
 * Script to fix old video model names in the database
 * Run with: npx tsx scripts/fix-video-models.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

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

async function fixVideoModels() {
  console.log('🔍 Checking for scenes with invalid models...\n');

  // Get all scenes
  const { data: scenes, error: fetchError } = await supabase
    .from('video_scenes')
    .select('id, project_id, scene_number, model, status');

  if (fetchError) {
    console.error('Error fetching scenes:', fetchError);
    process.exit(1);
  }

  if (!scenes || scenes.length === 0) {
    console.log('No scenes found in database.');
    return;
  }

  // Find scenes with invalid models
  const invalidScenes = scenes.filter(scene => !VALID_MODELS.includes(scene.model));

  if (invalidScenes.length === 0) {
    console.log('✅ All scenes have valid models!');
    return;
  }

  console.log(`Found ${invalidScenes.length} scenes with invalid models:\n`);

  // Group by model name
  const modelCounts: Record<string, number> = {};
  invalidScenes.forEach(scene => {
    modelCounts[scene.model] = (modelCounts[scene.model] || 0) + 1;
  });

  Object.entries(modelCounts).forEach(([model, count]) => {
    console.log(`  - ${model}: ${count} scenes`);
  });

  console.log('\n🔄 Updating invalid models to minimax/hailuo-02...\n');

  // Map old models to new ones
  const modelMapping: Record<string, string> = {
    'luma/ray-2': 'minimax/hailuo-02',
    'luma/ray-flash-2': 'video-01',
  };

  let updatedCount = 0;

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
      updatedCount++;
    }
  }

  console.log(`\n✅ Successfully updated ${updatedCount} scenes!`);
}

fixVideoModels()
  .then(() => {
    console.log('\n✨ Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
