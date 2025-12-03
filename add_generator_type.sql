
-- Add generatorType column to SavedContent table
ALTER TABLE "SavedContent" ADD COLUMN IF NOT EXISTS "generatorType" TEXT;
