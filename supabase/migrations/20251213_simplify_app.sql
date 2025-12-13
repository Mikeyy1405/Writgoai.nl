-- ============================================
-- WRITGO APP SIMPLIFICATION MIGRATION
-- ============================================
-- This migration removes complex features and simplifies the app
-- to focus on multi-project content management

-- ============================================
-- STEP 1: DROP COMPLEX TABLES
-- ============================================

DROP TABLE IF EXISTS "TopicalMapArticle" CASCADE;
DROP TABLE IF EXISTS "TopicalAuthorityMap" CASCADE;
DROP TABLE IF EXISTS "ContentPlanItem" CASCADE;
DROP TABLE IF EXISTS "ContentPlan" CASCADE;
DROP TABLE IF EXISTS "WebsiteAnalysis" CASCADE;
DROP TABLE IF EXISTS "AutopilotConfig" CASCADE;
DROP TABLE IF EXISTS "AutopilotLog" CASCADE;
DROP TABLE IF EXISTS "BatchJob" CASCADE;
DROP TABLE IF EXISTS "SocialMediaStrategy" CASCADE;

-- ============================================
-- STEP 2: SIMPLIFY PROJECT TABLE
-- ============================================

-- Remove complex columns from Project table
ALTER TABLE "Project" DROP COLUMN IF EXISTS description CASCADE;
ALTER TABLE "Project" DROP COLUMN IF EXISTS status CASCADE;
ALTER TABLE "Project" DROP COLUMN IF EXISTS "websiteUrl" CASCADE;
ALTER TABLE "Project" DROP COLUMN IF EXISTS "contentAnalysis" CASCADE;
ALTER TABLE "Project" DROP COLUMN IF EXISTS "contentStrategy" CASCADE;
ALTER TABLE "Project" DROP COLUMN IF EXISTS "keywordResearch" CASCADE;
ALTER TABLE "Project" DROP COLUMN IF EXISTS "contentPillars" CASCADE;
ALTER TABLE "Project" DROP COLUMN IF EXISTS "customInstructions" CASCADE;
ALTER TABLE "Project" DROP COLUMN IF EXISTS "personalInfo" CASCADE;
ALTER TABLE "Project" DROP COLUMN IF EXISTS "preferredProducts" CASCADE;
ALTER TABLE "Project" DROP COLUMN IF EXISTS "importantPages" CASCADE;
ALTER TABLE "Project" DROP COLUMN IF EXISTS "linkingGuidelines" CASCADE;
ALTER TABLE "Project" DROP COLUMN IF EXISTS "wordpressCategory" CASCADE;
ALTER TABLE "Project" DROP COLUMN IF EXISTS "wordpressAutoPublish" CASCADE;
ALTER TABLE "Project" DROP COLUMN IF EXISTS "isPrimary" CASCADE;
ALTER TABLE "Project" DROP COLUMN IF EXISTS settings CASCADE;

-- Add new simplified columns to Project table
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "getlateProfileId" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "getlateAccessToken" TEXT;

-- Rename websiteUrl column if it doesn't exist (it was dropped above)
-- Add new column for site URL
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "siteUrl" TEXT;

-- ============================================
-- STEP 3: SIMPLIFY BLOGPOST TABLE
-- ============================================

-- Remove seoScore as it's not needed
ALTER TABLE "BlogPost" DROP COLUMN IF EXISTS "seoScore" CASCADE;

-- Add new columns for better workflow
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "wordpressStatus" TEXT DEFAULT 'not_published';

-- ============================================
-- STEP 4: SIMPLIFY SOCIALMEDIAPOST TABLE
-- ============================================

-- Create simplified SocialMediaPost table if it doesn't exist
CREATE TABLE IF NOT EXISTS "SocialMediaPost" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  "projectId" TEXT REFERENCES "Project"(id) ON DELETE CASCADE,
  
  -- Content
  content TEXT NOT NULL,
  "imageUrl" TEXT,
  "videoUrl" TEXT,
  
  -- Platforms (can post to multiple)
  platforms TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Status & Publishing
  status TEXT DEFAULT 'draft',
  "scheduledFor" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  
  -- Getlate Integration
  "getlatePostId" TEXT,
  "getlateStatus" TEXT,
  
  -- Timestamps
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- STEP 5: UPDATE INDEXES
-- ============================================

-- Drop old indexes that are no longer needed
DROP INDEX IF EXISTS idx_project_status;
DROP INDEX IF EXISTS idx_project_is_primary;

-- Add new indexes for simplified structure
CREATE INDEX IF NOT EXISTS idx_project_client_active ON "Project"("clientId", "isActive");
CREATE INDEX IF NOT EXISTS idx_blogpost_project_status ON "BlogPost"("projectId", status);
CREATE INDEX IF NOT EXISTS idx_socialmediapost_project_id ON "SocialMediaPost"("projectId");
CREATE INDEX IF NOT EXISTS idx_socialmediapost_status ON "SocialMediaPost"(status);
CREATE INDEX IF NOT EXISTS idx_socialmediapost_scheduled ON "SocialMediaPost"("scheduledFor");

-- ============================================
-- STEP 6: ADD TRIGGERS FOR UPDATED_AT
-- ============================================

-- Add trigger for SocialMediaPost
DROP TRIGGER IF EXISTS update_socialmediapost_updated_at ON "SocialMediaPost";
CREATE TRIGGER update_socialmediapost_updated_at
  BEFORE UPDATE ON "SocialMediaPost"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 7: UPDATE RLS POLICIES
-- ============================================

-- Enable RLS on SocialMediaPost
ALTER TABLE "SocialMediaPost" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own social posts" ON "SocialMediaPost";
DROP POLICY IF EXISTS "Users can create their own social posts" ON "SocialMediaPost";
DROP POLICY IF EXISTS "Users can update their own social posts" ON "SocialMediaPost";
DROP POLICY IF EXISTS "Users can delete their own social posts" ON "SocialMediaPost";

-- Create new policies for SocialMediaPost
CREATE POLICY "Users can view their own social posts" ON "SocialMediaPost"
  FOR SELECT
  USING (
    "clientId" IN (
      SELECT id FROM "Client"
      WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can create their own social posts" ON "SocialMediaPost"
  FOR INSERT
  WITH CHECK (
    "clientId" IN (
      SELECT id FROM "Client"
      WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can update their own social posts" ON "SocialMediaPost"
  FOR UPDATE
  USING (
    "clientId" IN (
      SELECT id FROM "Client"
      WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can delete their own social posts" ON "SocialMediaPost"
  FOR DELETE
  USING (
    "clientId" IN (
      SELECT id FROM "Client"
      WHERE email = auth.jwt() ->> 'email'
    )
  );

-- ============================================
-- STEP 8: UPDATE PRISMA SHIM TABLE MAP
-- ============================================

-- This is a note for the developer:
-- Update lib/prisma-shim.ts to remove these table mappings:
-- - contentPlan
-- - contentPlanItem
-- - topicalAuthorityMap
-- - topicalMapArticle
-- - batchJob
-- - socialMediaStrategy
-- - autopilotConfig
-- - autopilotLog
-- - websiteAnalysis

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify the migration succeeded:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%Topical%';
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%Content%';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'Project';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'BlogPost';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'SocialMediaPost';

