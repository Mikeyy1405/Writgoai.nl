-- ============================================
-- COMPLETE DATABASE SETUP
-- ============================================
-- Dit script maakt ALLE ontbrekende tabellen aan voor Writgo.nl
-- Het kan veilig meerdere keren worden uitgevoerd (IF NOT EXISTS)
-- 
-- GEBRUIK:
-- 1. Kopieer dit hele script
-- 2. Plak in Supabase SQL Editor
-- 3. Klik op "Run"
-- 4. Klaar! ✅

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Functie voor automatische updatedAt timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. CLIENT TABEL
-- ============================================

CREATE TABLE IF NOT EXISTS "Client" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  "companyName" TEXT,
  website TEXT,
  description TEXT,
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
-- 2. PROJECT TABEL
-- ============================================

CREATE TABLE IF NOT EXISTS "Project" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL,
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
-- 3. BLOGPOST TABEL
-- ============================================

CREATE TABLE IF NOT EXISTS "BlogPost" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT,
  "projectId" TEXT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  "metaDescription" TEXT,
  "focusKeyword" TEXT,
  keywords TEXT[],
  "seoScore" INTEGER,
  status TEXT DEFAULT 'draft',
  "publishedAt" TIMESTAMP(3),
  "scheduledFor" TIMESTAMP(3),
  "wordpressPostId" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. CONTENTPLAN TABEL
-- ============================================

CREATE TABLE IF NOT EXISTS "ContentPlan" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT,
  "projectId" TEXT,
  name TEXT NOT NULL,
  niche TEXT,
  "targetAudience" TEXT,
  language TEXT DEFAULT 'nl',
  tone TEXT,
  "totalPosts" INTEGER NOT NULL,
  period TEXT,
  status TEXT DEFAULT 'planning',
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. CONTENTPLANITEM TABEL
-- ============================================

CREATE TABLE IF NOT EXISTS "ContentPlanItem" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "planId" TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  "contentType" TEXT,
  keywords TEXT[],
  "scheduledDate" TIMESTAMP(3),
  status TEXT DEFAULT 'pending',
  "blogPostId" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. TOPICALAUTHORITYMAP TABEL
-- ============================================

CREATE TABLE IF NOT EXISTS "TopicalAuthorityMap" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT,
  "projectId" TEXT,
  name TEXT NOT NULL,
  "totalArticles" INTEGER NOT NULL,
  status TEXT DEFAULT 'planning',
  progress INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. TOPICALMAPARTICLE TABEL
-- ============================================

CREATE TABLE IF NOT EXISTS "TopicalMapArticle" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "mapId" TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  keywords TEXT[],
  status TEXT DEFAULT 'pending',
  "blogPostId" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. SOCIALMEDIASTRATEGY TABEL
-- ============================================

CREATE TABLE IF NOT EXISTS "SocialMediaStrategy" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT,
  "projectId" TEXT,
  name TEXT NOT NULL,
  "totalPosts" INTEGER NOT NULL,
  platforms JSONB NOT NULL,
  status TEXT DEFAULT 'planning',
  progress INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 9. SOCIALMEDIAPOST TABEL
-- ============================================

CREATE TABLE IF NOT EXISTS "SocialMediaPost" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "strategyId" TEXT NOT NULL,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  hashtags TEXT[],
  "scheduledDate" TIMESTAMP(3),
  status TEXT DEFAULT 'pending',
  "lateDevPostId" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. WEBSITEANALYSIS TABEL (NIEUW!)
-- ============================================

CREATE TABLE IF NOT EXISTS "WebsiteAnalysis" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL,
  "projectId" TEXT,
  
  -- Analyse resultaten
  niche TEXT NOT NULL,
  "nicheConfidence" INTEGER DEFAULT 0,
  "targetAudience" TEXT NOT NULL,
  "audienceConfidence" INTEGER DEFAULT 0,
  tone TEXT NOT NULL,
  "toneConfidence" INTEGER DEFAULT 0,
  keywords TEXT[] DEFAULT '{}',
  themes TEXT[] DEFAULT '{}',
  reasoning TEXT,
  
  -- Metadata over de analyse
  "websiteUrl" TEXT,
  "blogPostsAnalyzed" INTEGER DEFAULT 0,
  "socialPostsAnalyzed" INTEGER DEFAULT 0,
  
  -- Timestamps
  "analyzedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 11. AUTOPILOTCONFIG TABEL
-- ============================================

CREATE TABLE IF NOT EXISTS "AutopilotConfig" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT,
  "projectId" TEXT,
  type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  frequency TEXT,
  settings JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- FOREIGN KEYS
-- ============================================

DO $$ 
BEGIN
  -- Project foreign keys
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Project_clientId_fkey'
  ) THEN
    ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" 
      FOREIGN KEY ("clientId") REFERENCES "Client"(id) ON DELETE CASCADE;
  END IF;
  
  -- BlogPost foreign keys
  ALTER TABLE "BlogPost" DROP CONSTRAINT IF EXISTS "BlogPost_clientId_fkey";
  ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_clientId_fkey" 
    FOREIGN KEY ("clientId") REFERENCES "Client"(id) ON DELETE CASCADE;
  
  ALTER TABLE "BlogPost" DROP CONSTRAINT IF EXISTS "BlogPost_projectId_fkey";
  ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_projectId_fkey" 
    FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE;
  
  -- ContentPlan foreign keys
  ALTER TABLE "ContentPlan" DROP CONSTRAINT IF EXISTS "ContentPlan_clientId_fkey";
  ALTER TABLE "ContentPlan" ADD CONSTRAINT "ContentPlan_clientId_fkey" 
    FOREIGN KEY ("clientId") REFERENCES "Client"(id) ON DELETE CASCADE;
  
  ALTER TABLE "ContentPlan" DROP CONSTRAINT IF EXISTS "ContentPlan_projectId_fkey";
  ALTER TABLE "ContentPlan" ADD CONSTRAINT "ContentPlan_projectId_fkey" 
    FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE;
  
  -- ContentPlanItem foreign keys
  ALTER TABLE "ContentPlanItem" DROP CONSTRAINT IF EXISTS "ContentPlanItem_planId_fkey";
  ALTER TABLE "ContentPlanItem" ADD CONSTRAINT "ContentPlanItem_planId_fkey" 
    FOREIGN KEY ("planId") REFERENCES "ContentPlan"(id) ON DELETE CASCADE;
  
  ALTER TABLE "ContentPlanItem" DROP CONSTRAINT IF EXISTS "ContentPlanItem_blogPostId_fkey";
  ALTER TABLE "ContentPlanItem" ADD CONSTRAINT "ContentPlanItem_blogPostId_fkey" 
    FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"(id) ON DELETE SET NULL;
  
  -- TopicalAuthorityMap foreign keys
  ALTER TABLE "TopicalAuthorityMap" DROP CONSTRAINT IF EXISTS "TopicalAuthorityMap_clientId_fkey";
  ALTER TABLE "TopicalAuthorityMap" ADD CONSTRAINT "TopicalAuthorityMap_clientId_fkey" 
    FOREIGN KEY ("clientId") REFERENCES "Client"(id) ON DELETE CASCADE;
  
  ALTER TABLE "TopicalAuthorityMap" DROP CONSTRAINT IF EXISTS "TopicalAuthorityMap_projectId_fkey";
  ALTER TABLE "TopicalAuthorityMap" ADD CONSTRAINT "TopicalAuthorityMap_projectId_fkey" 
    FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE;
  
  -- TopicalMapArticle foreign keys
  ALTER TABLE "TopicalMapArticle" DROP CONSTRAINT IF EXISTS "TopicalMapArticle_mapId_fkey";
  ALTER TABLE "TopicalMapArticle" ADD CONSTRAINT "TopicalMapArticle_mapId_fkey" 
    FOREIGN KEY ("mapId") REFERENCES "TopicalAuthorityMap"(id) ON DELETE CASCADE;
  
  ALTER TABLE "TopicalMapArticle" DROP CONSTRAINT IF EXISTS "TopicalMapArticle_blogPostId_fkey";
  ALTER TABLE "TopicalMapArticle" ADD CONSTRAINT "TopicalMapArticle_blogPostId_fkey" 
    FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"(id) ON DELETE SET NULL;
  
  -- SocialMediaStrategy foreign keys
  ALTER TABLE "SocialMediaStrategy" DROP CONSTRAINT IF EXISTS "SocialMediaStrategy_clientId_fkey";
  ALTER TABLE "SocialMediaStrategy" ADD CONSTRAINT "SocialMediaStrategy_clientId_fkey" 
    FOREIGN KEY ("clientId") REFERENCES "Client"(id) ON DELETE CASCADE;
  
  ALTER TABLE "SocialMediaStrategy" DROP CONSTRAINT IF EXISTS "SocialMediaStrategy_projectId_fkey";
  ALTER TABLE "SocialMediaStrategy" ADD CONSTRAINT "SocialMediaStrategy_projectId_fkey" 
    FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE;
  
  -- SocialMediaPost foreign keys
  ALTER TABLE "SocialMediaPost" DROP CONSTRAINT IF EXISTS "SocialMediaPost_strategyId_fkey";
  ALTER TABLE "SocialMediaPost" ADD CONSTRAINT "SocialMediaPost_strategyId_fkey" 
    FOREIGN KEY ("strategyId") REFERENCES "SocialMediaStrategy"(id) ON DELETE CASCADE;
  
  -- WebsiteAnalysis foreign keys
  ALTER TABLE "WebsiteAnalysis" DROP CONSTRAINT IF EXISTS "WebsiteAnalysis_clientId_fkey";
  ALTER TABLE "WebsiteAnalysis" ADD CONSTRAINT "WebsiteAnalysis_clientId_fkey" 
    FOREIGN KEY ("clientId") REFERENCES "Client"(id) ON DELETE CASCADE;
  
  ALTER TABLE "WebsiteAnalysis" DROP CONSTRAINT IF EXISTS "WebsiteAnalysis_projectId_fkey";
  ALTER TABLE "WebsiteAnalysis" ADD CONSTRAINT "WebsiteAnalysis_projectId_fkey" 
    FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE;
  
  -- AutopilotConfig foreign keys
  ALTER TABLE "AutopilotConfig" DROP CONSTRAINT IF EXISTS "AutopilotConfig_clientId_fkey";
  ALTER TABLE "AutopilotConfig" ADD CONSTRAINT "AutopilotConfig_clientId_fkey" 
    FOREIGN KEY ("clientId") REFERENCES "Client"(id) ON DELETE CASCADE;
  
  ALTER TABLE "AutopilotConfig" DROP CONSTRAINT IF EXISTS "AutopilotConfig_projectId_fkey";
  ALTER TABLE "AutopilotConfig" ADD CONSTRAINT "AutopilotConfig_projectId_fkey" 
    FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE;
END $$;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS "idx_client_email" ON "Client"(email);
CREATE INDEX IF NOT EXISTS "idx_project_clientId" ON "Project"("clientId");
CREATE INDEX IF NOT EXISTS "idx_blogpost_clientId" ON "BlogPost"("clientId");
CREATE INDEX IF NOT EXISTS "idx_blogpost_projectId" ON "BlogPost"("projectId");
CREATE INDEX IF NOT EXISTS "idx_contentplan_clientId" ON "ContentPlan"("clientId");
CREATE INDEX IF NOT EXISTS "idx_contentplanitem_planId" ON "ContentPlanItem"("planId");
CREATE INDEX IF NOT EXISTS "idx_topicalmap_clientId" ON "TopicalAuthorityMap"("clientId");
CREATE INDEX IF NOT EXISTS "idx_topicalmaparticle_mapId" ON "TopicalMapArticle"("mapId");
CREATE INDEX IF NOT EXISTS "idx_socialstrategy_clientId" ON "SocialMediaStrategy"("clientId");
CREATE INDEX IF NOT EXISTS "idx_socialpost_strategyId" ON "SocialMediaPost"("strategyId");
CREATE INDEX IF NOT EXISTS "idx_websiteanalysis_clientId" ON "WebsiteAnalysis"("clientId");
CREATE INDEX IF NOT EXISTS "idx_websiteanalysis_analyzedAt" ON "WebsiteAnalysis"("analyzedAt");
CREATE INDEX IF NOT EXISTS "idx_autopilot_clientId" ON "AutopilotConfig"("clientId");

-- ============================================
-- TRIGGERS
-- ============================================

-- Client
DROP TRIGGER IF EXISTS update_client_updated_at ON "Client";
CREATE TRIGGER update_client_updated_at
  BEFORE UPDATE ON "Client"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Project
DROP TRIGGER IF EXISTS update_project_updated_at ON "Project";
CREATE TRIGGER update_project_updated_at
  BEFORE UPDATE ON "Project"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- BlogPost
DROP TRIGGER IF EXISTS update_blogpost_updated_at ON "BlogPost";
CREATE TRIGGER update_blogpost_updated_at
  BEFORE UPDATE ON "BlogPost"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ContentPlan
DROP TRIGGER IF EXISTS update_contentplan_updated_at ON "ContentPlan";
CREATE TRIGGER update_contentplan_updated_at
  BEFORE UPDATE ON "ContentPlan"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- TopicalAuthorityMap
DROP TRIGGER IF EXISTS update_topicalmap_updated_at ON "TopicalAuthorityMap";
CREATE TRIGGER update_topicalmap_updated_at
  BEFORE UPDATE ON "TopicalAuthorityMap"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- SocialMediaStrategy
DROP TRIGGER IF EXISTS update_socialstrategy_updated_at ON "SocialMediaStrategy";
CREATE TRIGGER update_socialstrategy_updated_at
  BEFORE UPDATE ON "SocialMediaStrategy"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- WebsiteAnalysis
DROP TRIGGER IF EXISTS update_websiteanalysis_updated_at ON "WebsiteAnalysis";
CREATE TRIGGER update_websiteanalysis_updated_at
  BEFORE UPDATE ON "WebsiteAnalysis"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- AutopilotConfig
DROP TRIGGER IF EXISTS update_autopilot_updated_at ON "AutopilotConfig";
CREATE TRIGGER update_autopilot_updated_at
  BEFORE UPDATE ON "AutopilotConfig"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATIE
-- ============================================

-- Toon alle aangemaakte tabellen
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'Client', 'Project', 'BlogPost', 'ContentPlan', 'ContentPlanItem',
    'TopicalAuthorityMap', 'TopicalMapArticle',
    'SocialMediaStrategy', 'SocialMediaPost',
    'WebsiteAnalysis', 'AutopilotConfig'
  )
ORDER BY table_name;

-- Toon alle foreign keys
SELECT 
  conrelid::regclass AS table_name,
  conname AS constraint_name,
  confrelid::regclass AS foreign_table
FROM pg_constraint
WHERE contype = 'f'
  AND conrelid::regclass::text IN (
    'BlogPost', 'ContentPlan', 'ContentPlanItem', 'TopicalAuthorityMap', 
    'TopicalMapArticle', 'SocialMediaStrategy', 'SocialMediaPost',
    'WebsiteAnalysis', 'AutopilotConfig'
  )
ORDER BY table_name, constraint_name;

-- Succesbericht
SELECT '✅ Complete database setup voltooid!' as status;
SELECT '🎉 Alle tabellen, foreign keys, indexes en triggers zijn aangemaakt!' as detail;
