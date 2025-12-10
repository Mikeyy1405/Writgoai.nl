-- Migration: Add BrandSettings table for branding configuration
-- Description: Creates the BrandSettings table to store company branding information
-- Date: 2025-12-10

-- Create BrandSettings table if it doesn't exist
CREATE TABLE IF NOT EXISTS "BrandSettings" (
  "id" TEXT PRIMARY KEY DEFAULT 'default',
  "companyName" TEXT NOT NULL DEFAULT 'WritgoAI',
  "tagline" TEXT DEFAULT 'Content die scoort',
  "logoUrl" TEXT,
  "logoLightUrl" TEXT,
  "logoDarkUrl" TEXT,
  "logoIconUrl" TEXT,
  "faviconUrl" TEXT,
  "favicon192Url" TEXT,
  "favicon512Url" TEXT,
  "primaryColor" TEXT NOT NULL DEFAULT '#FF6B35',
  "secondaryColor" TEXT NOT NULL DEFAULT '#0B3C5D',
  "accentColor" TEXT DEFAULT '#FF9933',
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "linkedinUrl" TEXT,
  "twitterUrl" TEXT,
  "facebookUrl" TEXT,
  "instagramUrl" TEXT,
  "defaultMetaTitle" TEXT,
  "defaultMetaDescription" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger to automatically update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_brandsettings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_brandsettings_updated_at ON "BrandSettings";
CREATE TRIGGER update_brandsettings_updated_at 
  BEFORE UPDATE ON "BrandSettings"
  FOR EACH ROW
  EXECUTE FUNCTION update_brandsettings_updated_at();

-- Insert default branding settings if not exists
INSERT INTO "BrandSettings" (
  "id",
  "companyName",
  "tagline",
  "logoUrl",
  "primaryColor",
  "secondaryColor",
  "accentColor"
)
VALUES (
  'default',
  'Writgo Media',
  'AI-First Omnipresence Content Agency',
  '/writgo-media-logo-transparent.png',
  '#FF5722',
  '#2196F3',
  '#FF9800'
)
ON CONFLICT ("id") DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON "BrandSettings" TO authenticated;
GRANT SELECT ON "BrandSettings" TO anon;
