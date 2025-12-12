-- ============================================
-- WEBSITE ANALYSIS TABLE MIGRATION
-- ============================================
-- This migration adds support for AI-powered website analysis
-- to automatically detect niche, target audience, tone, and keywords

-- Create WebsiteAnalysis table
CREATE TABLE IF NOT EXISTS "WebsiteAnalysis" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "clientId" TEXT NOT NULL,
  "niche" TEXT NOT NULL,
  "nicheConfidence" INTEGER DEFAULT 0,
  "targetAudience" TEXT NOT NULL,
  "audienceConfidence" INTEGER DEFAULT 0,
  "tone" TEXT NOT NULL,
  "toneConfidence" INTEGER DEFAULT 0,
  "keywords" TEXT[] DEFAULT '{}',
  "themes" TEXT[] DEFAULT '{}',
  "reasoning" TEXT,
  "websiteUrl" TEXT,
  "blogPostsAnalyzed" INTEGER DEFAULT 0,
  "socialPostsAnalyzed" INTEGER DEFAULT 0,
  "analyzedAt" TIMESTAMP DEFAULT NOW(),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraint to Client table
ALTER TABLE "WebsiteAnalysis" 
ADD CONSTRAINT "WebsiteAnalysis_clientId_fkey" 
FOREIGN KEY ("clientId") 
REFERENCES "Client"("id") 
ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "WebsiteAnalysis_clientId_idx" ON "WebsiteAnalysis"("clientId");
CREATE INDEX IF NOT EXISTS "WebsiteAnalysis_analyzedAt_idx" ON "WebsiteAnalysis"("analyzedAt" DESC);

-- Add RLS policies
ALTER TABLE "WebsiteAnalysis" ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin full access on WebsiteAnalysis" ON "WebsiteAnalysis"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User"."id" = auth.uid()
      AND "User"."role" = 'admin'
    )
  );

-- Clients can only read their own analysis
CREATE POLICY "Clients can read own analysis" ON "WebsiteAnalysis"
  FOR SELECT
  USING (
    "clientId" IN (
      SELECT "id" FROM "Client"
      WHERE "Client"."userId" = auth.uid()
    )
  );

-- Add trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_website_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER website_analysis_updated_at
  BEFORE UPDATE ON "WebsiteAnalysis"
  FOR EACH ROW
  EXECUTE FUNCTION update_website_analysis_updated_at();

-- Verification
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'WebsiteAnalysis'
  ) THEN
    RAISE NOTICE '✅ WebsiteAnalysis table created successfully';
  ELSE
    RAISE EXCEPTION '❌ WebsiteAnalysis table creation failed';
  END IF;
END $$;
