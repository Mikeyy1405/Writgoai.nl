-- AlterTable: Change logo URL fields to TEXT type for Base64 storage
-- This migration updates BrandSettings logo fields to support large Base64 strings
-- Migration is atomic - either all changes succeed or none do
--
-- ROLLBACK PLAN (if needed):
-- This migration converts VARCHAR to TEXT which is safe and lossless.
-- To rollback, you would need to convert TEXT back to VARCHAR, but this may
-- truncate data if any Base64 strings exceed VARCHAR limits.
-- Recommended: Keep as TEXT or restore from backup if rollback is required.

BEGIN;

-- Update logoUrl to TEXT type (safe conversion from VARCHAR to TEXT)
ALTER TABLE "BrandSettings" ALTER COLUMN "logoUrl" TYPE TEXT;

-- Update logoLightUrl to TEXT type
ALTER TABLE "BrandSettings" ALTER COLUMN "logoLightUrl" TYPE TEXT;

-- Update logoDarkUrl to TEXT type
ALTER TABLE "BrandSettings" ALTER COLUMN "logoDarkUrl" TYPE TEXT;

-- Update logoIconUrl to TEXT type
ALTER TABLE "BrandSettings" ALTER COLUMN "logoIconUrl" TYPE TEXT;

-- Update faviconUrl to TEXT type
ALTER TABLE "BrandSettings" ALTER COLUMN "faviconUrl" TYPE TEXT;

-- Update favicon192Url to TEXT type
ALTER TABLE "BrandSettings" ALTER COLUMN "favicon192Url" TYPE TEXT;

-- Update favicon512Url to TEXT type
ALTER TABLE "BrandSettings" ALTER COLUMN "favicon512Url" TYPE TEXT;

COMMIT;
