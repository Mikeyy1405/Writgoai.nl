-- Add metadata column to TopicalAuthorityMap
-- Migration: 20241217160000_add_topical_authority_map_metadata
-- This migration adds the missing metadata column to the TopicalAuthorityMap table

-- Add metadata column if it doesn't exist
ALTER TABLE "TopicalAuthorityMap"
ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}'::jsonb;

-- Add index for metadata queries (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS "idx_topical_map_metadata" 
ON "TopicalAuthorityMap" USING GIN ("metadata");

-- Add comment explaining the column
COMMENT ON COLUMN "TopicalAuthorityMap"."metadata" 
IS 'Additional metadata: {autoDetected, subNiches, primaryKeywords, targetAudience, analysisData, contentGaps, etc}';
