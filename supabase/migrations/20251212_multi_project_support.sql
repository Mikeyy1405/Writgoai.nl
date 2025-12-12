-- Multi-Project Support Enhancement Migration
-- Ensures Project table has all necessary fields for multi-project management

-- Add missing columns to Project table if they don't exist
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active';
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "settings" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Ensure all content tables have projectId column with proper foreign keys
-- These may already exist, so we use IF NOT EXISTS

-- BlogPost
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='BlogPost' AND column_name='projectId') THEN
    ALTER TABLE "BlogPost" ADD COLUMN "projectId" TEXT;
  END IF;
END $$;

ALTER TABLE "BlogPost" DROP CONSTRAINT IF EXISTS "BlogPost_projectId_fkey";
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_projectId_fkey" 
  FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE;

-- ContentPlan
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='ContentPlan' AND column_name='projectId') THEN
    ALTER TABLE "ContentPlan" ADD COLUMN "projectId" TEXT;
  END IF;
END $$;

ALTER TABLE "ContentPlan" DROP CONSTRAINT IF EXISTS "ContentPlan_projectId_fkey";
ALTER TABLE "ContentPlan" ADD CONSTRAINT "ContentPlan_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE;

-- TopicalAuthorityMap
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='TopicalAuthorityMap' AND column_name='projectId') THEN
    ALTER TABLE "TopicalAuthorityMap" ADD COLUMN "projectId" TEXT;
  END IF;
END $$;

ALTER TABLE "TopicalAuthorityMap" DROP CONSTRAINT IF EXISTS "TopicalAuthorityMap_projectId_fkey";
ALTER TABLE "TopicalAuthorityMap" ADD CONSTRAINT "TopicalAuthorityMap_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE;

-- SocialMediaStrategy
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='SocialMediaStrategy' AND column_name='projectId') THEN
    ALTER TABLE "SocialMediaStrategy" ADD COLUMN "projectId" TEXT;
  END IF;
END $$;

ALTER TABLE "SocialMediaStrategy" DROP CONSTRAINT IF EXISTS "SocialMediaStrategy_projectId_fkey";
ALTER TABLE "SocialMediaStrategy" ADD CONSTRAINT "SocialMediaStrategy_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE;

-- WebsiteAnalysis
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='WebsiteAnalysis' AND column_name='projectId') THEN
    ALTER TABLE "WebsiteAnalysis" ADD COLUMN "projectId" TEXT;
  END IF;
END $$;

ALTER TABLE "WebsiteAnalysis" DROP CONSTRAINT IF EXISTS "WebsiteAnalysis_projectId_fkey";
ALTER TABLE "WebsiteAnalysis" ADD CONSTRAINT "WebsiteAnalysis_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE;

-- AutopilotConfig
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='AutopilotConfig' AND column_name='projectId') THEN
    ALTER TABLE "AutopilotConfig" ADD COLUMN "projectId" TEXT;
  END IF;
END $$;

ALTER TABLE "AutopilotConfig" DROP CONSTRAINT IF EXISTS "AutopilotConfig_projectId_fkey";
ALTER TABLE "AutopilotConfig" ADD CONSTRAINT "AutopilotConfig_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "BlogPost_projectId_idx" ON "BlogPost"("projectId");
CREATE INDEX IF NOT EXISTS "ContentPlan_projectId_idx" ON "ContentPlan"("projectId");
CREATE INDEX IF NOT EXISTS "TopicalAuthorityMap_projectId_idx" ON "TopicalAuthorityMap"("projectId");
CREATE INDEX IF NOT EXISTS "SocialMediaStrategy_projectId_idx" ON "SocialMediaStrategy"("projectId");
CREATE INDEX IF NOT EXISTS "WebsiteAnalysis_projectId_idx" ON "WebsiteAnalysis"("projectId");
CREATE INDEX IF NOT EXISTS "AutopilotConfig_projectId_idx" ON "AutopilotConfig"("projectId");
CREATE INDEX IF NOT EXISTS "Project_clientId_idx" ON "Project"("clientId");
CREATE INDEX IF NOT EXISTS "Project_status_idx" ON "Project"("status");

-- Create or replace trigger for updated_at on Project table
CREATE OR REPLACE FUNCTION update_project_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_project_updated_at ON "Project";
CREATE TRIGGER trigger_update_project_updated_at
  BEFORE UPDATE ON "Project"
  FOR EACH ROW
  EXECUTE FUNCTION update_project_updated_at();

-- Update RLS policies for content tables to respect project ownership
-- Clients can only see content from their own projects

-- BlogPost RLS
DROP POLICY IF EXISTS "Clients can view blog posts from their projects" ON "BlogPost";
CREATE POLICY "Clients can view blog posts from their projects"
  ON "BlogPost"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Project" 
      WHERE "Project".id = "BlogPost"."projectId" 
      AND "Project"."clientId" = auth.uid()::text
    )
  );

-- ContentPlan RLS
DROP POLICY IF EXISTS "Clients can view plans from their projects" ON "ContentPlan";
CREATE POLICY "Clients can view plans from their projects"
  ON "ContentPlan"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Project" 
      WHERE "Project".id = "ContentPlan"."projectId" 
      AND "Project"."clientId" = auth.uid()::text
    )
  );

-- TopicalAuthorityMap RLS
DROP POLICY IF EXISTS "Clients can view maps from their projects" ON "TopicalAuthorityMap";
CREATE POLICY "Clients can view maps from their projects"
  ON "TopicalAuthorityMap"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Project" 
      WHERE "Project".id = "TopicalAuthorityMap"."projectId" 
      AND "Project"."clientId" = auth.uid()::text
    )
  );

-- SocialMediaStrategy RLS
DROP POLICY IF EXISTS "Clients can view strategies from their projects" ON "SocialMediaStrategy";
CREATE POLICY "Clients can view strategies from their projects"
  ON "SocialMediaStrategy"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Project" 
      WHERE "Project".id = "SocialMediaStrategy"."projectId" 
      AND "Project"."clientId" = auth.uid()::text
    )
  );

-- WebsiteAnalysis RLS
DROP POLICY IF EXISTS "Clients can view analysis from their projects" ON "WebsiteAnalysis";
CREATE POLICY "Clients can view analysis from their projects"
  ON "WebsiteAnalysis"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Project" 
      WHERE "Project".id = "WebsiteAnalysis"."projectId" 
      AND "Project"."clientId" = auth.uid()::text
    )
  );

-- Comments
COMMENT ON COLUMN "Project"."status" IS 'Project status: active, inactive, archived';
COMMENT ON COLUMN "Project"."settings" IS 'Project-specific settings stored as JSON';
COMMENT ON TABLE "Project" IS 'Projects for multi-website management per client';
