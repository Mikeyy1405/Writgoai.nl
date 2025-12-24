# Video Models Database Migration

## Problem
Old video scenes in the database use invalid model names like `luma/ray-2` which cause video generation to fail with "Unknown model" errors.

## Solution
This migration updates all old model names to valid AIML API models.

## How to Run the Migration

### Option 1: Via Admin API (Recommended - After Deployment)

After deploying this branch, you can check and fix invalid models via API:

```bash
# Check which scenes have invalid models
curl https://writgoai.nl/api/admin/fix-video-models

# Fix all invalid models automatically
curl -X POST https://writgoai.nl/api/admin/fix-video-models
```

### Option 2: Via Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Open the SQL Editor
3. Copy and paste the contents of `fix_video_models.sql`
4. Run the query

### Option 3: Via TypeScript Script (Local Development)

```bash
# Install dependencies first if needed
npm install

# Run the migration script
npx tsx scripts/fix-video-models.ts
```

## What Gets Updated

- `luma/ray-2` → `minimax/hailuo-02` (similar quality, 10 credits)
- `luma/ray-flash-2` → `video-01` (budget option, 8 credits)
- Any other invalid models → `minimax/hailuo-02` (default)

## Valid Models

After migration, all scenes will use one of these valid AIML API models:

**Budget Options (8-10 credits):**
- `video-01`
- `minimax/hailuo-02`
- `sber-ai/kandinsky5-distill-t2v`
- `veed/fabric-1.0-fast`

**Standard Options (12-15 credits):**
- `minimax/hailuo-2.3`
- `kling-video/v1.6/standard/text-to-video`
- `pixverse/v5/text-to-video`
- `gen3a_turbo`

**Premium Options (20-35 credits):**
- `runway/gen4_turbo`
- `runway/gen4_aleph`
- `openai/sora-2-t2v`
- `openai/sora-2-pro-t2v`

See `lib/aiml-api-client.ts` for the complete list of 25+ models.

## Verification

After running the migration, you can verify:

```bash
# Via API
curl https://writgoai.nl/api/admin/fix-video-models

# Check the response - "invalid" should be 0
```

## Safety

- The migration only updates the `model` field in `video_scenes` table
- No video URLs or other data is modified
- The migration is idempotent (safe to run multiple times)
- Failed scenes can be retried after migration

## Next Steps

After migration:
1. Any new video projects will automatically use `minimax/hailuo-02` as default
2. Failed scenes can be regenerated with the new valid model
3. Users can select from 25+ valid models in the UI
