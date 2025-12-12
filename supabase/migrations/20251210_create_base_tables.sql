-- Create Base Tables for Writgo.nl
-- This migration creates the foundational Client and Project tables

-- ============================================
-- USER TABLE (for authentication)
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
-- CLIENT TABLE
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
-- PROJECT TABLE
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
-- BLOG POST TABLE
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
-- BRAND SETTINGS TABLE
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

-- ============================================
-- SAVED CONTENT TABLE
-- ============================================
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

-- ============================================
-- VIDEO TABLE
-- ============================================
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

-- ============================================
-- CREDIT TRANSACTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "CreditTransaction" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PASSWORD RESET TOKEN TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

-- Client indexes
CREATE INDEX IF NOT EXISTS idx_client_email ON "Client"(email);
CREATE INDEX IF NOT EXISTS idx_client_subscription_plan ON "Client"("subscriptionPlan");
CREATE INDEX IF NOT EXISTS idx_client_created_at ON "Client"("createdAt");

-- Project indexes
CREATE INDEX IF NOT EXISTS idx_project_client_id ON "Project"("clientId");
CREATE INDEX IF NOT EXISTS idx_project_status ON "Project"(status);
CREATE INDEX IF NOT EXISTS idx_project_is_primary ON "Project"("isPrimary");

-- BlogPost indexes
CREATE INDEX IF NOT EXISTS idx_blogpost_client_id ON "BlogPost"("clientId");
CREATE INDEX IF NOT EXISTS idx_blogpost_project_id ON "BlogPost"("projectId");
CREATE INDEX IF NOT EXISTS idx_blogpost_status ON "BlogPost"(status);
CREATE INDEX IF NOT EXISTS idx_blogpost_published_at ON "BlogPost"("publishedAt");

-- User indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"(role);

-- ============================================
-- TRIGGER FUNCTIONS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to all tables
CREATE TRIGGER update_client_updated_at
  BEFORE UPDATE ON "Client"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_updated_at
  BEFORE UPDATE ON "Project"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blogpost_updated_at
  BEFORE UPDATE ON "BlogPost"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_updated_at
  BEFORE UPDATE ON "User"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_settings_updated_at
  BEFORE UPDATE ON "BrandSettings"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_content_updated_at
  BEFORE UPDATE ON "SavedContent"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_updated_at
  BEFORE UPDATE ON "Video"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE "Client" IS 'Main client accounts for Writgo.nl platform';
COMMENT ON TABLE "Project" IS 'Projects for multi-website management per client';
COMMENT ON TABLE "BlogPost" IS 'Blog posts generated and managed by the platform';
COMMENT ON TABLE "User" IS 'User accounts for authentication (clients and admins)';
