-- ======================================================
-- Migration: Add status column to SavedContent table
-- Date: 2024-12-17 15:00:00
-- Description: Adds a status column to track content lifecycle (draft/published/scheduled)
-- ======================================================

-- Add status column to SavedContent table
ALTER TABLE "SavedContent" 
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'draft';

-- Add index for status queries (for filtering by status)
CREATE INDEX IF NOT EXISTS "idx_savedcontent_status" ON "SavedContent"("status");

-- Add comment to document the column
COMMENT ON COLUMN "SavedContent"."status" IS 'Content lifecycle status: draft (not yet published), published (live on WordPress), scheduled (waiting to be published)';

-- Add check constraint to ensure valid status values
ALTER TABLE "SavedContent"
DROP CONSTRAINT IF EXISTS "chk_savedcontent_status";

ALTER TABLE "SavedContent"
ADD CONSTRAINT "chk_savedcontent_status" 
CHECK ("status" IN ('draft', 'published', 'scheduled'));

-- Update existing records to have appropriate status based on publishedUrl
UPDATE "SavedContent"
SET "status" = CASE 
  WHEN "publishedUrl" IS NOT NULL AND "publishedUrl" != '' THEN 'published'
  ELSE 'draft'
END
WHERE "status" = 'draft'; -- Only update records that still have default status

-- Add publishedAt column if it doesn't exist (for tracking publication timestamp)
ALTER TABLE "SavedContent"
ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP WITH TIME ZONE;

-- Add index for publishedAt (for sorting by publication date)
CREATE INDEX IF NOT EXISTS "idx_savedcontent_published_at" ON "SavedContent"("publishedAt");

-- Update publishedAt for existing published content
UPDATE "SavedContent"
SET "publishedAt" = "updatedAt"
WHERE "status" = 'published' AND "publishedAt" IS NULL;

-- Add comment for publishedAt
COMMENT ON COLUMN "SavedContent"."publishedAt" IS 'Timestamp when content was published to WordPress';
