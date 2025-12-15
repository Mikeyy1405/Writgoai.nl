-- Social Media Getlate.Dev Integration Migration
-- Created: 2025-12-15
-- Purpose: Add Getlate.Dev integration for per-project social media posting

-- =====================================================
-- UPDATE: Project Table - Add Getlate.Dev Settings
-- =====================================================
ALTER TABLE "Project" 
  ADD COLUMN IF NOT EXISTS "getlateApiKey" TEXT,
  ADD COLUMN IF NOT EXISTS "autopostEnabled" BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "connectedPlatforms" TEXT[] DEFAULT ARRAY[]::TEXT[]; -- ['twitter', 'linkedin', 'facebook', 'instagram']

COMMENT ON COLUMN "Project"."getlateApiKey" IS 'Getlate.Dev API key for this project';
COMMENT ON COLUMN "Project"."autopostEnabled" IS 'Whether to automatically post to social media via Getlate.Dev';
COMMENT ON COLUMN "Project"."connectedPlatforms" IS 'Social media platforms connected via Getlate.Dev';

-- =====================================================
-- UPDATE: SocialMediaPost Table - Add Project Link
-- =====================================================
-- Add projectId column if it doesn't exist
ALTER TABLE "SocialMediaPost"
  ADD COLUMN IF NOT EXISTS "projectId" TEXT;

-- Add foreign key constraint to Project
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_social_post_project'
  ) THEN
    ALTER TABLE "SocialMediaPost"
      ADD CONSTRAINT "fk_social_post_project" 
      FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for projectId lookups
CREATE INDEX IF NOT EXISTS "idx_social_post_project" ON "SocialMediaPost"("projectId");

-- Add Getlate.Dev specific fields
ALTER TABLE "SocialMediaPost"
  ADD COLUMN IF NOT EXISTS "getlatePostId" TEXT,
  ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;

COMMENT ON COLUMN "SocialMediaPost"."projectId" IS 'Link to Project (alternative to strategyId)';
COMMENT ON COLUMN "SocialMediaPost"."getlatePostId" IS 'ID returned from Getlate.Dev API';
COMMENT ON COLUMN "SocialMediaPost"."errorMessage" IS 'Error message if posting failed';

-- Update status enum to include modern states
-- Note: PostgreSQL doesn't have native ENUMs in this schema, using TEXT constraint
ALTER TABLE "SocialMediaPost"
  DROP CONSTRAINT IF EXISTS "check_social_post_status";

ALTER TABLE "SocialMediaPost"
  ADD CONSTRAINT "check_social_post_status" 
  CHECK (status IN ('draft', 'scheduled', 'posted', 'failed', 'pending'));

-- =====================================================
-- INDEXES for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS "idx_project_autopost" ON "Project"("autopostEnabled") WHERE "autopostEnabled" = TRUE;
CREATE INDEX IF NOT EXISTS "idx_social_post_getlate" ON "SocialMediaPost"("getlatePostId") WHERE "getlatePostId" IS NOT NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
DO $$ 
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Getlate.Dev Social Media Integration Migration';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Added to Project table:';
  RAISE NOTICE '  - getlateApiKey';
  RAISE NOTICE '  - autopostEnabled';
  RAISE NOTICE '  - connectedPlatforms';
  RAISE NOTICE 'Added to SocialMediaPost table:';
  RAISE NOTICE '  - projectId (foreign key to Project)';
  RAISE NOTICE '  - getlatePostId';
  RAISE NOTICE '  - errorMessage';
  RAISE NOTICE 'Migration completed successfully!';
END $$;
