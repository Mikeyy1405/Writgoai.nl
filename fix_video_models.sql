-- Fix video model names in database
-- This script updates old/invalid model names to valid AIML API models

-- Update luma/ray-2 to minimax/hailuo-02 (similar quality and price)
UPDATE video_scenes
SET model = 'minimax/hailuo-02'
WHERE model = 'luma/ray-2';

-- Update luma/ray-flash-2 to video-01 (similar fast/budget option)
UPDATE video_scenes
SET model = 'video-01'
WHERE model = 'luma/ray-flash-2';

-- Update any other potential old model names
UPDATE video_scenes
SET model = 'minimax/hailuo-02'
WHERE model NOT IN (
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
  'veed/fabric-1.0-fast'
);

-- Show updated records
SELECT
  id,
  project_id,
  scene_number,
  model,
  status
FROM video_scenes
ORDER BY created_at DESC
LIMIT 20;
