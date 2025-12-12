-- ============================================
-- COMPLETE WRITGO.NL DATABASE MIGRATION
-- ============================================
-- Dit script bevat ALLE migraties in de juiste volgorde
-- Voer dit uit in Supabase SQL Editor
--
-- BELANGRIJK: Dit script kan meerdere keren worden uitgevoerd
-- zonder errors door gebruik van IF NOT EXISTS checks
--
-- Auteur: WritgoAI Team
-- Datum: 12 December 2024
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Language enum if not exists
DO $$ BEGIN
  CREATE TYPE "Language" AS ENUM (
    'NL', 'EN', 'DE', 'ES', 'FR', 'IT', 'PT', 'PL', 'SV', 'DA'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- STAP 1: CLEANUP (indien nodig)
-- ============================================
-- Uncomment deze regels ALLEEN als je een mislukte migratie wilt cleanupen:
-- DROP TABLE IF EXISTS "BatchJob" CASCADE;
-- DROP TABLE IF EXISTS "TopicalMapArticle" CASCADE;
-- DROP TABLE IF EXISTS "TopicalAuthorityMap" CASCADE;
-- DROP TABLE IF EXISTS "ContentPlanItem" CASCADE;
-- DROP TABLE IF EXISTS "ContentPlan" CASCADE;

-- ============================================
-- STAP 2: MAAK BLOGPOST TABEL (indien niet bestaat)
-- ============================================
-- Deze tabel is vereist voor de foreign keys in ContentPlan en TopicalAuthorityMap

CREATE TABLE IF NOT EXISTS "BlogPost" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "title" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "excerpt" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "featuredImage" TEXT,
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "focusKeyword" TEXT,
  "category" TEXT NOT NULL DEFAULT 'AI & Content Marketing',
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" TEXT NOT NULL DEFAULT 'draft',
  "publishedAt" TIMESTAMP(3),
  "scheduledFor" TIMESTAMP(3),
  "authorId" TEXT,
  "authorName" TEXT NOT NULL DEFAULT 'WritgoAI Team',
  "views" INTEGER NOT NULL DEFAULT 0,
  "readingTimeMinutes" INTEGER NOT NULL DEFAULT 5,
  "language" "Language" NOT NULL DEFAULT 'NL',
  "internalLinks" INTEGER NOT NULL DEFAULT 0,
  "externalLinks" INTEGER NOT NULL DEFAULT 0,
  "wordCount" INTEGER NOT NULL DEFAULT 0,
  "lastAnalyzed" TIMESTAMP(3),
  "searchConsoleData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- BlogPost indexes
CREATE INDEX IF NOT EXISTS "BlogPost_slug_idx" ON "BlogPost"("slug");
CREATE INDEX IF NOT EXISTS "BlogPost_status_idx" ON "BlogPost"("status");
CREATE INDEX IF NOT EXISTS "BlogPost_category_idx" ON "BlogPost"("category");
CREATE INDEX IF NOT EXISTS "BlogPost_publishedAt_idx" ON "BlogPost"("publishedAt");
CREATE INDEX IF NOT EXISTS "BlogPost_createdAt_idx" ON "BlogPost"("createdAt");

-- ============================================
-- STAP 3: MAAK CONTENT PLAN TABELLEN
-- ============================================

-- Create ContentPlan table
CREATE TABLE IF NOT EXISTS "ContentPlan" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "niche" TEXT NOT NULL,
  "targetAudience" TEXT NOT NULL,
  "language" TEXT NOT NULL DEFAULT 'nl',
  "tone" TEXT NOT NULL DEFAULT 'professioneel',
  "totalPosts" INTEGER NOT NULL,
  "period" TEXT NOT NULL, -- '1 week', '1 maand', etc.
  "keywords" TEXT[], -- Array of keywords
  "status" TEXT NOT NULL DEFAULT 'draft', -- draft, in_progress, completed
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "ContentPlan_clientId_fkey" FOREIGN KEY ("clientId") 
    REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create ContentPlanItem table
CREATE TABLE IF NOT EXISTS "ContentPlanItem" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "planId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "scheduledDate" TIMESTAMPTZ,
  "keywords" TEXT[], -- Array of keywords for this blog
  "contentType" TEXT NOT NULL DEFAULT 'Guide', -- How-to, Listicle, Guide, Case Study, etc.
  "estimatedWords" INTEGER DEFAULT 1000,
  "status" TEXT NOT NULL DEFAULT 'pending', -- pending, generating, generated, published, failed
  "blogPostId" TEXT, -- Link to generated BlogPost (TEXT because BlogPost.id is TEXT)
  "order" INTEGER NOT NULL DEFAULT 0, -- Order in the plan
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "ContentPlanItem_planId_fkey" FOREIGN KEY ("planId") 
    REFERENCES "ContentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ContentPlanItem_blogPostId_fkey" FOREIGN KEY ("blogPostId") 
    REFERENCES "BlogPost"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ContentPlan indexes
CREATE INDEX IF NOT EXISTS "ContentPlan_clientId_idx" ON "ContentPlan"("clientId");
CREATE INDEX IF NOT EXISTS "ContentPlan_status_idx" ON "ContentPlan"("status");
CREATE INDEX IF NOT EXISTS "ContentPlan_createdAt_idx" ON "ContentPlan"("createdAt" DESC);

CREATE INDEX IF NOT EXISTS "ContentPlanItem_planId_idx" ON "ContentPlanItem"("planId");
CREATE INDEX IF NOT EXISTS "ContentPlanItem_status_idx" ON "ContentPlanItem"("status");
CREATE INDEX IF NOT EXISTS "ContentPlanItem_scheduledDate_idx" ON "ContentPlanItem"("scheduledDate");
CREATE INDEX IF NOT EXISTS "ContentPlanItem_blogPostId_idx" ON "ContentPlanItem"("blogPostId");

-- ============================================
-- STAP 4: MAAK TOPICAL AUTHORITY MAP TABELLEN
-- ============================================

-- Create TopicalAuthorityMap table
CREATE TABLE IF NOT EXISTS "TopicalAuthorityMap" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "niche" TEXT NOT NULL,
  "targetAudience" TEXT NOT NULL,
  "language" TEXT NOT NULL DEFAULT 'nl',
  "tone" TEXT NOT NULL DEFAULT 'professioneel',
  "keywords" TEXT[], -- Array of main keywords
  
  -- Article configuration
  "totalArticles" INTEGER NOT NULL, -- 100-500
  "pillarCount" INTEGER NOT NULL DEFAULT 0, -- Number of pillar pages
  "clusterCount" INTEGER NOT NULL DEFAULT 0, -- Number of cluster articles
  "pillarClusterRatio" TEXT DEFAULT '1:10', -- e.g., "1:10" means 1 pillar per 10 clusters
  
  -- Status tracking
  "status" TEXT NOT NULL DEFAULT 'planning', -- planning, generating, completed, failed, paused
  "generationProgress" INTEGER NOT NULL DEFAULT 0, -- 0-100%
  "articlesGenerated" INTEGER NOT NULL DEFAULT 0,
  "articlesFailed" INTEGER NOT NULL DEFAULT 0,
  
  -- Batch job tracking
  "currentBatchId" TEXT, -- ID of currently running batch
  
  -- Metadata
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "completedAt" TIMESTAMPTZ,
  
  CONSTRAINT "TopicalAuthorityMap_clientId_fkey" FOREIGN KEY ("clientId") 
    REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create TopicalMapArticle table
CREATE TABLE IF NOT EXISTS "TopicalMapArticle" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "mapId" TEXT NOT NULL,
  
  -- Article info
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "type" TEXT NOT NULL, -- 'pillar' or 'cluster'
  "parentId" TEXT, -- For cluster articles, links to parent pillar
  
  -- SEO & Keywords
  "primaryKeyword" TEXT NOT NULL,
  "secondaryKeywords" TEXT[], -- Array of 5-10 keywords
  "contentType" TEXT NOT NULL DEFAULT 'Guide', -- How-to, Guide, Listicle, etc.
  "wordCount" INTEGER NOT NULL DEFAULT 1500,
  "difficultyLevel" TEXT DEFAULT 'intermediate', -- beginner, intermediate, advanced
  
  -- Internal linking
  "internalLinks" TEXT[], -- Array of article IDs to link to
  
  -- Status & Progress
  "status" TEXT NOT NULL DEFAULT 'pending', -- pending, generating, generated, published, failed
  "blogPostId" TEXT, -- Link to generated BlogPost
  "scheduledDate" TIMESTAMPTZ,
  "priority" INTEGER DEFAULT 0, -- Higher priority = generate first
  "order" INTEGER NOT NULL DEFAULT 0,
  
  -- Error tracking
  "errorMessage" TEXT,
  "retryCount" INTEGER DEFAULT 0,
  
  -- Metadata
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "generatedAt" TIMESTAMPTZ,
  
  CONSTRAINT "TopicalMapArticle_mapId_fkey" FOREIGN KEY ("mapId") 
    REFERENCES "TopicalAuthorityMap"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TopicalMapArticle_parentId_fkey" FOREIGN KEY ("parentId") 
    REFERENCES "TopicalMapArticle"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "TopicalMapArticle_blogPostId_fkey" FOREIGN KEY ("blogPostId") 
    REFERENCES "BlogPost"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create BatchJob table
CREATE TABLE IF NOT EXISTS "BatchJob" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "mapId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'article_generation', -- article_generation, map_planning
  
  -- Job status
  "status" TEXT NOT NULL DEFAULT 'queued', -- queued, processing, completed, failed, paused
  "totalItems" INTEGER NOT NULL DEFAULT 0,
  "completedItems" INTEGER NOT NULL DEFAULT 0,
  "failedItems" INTEGER NOT NULL DEFAULT 0,
  "progressPercentage" INTEGER NOT NULL DEFAULT 0, -- 0-100
  
  -- Timing
  "etaMinutes" INTEGER, -- Estimated time remaining in minutes
  "startedAt" TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ,
  "pausedAt" TIMESTAMPTZ,
  
  -- Error tracking
  "errorLog" JSONB DEFAULT '[]'::JSONB, -- Array of error objects
  
  -- Batch configuration
  "batchSize" INTEGER DEFAULT 20, -- Number of items to process in parallel
  "currentBatch" INTEGER DEFAULT 0, -- Which batch is currently processing
  "totalBatches" INTEGER DEFAULT 0,
  
  -- Metadata
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "BatchJob_mapId_fkey" FOREIGN KEY ("mapId") 
    REFERENCES "TopicalAuthorityMap"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- TopicalAuthorityMap indexes
CREATE INDEX IF NOT EXISTS "TopicalAuthorityMap_clientId_idx" ON "TopicalAuthorityMap"("clientId");
CREATE INDEX IF NOT EXISTS "TopicalAuthorityMap_status_idx" ON "TopicalAuthorityMap"("status");
CREATE INDEX IF NOT EXISTS "TopicalAuthorityMap_createdAt_idx" ON "TopicalAuthorityMap"("createdAt" DESC);

-- TopicalMapArticle indexes
CREATE INDEX IF NOT EXISTS "TopicalMapArticle_mapId_idx" ON "TopicalMapArticle"("mapId");
CREATE INDEX IF NOT EXISTS "TopicalMapArticle_parentId_idx" ON "TopicalMapArticle"("parentId");
CREATE INDEX IF NOT EXISTS "TopicalMapArticle_status_idx" ON "TopicalMapArticle"("status");
CREATE INDEX IF NOT EXISTS "TopicalMapArticle_type_idx" ON "TopicalMapArticle"("type");
CREATE INDEX IF NOT EXISTS "TopicalMapArticle_priority_idx" ON "TopicalMapArticle"("priority" DESC);
CREATE INDEX IF NOT EXISTS "TopicalMapArticle_blogPostId_idx" ON "TopicalMapArticle"("blogPostId");
CREATE INDEX IF NOT EXISTS "TopicalMapArticle_scheduledDate_idx" ON "TopicalMapArticle"("scheduledDate");

-- BatchJob indexes
CREATE INDEX IF NOT EXISTS "BatchJob_mapId_idx" ON "BatchJob"("mapId");
CREATE INDEX IF NOT EXISTS "BatchJob_status_idx" ON "BatchJob"("status");
CREATE INDEX IF NOT EXISTS "BatchJob_createdAt_idx" ON "BatchJob"("createdAt" DESC);

-- ============================================
-- STAP 5: MAAK/UPDATE TRIGGERS
-- ============================================

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist (to avoid conflicts)
DROP TRIGGER IF EXISTS update_blogpost_updated_at ON "BlogPost";
DROP TRIGGER IF EXISTS update_content_plan_updated_at ON "ContentPlan";
DROP TRIGGER IF EXISTS update_content_plan_item_updated_at ON "ContentPlanItem";
DROP TRIGGER IF EXISTS update_topical_authority_map_updated_at ON "TopicalAuthorityMap";
DROP TRIGGER IF EXISTS update_topical_map_article_updated_at ON "TopicalMapArticle";
DROP TRIGGER IF EXISTS update_batch_job_updated_at ON "BatchJob";

-- Add triggers for automatic updatedAt updates
CREATE TRIGGER update_blogpost_updated_at BEFORE UPDATE ON "BlogPost"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_plan_updated_at BEFORE UPDATE ON "ContentPlan"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_plan_item_updated_at BEFORE UPDATE ON "ContentPlanItem"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topical_authority_map_updated_at BEFORE UPDATE ON "TopicalAuthorityMap"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topical_map_article_updated_at BEFORE UPDATE ON "TopicalMapArticle"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batch_job_updated_at BEFORE UPDATE ON "BatchJob"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STAP 6: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentPlanItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TopicalAuthorityMap" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TopicalMapArticle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BatchJob" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "BlogPost admin access" ON "BlogPost";
DROP POLICY IF EXISTS "ContentPlan admin access" ON "ContentPlan";
DROP POLICY IF EXISTS "ContentPlanItem admin access" ON "ContentPlanItem";
DROP POLICY IF EXISTS "TopicalAuthorityMap admin access" ON "TopicalAuthorityMap";
DROP POLICY IF EXISTS "TopicalMapArticle admin access" ON "TopicalMapArticle";
DROP POLICY IF EXISTS "BatchJob admin access" ON "BatchJob";

-- Create policies for admin access (allow all operations)
CREATE POLICY "BlogPost admin access" ON "BlogPost"
  FOR ALL USING (true);

CREATE POLICY "ContentPlan admin access" ON "ContentPlan"
  FOR ALL USING (true);

CREATE POLICY "ContentPlanItem admin access" ON "ContentPlanItem"
  FOR ALL USING (true);

CREATE POLICY "TopicalAuthorityMap admin access" ON "TopicalAuthorityMap"
  FOR ALL USING (true);

CREATE POLICY "TopicalMapArticle admin access" ON "TopicalMapArticle"
  FOR ALL USING (true);

CREATE POLICY "BatchJob admin access" ON "BatchJob"
  FOR ALL USING (true);

-- ============================================
-- STAP 7: TABLE COMMENTS (documentatie)
-- ============================================

COMMENT ON TABLE "BlogPost" IS 'Public blog posts for WritgoAI website';
COMMENT ON TABLE "ContentPlan" IS 'Stores AI-generated content plans for blog scheduling';
COMMENT ON TABLE "ContentPlanItem" IS 'Individual blog posts within a content plan';
COMMENT ON TABLE "TopicalAuthorityMap" IS 'Stores topical authority maps with 100-500 articles in pillar/cluster structure';
COMMENT ON TABLE "TopicalMapArticle" IS 'Individual articles within a topical authority map (pillar or cluster)';
COMMENT ON TABLE "BatchJob" IS 'Tracks batch processing jobs for large-scale content generation';

-- ============================================
-- VERIFICATIE
-- ============================================

SELECT '✅ Migration completed successfully!' as status,
       'All tables created with proper foreign keys' as message;

-- Show created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'BlogPost',
    'ContentPlan',
    'ContentPlanItem',
    'TopicalAuthorityMap',
    'TopicalMapArticle',
    'BatchJob'
  )
ORDER BY table_name;
