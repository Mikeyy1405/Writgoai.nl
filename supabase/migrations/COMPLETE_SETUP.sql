-- ============================================
-- COMPLETE WRITGO.NL DATABASE SETUP
-- ============================================
-- This migration creates ALL required tables in the correct order
-- Run this FIRST if database is empty or missing core tables

-- ============================================
-- 1. USER TABLE (Authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'client',
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. CLIENT TABLE (Main Accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS "Client" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  "companyName" TEXT,
  website TEXT,
  password TEXT NOT NULL,
  
  -- Subscription & Credits
  "subscriptionPlan" TEXT,
  "subscriptionStatus" TEXT,
  "subscriptionCredits" DOUBLE PRECISION DEFAULT 0,
  "topUpCredits" DOUBLE PRECISION DEFAULT 0,
  "isUnlimited" BOOLEAN DEFAULT false,
  
  -- Social Media Platforms
  "facebookAccessToken" TEXT,
  "facebookConnected" BOOLEAN DEFAULT false,
  "facebookPageId" TEXT,
  "facebookPageName" TEXT,
  
  "instagramAccessToken" TEXT,
  "instagramConnected" BOOLEAN DEFAULT false,
  "instagramAccountId" TEXT,
  "instagramUsername" TEXT,
  
  "tiktokAccessToken" TEXT,
  "tiktokConnected" BOOLEAN DEFAULT false,
  "tiktokOpenId" TEXT,
  "tiktokUsername" TEXT,
  
  "youtubeAccessToken" TEXT,
  "youtubeConnected" BOOLEAN DEFAULT false,
  "youtubeChannelId" TEXT,
  "youtubeChannelName" TEXT,
  
  "linkedinPageId" TEXT,
  
  -- Content Settings
  "targetAudience" TEXT,
  "brandVoice" TEXT,
  keywords TEXT[],
  "automationActive" BOOLEAN DEFAULT false,
  "contentPlan" JSONB,
  
  -- WordPress
  "wordpressUrl" TEXT,
  "wordpressUsername" TEXT,
  "wordpressPassword" TEXT,
  
  -- Affiliate & Moneybird
  "affiliateCode" TEXT UNIQUE,
  "moneybirdContactId" TEXT,
  "moneybirdSubscriptionId" TEXT,
  
  -- Onboarding
  "hasCompletedOnboarding" BOOLEAN DEFAULT false,
  
  -- Timestamps
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. PROJECT TABLE (Multi-Website Support)
-- ============================================
CREATE TABLE IF NOT EXISTS "Project" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "websiteUrl" TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  
  -- Content settings
  "targetAudience" TEXT,
  "brandVoice" TEXT,
  niche TEXT,
  keywords TEXT[],
  "contentPillars" TEXT[],
  "writingStyle" TEXT,
  "customInstructions" TEXT,
  "personalInfo" TEXT,
  "preferredProducts" TEXT[],
  "importantPages" TEXT,
  "linkingGuidelines" TEXT,
  
  -- WordPress settings
  "wordpressUrl" TEXT,
  "wordpressUsername" TEXT,
  "wordpressPassword" TEXT,
  "wordpressCategory" TEXT,
  "wordpressAutoPublish" BOOLEAN DEFAULT false,
  
  -- Project-specific analysis
  "contentAnalysis" JSONB,
  "contentStrategy" JSONB,
  "keywordResearch" JSONB,
  
  -- Settings & Status
  settings JSONB DEFAULT '{}'::jsonb,
  "isActive" BOOLEAN DEFAULT true,
  "isPrimary" BOOLEAN DEFAULT false,
  
  -- Timestamps
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. WEBSITE ANALYSIS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "WebsiteAnalysis" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  "projectId" TEXT REFERENCES "Project"(id) ON DELETE CASCADE,
  "websiteUrl" TEXT NOT NULL,
  niche TEXT,
  "targetAudience" TEXT,
  tone TEXT,
  keywords TEXT[],
  "keywordsConfidence" DOUBLE PRECISION,
  "brandVoice" TEXT,
  "contentPillars" TEXT[],
  "analysisData" JSONB,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. BLOG POST TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "BlogPost" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  "projectId" TEXT REFERENCES "Project"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  "metaDescription" TEXT,
  "focusKeyword" TEXT,
  "seoScore" INTEGER,
  status TEXT DEFAULT 'draft',
  "publishedAt" TIMESTAMP(3),
  "scheduledFor" TIMESTAMP(3),
  "wordpressPostId" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("clientId", slug)
);

-- ============================================
-- 6. CONTENT PLAN TABLES
-- ============================================
CREATE TABLE IF NOT EXISTS "ContentPlan" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  "projectId" TEXT REFERENCES "Project"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  niche TEXT,
  "targetAudience" TEXT,
  language TEXT DEFAULT 'nl',
  tone TEXT,
  "totalPosts" INTEGER DEFAULT 0,
  period TEXT,
  status TEXT DEFAULT 'draft',
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ContentPlanItem" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "planId" TEXT NOT NULL REFERENCES "ContentPlan"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "contentType" TEXT,
  keywords TEXT[],
  "scheduledDate" TIMESTAMP(3),
  status TEXT DEFAULT 'pending',
  "blogPostId" TEXT REFERENCES "BlogPost"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. TOPICAL AUTHORITY MAP TABLES
-- ============================================
CREATE TABLE IF NOT EXISTS "TopicalAuthorityMap" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  "projectId" TEXT REFERENCES "Project"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  niche TEXT NOT NULL,
  "targetAudience" TEXT,
  "totalArticles" INTEGER DEFAULT 0,
  "generatedArticles" INTEGER DEFAULT 0,
  status TEXT DEFAULT 'planning',
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "TopicalMapArticle" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "mapId" TEXT NOT NULL REFERENCES "TopicalAuthorityMap"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  "focusKeyword" TEXT,
  keywords TEXT[],
  "parentId" TEXT,
  "orderIndex" INTEGER,
  status TEXT DEFAULT 'pending',
  "blogPostId" TEXT REFERENCES "BlogPost"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "BatchJob" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "mapId" TEXT NOT NULL REFERENCES "TopicalAuthorityMap"(id) ON DELETE CASCADE,
  "totalArticles" INTEGER NOT NULL,
  "processedArticles" INTEGER DEFAULT 0,
  "failedArticles" INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  "batchSize" INTEGER DEFAULT 20,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. SOCIAL MEDIA TABLES
-- ============================================
CREATE TABLE IF NOT EXISTS "SocialMediaStrategy" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  "projectId" TEXT REFERENCES "Project"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platforms TEXT[],
  "postsPerWeek" INTEGER,
  tone TEXT,
  "contentPillars" TEXT[],
  status TEXT DEFAULT 'draft',
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SocialMediaPost" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "strategyId" TEXT NOT NULL REFERENCES "SocialMediaStrategy"(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  "imageUrl" TEXT,
  hashtags TEXT[],
  "scheduledFor" TIMESTAMP(3),
  status TEXT DEFAULT 'draft',
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 9. AUTOPILOT CONFIG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "AutopilotConfig" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  "projectId" TEXT REFERENCES "Project"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  "planId" TEXT,
  enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. OTHER TABLES
-- ============================================
CREATE TABLE IF NOT EXISTS "BrandSettings" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  "brandName" TEXT,
  "brandDescription" TEXT,
  "primaryColor" TEXT,
  "secondaryColor" TEXT,
  "logoUrl" TEXT,
  "fontFamily" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SavedContent" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  tags TEXT[],
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Video" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "videoUrl" TEXT,
  "thumbnailUrl" TEXT,
  status TEXT DEFAULT 'draft',
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "CreditTransaction" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Client indexes
CREATE INDEX IF NOT EXISTS idx_client_email ON "Client"(email);
CREATE INDEX IF NOT EXISTS idx_client_created_at ON "Client"("createdAt");

-- Project indexes
CREATE INDEX IF NOT EXISTS idx_project_client_id ON "Project"("clientId");
CREATE INDEX IF NOT EXISTS idx_project_status ON "Project"(status);

-- BlogPost indexes
CREATE INDEX IF NOT EXISTS idx_blogpost_client_id ON "BlogPost"("clientId");
CREATE INDEX IF NOT EXISTS idx_blogpost_project_id ON "BlogPost"("projectId");
CREATE INDEX IF NOT EXISTS idx_blogpost_status ON "BlogPost"(status);

-- ContentPlan indexes
CREATE INDEX IF NOT EXISTS idx_contentplan_client_id ON "ContentPlan"("clientId");
CREATE INDEX IF NOT EXISTS idx_contentplan_project_id ON "ContentPlan"("projectId");
CREATE INDEX IF NOT EXISTS idx_contentplanitem_plan_id ON "ContentPlanItem"("planId");

-- TopicalAuthorityMap indexes
CREATE INDEX IF NOT EXISTS idx_topicalmap_client_id ON "TopicalAuthorityMap"("clientId");
CREATE INDEX IF NOT EXISTS idx_topicalmap_project_id ON "TopicalAuthorityMap"("projectId");
CREATE INDEX IF NOT EXISTS idx_topicalarticle_map_id ON "TopicalMapArticle"("mapId");

-- SocialMedia indexes
CREATE INDEX IF NOT EXISTS idx_socialstrategy_client_id ON "SocialMediaStrategy"("clientId");
CREATE INDEX IF NOT EXISTS idx_socialstrategy_project_id ON "SocialMediaStrategy"("projectId");
CREATE INDEX IF NOT EXISTS idx_socialpost_strategy_id ON "SocialMediaPost"("strategyId");

-- WebsiteAnalysis indexes
CREATE INDEX IF NOT EXISTS idx_websiteanalysis_client_id ON "WebsiteAnalysis"("clientId");
CREATE INDEX IF NOT EXISTS idx_websiteanalysis_project_id ON "WebsiteAnalysis"("projectId");

-- AutopilotConfig indexes
CREATE INDEX IF NOT EXISTS idx_autopilot_client_id ON "AutopilotConfig"("clientId");
CREATE INDEX IF NOT EXISTS idx_autopilot_project_id ON "AutopilotConfig"("projectId");

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updatedAt
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN (
      'Client', 'Project', 'BlogPost', 'User', 'BrandSettings',
      'SavedContent', 'Video', 'ContentPlan', 'ContentPlanItem',
      'TopicalAuthorityMap', 'TopicalMapArticle', 'BatchJob',
      'SocialMediaStrategy', 'SocialMediaPost', 'AutopilotConfig',
      'WebsiteAnalysis'
    )
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%I_updated_at ON "%I";
      CREATE TRIGGER update_%I_updated_at
        BEFORE UPDATE ON "%I"
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END$$;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'Client', 'Project', 'BlogPost', 'ContentPlan', 'ContentPlanItem',
    'TopicalAuthorityMap', 'TopicalMapArticle', 'SocialMediaStrategy',
    'SocialMediaPost', 'AutopilotConfig', 'WebsiteAnalysis'
  );
  
  RAISE NOTICE '✅ Setup Complete: % core tables created', table_count;
END$$;
