-- Topical Authority Map Tables Migration
-- Creates tables for Topical Authority Map Generator with Batch Processing
-- Allows generation of 100-500 article maps with pillar/cluster structure

-- ============================================
-- CREATE TOPICAL AUTHORITY MAP TABLE
-- ============================================

CREATE TABLE "TopicalAuthorityMap" (
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

-- ============================================
-- CREATE TOPICAL MAP ARTICLE TABLE
-- ============================================

CREATE TABLE "TopicalMapArticle" (
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

-- ============================================
-- CREATE BATCH JOB TABLE
-- ============================================

CREATE TABLE "BatchJob" (
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

-- ============================================
-- CREATE INDEXES
-- ============================================

-- TopicalAuthorityMap indexes
CREATE INDEX "TopicalAuthorityMap_clientId_idx" ON "TopicalAuthorityMap"("clientId");
CREATE INDEX "TopicalAuthorityMap_status_idx" ON "TopicalAuthorityMap"("status");
CREATE INDEX "TopicalAuthorityMap_createdAt_idx" ON "TopicalAuthorityMap"("createdAt" DESC);

-- TopicalMapArticle indexes
CREATE INDEX "TopicalMapArticle_mapId_idx" ON "TopicalMapArticle"("mapId");
CREATE INDEX "TopicalMapArticle_parentId_idx" ON "TopicalMapArticle"("parentId");
CREATE INDEX "TopicalMapArticle_status_idx" ON "TopicalMapArticle"("status");
CREATE INDEX "TopicalMapArticle_type_idx" ON "TopicalMapArticle"("type");
CREATE INDEX "TopicalMapArticle_priority_idx" ON "TopicalMapArticle"("priority" DESC);
CREATE INDEX "TopicalMapArticle_blogPostId_idx" ON "TopicalMapArticle"("blogPostId");
CREATE INDEX "TopicalMapArticle_scheduledDate_idx" ON "TopicalMapArticle"("scheduledDate");

-- BatchJob indexes
CREATE INDEX "BatchJob_mapId_idx" ON "BatchJob"("mapId");
CREATE INDEX "BatchJob_status_idx" ON "BatchJob"("status");
CREATE INDEX "BatchJob_createdAt_idx" ON "BatchJob"("createdAt" DESC);

-- ============================================
-- CREATE TRIGGERS
-- ============================================

-- Add triggers for automatic updatedAt updates
CREATE TRIGGER update_topical_authority_map_updated_at BEFORE UPDATE ON "TopicalAuthorityMap"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topical_map_article_updated_at BEFORE UPDATE ON "TopicalMapArticle"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batch_job_updated_at BEFORE UPDATE ON "BatchJob"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE "TopicalAuthorityMap" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TopicalMapArticle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BatchJob" ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "TopicalAuthorityMap admin access" ON "TopicalAuthorityMap"
  FOR ALL USING (true);

CREATE POLICY "TopicalMapArticle admin access" ON "TopicalMapArticle"
  FOR ALL USING (true);

CREATE POLICY "BatchJob admin access" ON "BatchJob"
  FOR ALL USING (true);

-- ============================================
-- TABLE COMMENTS
-- ============================================

COMMENT ON TABLE "TopicalAuthorityMap" IS 'Stores topical authority maps with 100-500 articles in pillar/cluster structure';
COMMENT ON TABLE "TopicalMapArticle" IS 'Individual articles within a topical authority map (pillar or cluster)';
COMMENT ON TABLE "BatchJob" IS 'Tracks batch processing jobs for large-scale content generation';

COMMENT ON COLUMN "TopicalAuthorityMap"."status" IS 'planning: map structure created, generating: articles being generated, completed: all done, failed: errors occurred, paused: generation paused';
COMMENT ON COLUMN "TopicalMapArticle"."type" IS 'pillar: main topic page (2000+ words), cluster: supporting article (1000-1500 words)';
COMMENT ON COLUMN "TopicalMapArticle"."status" IS 'pending: not started, generating: AI generating, generated: created, published: live, failed: error';
COMMENT ON COLUMN "BatchJob"."status" IS 'queued: waiting to start, processing: currently running, completed: all done, failed: errors, paused: temporarily stopped';
