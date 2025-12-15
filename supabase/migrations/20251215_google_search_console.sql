-- Add Google Search Console fields to Client table
-- Migration: 20251215_google_search_console.sql

BEGIN;

-- Add Google Search Console token fields to Client table
ALTER TABLE "Client" 
ADD COLUMN IF NOT EXISTS "googleSearchConsoleToken" TEXT,
ADD COLUMN IF NOT EXISTS "googleSearchConsoleRefreshToken" TEXT,
ADD COLUMN IF NOT EXISTS "googleSearchConsoleSites" TEXT;

-- Add comments to explain the columns
COMMENT ON COLUMN "Client"."googleSearchConsoleToken" IS 'Encrypted Google Search Console access token';
COMMENT ON COLUMN "Client"."googleSearchConsoleRefreshToken" IS 'Encrypted Google Search Console refresh token';
COMMENT ON COLUMN "Client"."googleSearchConsoleSites" IS 'JSON array of connected Search Console sites';

COMMIT;
