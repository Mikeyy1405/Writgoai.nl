-- Topical Authority System - Fixed Migration
-- Migration: 20241217120000_topical_authority_fixed
-- This migration fixes the Topical Authority system by:
-- 1. Dropping all old tables and structures (if they exist)
-- 2. Creating all tables with the correct structure

-- ============================================================================
-- STEP 1: DROP ALL EXISTING STRUCTURES
-- ============================================================================
-- Drop in reverse order of dependencies to avoid foreign key errors

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_planned_article_counts ON "PlannedArticle";
DROP TRIGGER IF EXISTS trigger_topical_map_updated_at ON "TopicalAuthorityMap";

-- Drop functions
DROP FUNCTION IF EXISTS update_topical_map_counts();
DROP FUNCTION IF EXISTS update_topical_map_updated_at();

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS "DataForSEOCache" CASCADE;
DROP TABLE IF EXISTS "WordPressSitemapCache" CASCADE;
DROP TABLE IF EXISTS "PlannedArticle" CASCADE;
DROP TABLE IF EXISTS "Subtopic" CASCADE;
DROP TABLE IF EXISTS "PillarTopic" CASCADE;
DROP TABLE IF EXISTS "TopicalAuthorityMap" CASCADE;

-- ============================================================================
-- STEP 2: CREATE ALL TABLES WITH CORRECT STRUCTURE
-- ============================================================================

-- ============================================================================
-- TOPICAL AUTHORITY MAP
-- ============================================================================
-- Main table for managing topical authority maps per project
-- Each map represents a complete content strategy with 400-500 articles
CREATE TABLE "TopicalAuthorityMap" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "niche" TEXT NOT NULL,
  "description" TEXT,
  "totalArticlesTarget" INTEGER NOT NULL DEFAULT 400,
  "totalArticlesPlanned" INTEGER NOT NULL DEFAULT 0,
  "totalArticlesGenerated" INTEGER NOT NULL DEFAULT 0,
  "totalArticlesPublished" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'draft', -- draft, active, completed
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "fk_topical_map_project" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_topical_map_client" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE
);

-- ============================================================================
-- PILLAR TOPICS
-- ============================================================================
-- Core topics that form the foundation of topical authority
-- Typically 5-10 pillar topics per map
CREATE TABLE "PillarTopic" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "mapId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "searchVolume" INTEGER DEFAULT 0,
  "difficulty" INTEGER DEFAULT 50,
  "priority" INTEGER NOT NULL DEFAULT 5, -- 1-10 scale
  "order" INTEGER NOT NULL, -- Display order
  "status" TEXT NOT NULL DEFAULT 'planned', -- planned, in_progress, completed
  "pillarArticleId" TEXT, -- Reference to the main pillar article in PlannedArticle
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "fk_pillar_map" FOREIGN KEY ("mapId") REFERENCES "TopicalAuthorityMap"("id") ON DELETE CASCADE,
  CONSTRAINT "unique_pillar_slug" UNIQUE ("mapId", "slug")
);

-- ============================================================================
-- SUBTOPICS
-- ============================================================================
-- Subtopics that support each pillar topic
-- Typically 40-50 subtopics per pillar
CREATE TABLE "Subtopic" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "pillarId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "searchVolume" INTEGER DEFAULT 0,
  "difficulty" INTEGER DEFAULT 50,
  "priority" INTEGER NOT NULL DEFAULT 5, -- 1-10 scale
  "order" INTEGER NOT NULL, -- Display order within pillar
  "status" TEXT NOT NULL DEFAULT 'planned', -- planned, in_progress, completed
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "fk_subtopic_pillar" FOREIGN KEY ("pillarId") REFERENCES "PillarTopic"("id") ON DELETE CASCADE,
  CONSTRAINT "unique_subtopic_slug" UNIQUE ("pillarId", "slug")
);

-- ============================================================================
-- PLANNED ARTICLES
-- ============================================================================
-- Individual articles planned within each subtopic
-- Typically 8-10 articles per subtopic
CREATE TABLE "PlannedArticle" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "subtopicId" TEXT, -- NULL for pillar articles
  "pillarId" TEXT, -- Direct reference to pillar (for pillar articles)
  "mapId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "focusKeyword" TEXT,
  "contentType" TEXT NOT NULL DEFAULT 'cluster', -- pillar, cluster, supporting
  "articleType" TEXT NOT NULL DEFAULT 'blog-post', -- blog-post, how-to, guide, listicle, review, comparison
  "priority" INTEGER NOT NULL DEFAULT 5, -- 1-10 scale
  "wordCountTarget" INTEGER NOT NULL DEFAULT 1500,
  "searchIntent" TEXT DEFAULT 'informational', -- informational, commercial, navigational, transactional
  "status" TEXT NOT NULL DEFAULT 'planned', -- planned, generating, generated, published
  "order" INTEGER NOT NULL, -- Display order within subtopic
  
  -- Scheduling
  "scheduledDate" TIMESTAMP,
  "generatedAt" TIMESTAMP,
  "publishedAt" TIMESTAMP,
  
  -- DataForSEO Integration
  "dataForSEO" JSONB DEFAULT '{}'::jsonb, -- Keyword metrics from DataForSEO
  
  -- Internal Links
  "internalLinks" JSONB DEFAULT '[]'::jsonb, -- Suggested internal links with anchor texts
  
  -- Content Reference
  "savedContentId" TEXT, -- Reference to SavedContent after generation
  "publishedUrl" TEXT,
  "wordpressPostId" INTEGER,
  
  -- Metadata
  "metadata" JSONB DEFAULT '{}'::jsonb, -- Additional metadata
  "error" TEXT,
  
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  
  CONSTRAINT "fk_planned_article_subtopic" FOREIGN KEY ("subtopicId") REFERENCES "Subtopic"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_planned_article_pillar" FOREIGN KEY ("pillarId") REFERENCES "PillarTopic"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_planned_article_map" FOREIGN KEY ("mapId") REFERENCES "TopicalAuthorityMap"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_planned_article_content" FOREIGN KEY ("savedContentId") REFERENCES "SavedContent"("id") ON DELETE SET NULL,
  CONSTRAINT "unique_planned_article_slug" UNIQUE ("mapId", "slug")
);

-- ============================================================================
-- WORDPRESS SITEMAP CACHE
-- ============================================================================
-- Cache of WordPress sitemap data for internal link suggestions
CREATE TABLE "WordPressSitemapCache" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "publishedDate" TIMESTAMP,
  "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "lastScanned" TIMESTAMP NOT NULL DEFAULT now(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "fk_sitemap_project" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE,
  CONSTRAINT "unique_sitemap_url" UNIQUE ("projectId", "url")
);

-- ============================================================================
-- DATAFORSEO API CACHE
-- ============================================================================
-- Cache DataForSEO API results to reduce API calls and costs
CREATE TABLE "DataForSEOCache" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "keyword" TEXT NOT NULL,
  "location" TEXT NOT NULL DEFAULT 'Netherlands',
  "language" TEXT NOT NULL DEFAULT 'nl',
  "data" JSONB NOT NULL, -- Full API response
  "searchVolume" INTEGER,
  "difficulty" INTEGER,
  "cpc" DECIMAL(10, 2),
  "competition" DECIMAL(3, 2),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "expiresAt" TIMESTAMP NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  CONSTRAINT "unique_dataforseo_keyword" UNIQUE ("keyword", "location", "language")
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- TopicalAuthorityMap indexes
CREATE INDEX "idx_topical_map_project" ON "TopicalAuthorityMap"("projectId");
CREATE INDEX "idx_topical_map_client" ON "TopicalAuthorityMap"("clientId");
CREATE INDEX "idx_topical_map_status" ON "TopicalAuthorityMap"("status");

-- PillarTopic indexes
CREATE INDEX "idx_pillar_map" ON "PillarTopic"("mapId");
CREATE INDEX "idx_pillar_status" ON "PillarTopic"("status");
CREATE INDEX "idx_pillar_order" ON "PillarTopic"("mapId", "order");

-- Subtopic indexes
CREATE INDEX "idx_subtopic_pillar" ON "Subtopic"("pillarId");
CREATE INDEX "idx_subtopic_status" ON "Subtopic"("status");
CREATE INDEX "idx_subtopic_order" ON "Subtopic"("pillarId", "order");

-- PlannedArticle indexes
CREATE INDEX "idx_planned_article_subtopic" ON "PlannedArticle"("subtopicId");
CREATE INDEX "idx_planned_article_pillar" ON "PlannedArticle"("pillarId");
CREATE INDEX "idx_planned_article_map" ON "PlannedArticle"("mapId");
CREATE INDEX "idx_planned_article_status" ON "PlannedArticle"("status");
CREATE INDEX "idx_planned_article_scheduled" ON "PlannedArticle"("scheduledDate");
CREATE INDEX "idx_planned_article_content" ON "PlannedArticle"("savedContentId");
CREATE INDEX "idx_planned_article_order" ON "PlannedArticle"("subtopicId", "order");

-- WordPressSitemapCache indexes
CREATE INDEX "idx_sitemap_project" ON "WordPressSitemapCache"("projectId");
CREATE INDEX "idx_sitemap_topics" ON "WordPressSitemapCache" USING GIN ("topics");
CREATE INDEX "idx_sitemap_keywords" ON "WordPressSitemapCache" USING GIN ("keywords");
CREATE INDEX "idx_sitemap_last_scanned" ON "WordPressSitemapCache"("lastScanned");

-- DataForSEOCache indexes
CREATE INDEX "idx_dataforseo_keyword" ON "DataForSEOCache"("keyword");
CREATE INDEX "idx_dataforseo_expires" ON "DataForSEOCache"("expiresAt");

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update updatedAt timestamp on TopicalAuthorityMap
CREATE OR REPLACE FUNCTION update_topical_map_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_topical_map_updated_at
  BEFORE UPDATE ON "TopicalAuthorityMap"
  FOR EACH ROW
  EXECUTE FUNCTION update_topical_map_updated_at();

-- Update counts on TopicalAuthorityMap when articles change
CREATE OR REPLACE FUNCTION update_topical_map_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "TopicalAuthorityMap"
  SET 
    "totalArticlesPlanned" = (
      SELECT COUNT(*) FROM "PlannedArticle" WHERE "mapId" = COALESCE(NEW."mapId", OLD."mapId")
    ),
    "totalArticlesGenerated" = (
      SELECT COUNT(*) FROM "PlannedArticle" 
      WHERE "mapId" = COALESCE(NEW."mapId", OLD."mapId") AND "status" IN ('generated', 'published')
    ),
    "totalArticlesPublished" = (
      SELECT COUNT(*) FROM "PlannedArticle" 
      WHERE "mapId" = COALESCE(NEW."mapId", OLD."mapId") AND "status" = 'published'
    ),
    "updatedAt" = now()
  WHERE "id" = COALESCE(NEW."mapId", OLD."mapId");
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_planned_article_counts
  AFTER INSERT OR UPDATE OR DELETE ON "PlannedArticle"
  FOR EACH ROW
  EXECUTE FUNCTION update_topical_map_counts();

-- ============================================================================
-- TABLE COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE "TopicalAuthorityMap" IS 'Main topical authority maps with 400-500 articles per project';
COMMENT ON TABLE "PillarTopic" IS 'Core pillar topics (5-10 per map) forming the foundation of topical authority';
COMMENT ON TABLE "Subtopic" IS 'Subtopics (40-50 per pillar) that support each pillar topic';
COMMENT ON TABLE "PlannedArticle" IS 'Individual articles (8-10 per subtopic) with scheduling and SEO metadata';
COMMENT ON TABLE "WordPressSitemapCache" IS 'Cache of WordPress sitemap data for intelligent internal linking';
COMMENT ON TABLE "DataForSEOCache" IS 'Cache of DataForSEO API results to reduce API calls and costs';

COMMENT ON COLUMN "TopicalAuthorityMap"."totalArticlesTarget" IS 'Target number of articles (typically 400-500)';
COMMENT ON COLUMN "PlannedArticle"."contentType" IS 'Type: pillar (3000-5000 words), cluster (1500-2500), supporting (800-1500)';
COMMENT ON COLUMN "PlannedArticle"."dataForSEO" IS 'Cached DataForSEO metrics: {volume, difficulty, cpc, serp_features}';
COMMENT ON COLUMN "PlannedArticle"."internalLinks" IS 'Suggested links: [{url, anchor_text, relevance_score, context}]';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All Topical Authority tables have been recreated with the correct structure
