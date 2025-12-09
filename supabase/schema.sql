-- WritgoAI Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to create all tables
-- Based on Prisma schema from schema.prisma

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Language enum
CREATE TYPE "Language" AS ENUM (
  'NL', 'EN', 'DE', 'ES', 'FR', 'IT', 'PT', 'PL', 'SV', 'DA'
);

-- ============================================
-- CORE TABLES
-- ============================================

-- User table (for admin users)
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "email" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT,
  "role" TEXT NOT NULL DEFAULT 'admin',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Client table (for client users)
CREATE TABLE "Client" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "companyName" TEXT,
  "website" TEXT,
  "password" TEXT NOT NULL,
  "automationActive" BOOLEAN NOT NULL DEFAULT false,
  "automationStartDate" TIMESTAMP(3),
  "targetAudience" TEXT,
  "brandVoice" TEXT,
  "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "wordpressUrl" TEXT,
  "wordpressUsername" TEXT,
  "wordpressPassword" TEXT,
  "youtubeChannelId" TEXT,
  "youtubeApiKey" TEXT,
  "tiktokAccessToken" TEXT,
  "facebookPageId" TEXT,
  "instagramAccountId" TEXT,
  "linkedinPageId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "facebookAccessToken" TEXT,
  "facebookConnected" BOOLEAN NOT NULL DEFAULT false,
  "facebookPageName" TEXT,
  "instagramAccessToken" TEXT,
  "instagramConnected" BOOLEAN NOT NULL DEFAULT false,
  "instagramUsername" TEXT,
  "tiktokConnected" BOOLEAN NOT NULL DEFAULT false,
  "youtubeAccessToken" TEXT,
  "youtubeChannelName" TEXT,
  "youtubeConnected" BOOLEAN NOT NULL DEFAULT false,
  "youtubeRefreshToken" TEXT,
  "youtubeTokenExpiry" TIMESTAMP(3),
  "tiktokOpenId" TEXT,
  "tiktokRefreshToken" TEXT,
  "tiktokTokenExpiry" TIMESTAMP(3),
  "tiktokUsername" TEXT,
  "lateDevProfileId" TEXT,
  "wordpressSitemap" JSONB,
  "wordpressSitemapDate" TIMESTAMP(3),
  "contentPlan" JSONB,
  "lastPlanGenerated" TIMESTAMP(3),
  "isUnlimited" BOOLEAN NOT NULL DEFAULT false,
  "totalCreditsPurchased" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalCreditsUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "monthlyCredits" DOUBLE PRECISION,
  "subscriptionEndDate" TIMESTAMP(3),
  "subscriptionId" TEXT UNIQUE,
  "subscriptionPlan" TEXT,
  "subscriptionStartDate" TIMESTAMP(3),
  "subscriptionStatus" TEXT,
  "subscriptionCredits" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "topUpCredits" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "moneybirdContactId" TEXT,
  "moneybirdSubscriptionId" TEXT,
  "hasFullyManagedService" BOOLEAN NOT NULL DEFAULT false,
  "managedServiceStartDate" TIMESTAMP(3),
  "managedServiceSubscriptionId" TEXT,
  "affiliateCode" TEXT UNIQUE,
  "affiliateCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
  "affiliateEnabled" BOOLEAN NOT NULL DEFAULT true,
  "affiliateTotalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "affiliateWithdrawn" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "linkbuildingEnabled" BOOLEAN NOT NULL DEFAULT false,
  "referredBy" TEXT,
  "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false
);

-- BrandSettings table (for branding configuration)
CREATE TABLE "BrandSettings" (
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

-- Project table
CREATE TABLE "Project" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "websiteUrl" TEXT NOT NULL,
  "description" TEXT,
  "sitemap" JSONB,
  "sitemapScannedAt" TIMESTAMP(3),
  "targetAudience" TEXT,
  "brandVoice" TEXT,
  "niche" TEXT,
  "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "contentPillars" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "writingStyle" TEXT,
  "customInstructions" TEXT,
  "personalInfo" JSONB,
  "preferredProducts" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "importantPages" JSONB,
  "linkingGuidelines" TEXT,
  "wordpressUrl" TEXT,
  "wordpressUsername" TEXT,
  "wordpressPassword" TEXT,
  "wordpressCategory" TEXT,
  "wordpressAutoPublish" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "additionalInfo" TEXT,
  "budget" TEXT,
  "businessGoals" TEXT,
  "competitors" TEXT,
  "contentTopics" TEXT,
  "currentChallenges" TEXT,
  "desiredOutcome" TEXT,
  "socialMediaChannels" TEXT,
  "timeline" TEXT,
  "uniqueSellingPoints" TEXT,
  "contentAnalysis" JSONB,
  "contentAnalysisDate" TIMESTAMP(3),
  "contentAnalysisStatus" TEXT,
  "contentStrategy" JSONB,
  "contentStrategyDate" TIMESTAMP(3),
  "contentStrategyStatus" TEXT,
  "keywordResearch" JSONB,
  "keywordResearchDate" TIMESTAMP(3),
  "keywordResearchStatus" TEXT,
  "bolcomAffiliateId" TEXT,
  "bolcomClientId" TEXT,
  "bolcomClientSecret" TEXT,
  "bolcomEnabled" BOOLEAN NOT NULL DEFAULT false,
  "autopilotArticlesPerRun" INTEGER NOT NULL DEFAULT 5,
  "autopilotAutoPublish" BOOLEAN NOT NULL DEFAULT false,
  "autopilotContentType" TEXT,
  "autopilotEnabled" BOOLEAN NOT NULL DEFAULT false,
  "autopilotFrequency" TEXT,
  "autopilotLastRun" TIMESTAMP(3),
  "autopilotNextRun" TIMESTAMP(3),
  "autopilotPriority" TEXT,
  "autopilotMode" TEXT NOT NULL DEFAULT 'fast',
  "autopilotWordCount" INTEGER NOT NULL DEFAULT 2000,
  "tradeTrackerCampaignId" TEXT,
  "tradeTrackerEnabled" BOOLEAN NOT NULL DEFAULT false,
  "tradeTrackerPassphrase" TEXT,
  "tradeTrackerSiteId" TEXT,
  "autopilotIncludeDirectAnswer" BOOLEAN NOT NULL DEFAULT false,
  "autopilotIncludeFAQ" BOOLEAN NOT NULL DEFAULT false,
  "autopilotIncludeYouTube" BOOLEAN NOT NULL DEFAULT false,
  "googleSearchConsoleEnabled" BOOLEAN NOT NULL DEFAULT false,
  "googleSearchConsoleLastSync" TIMESTAMP(3),
  "googleSearchConsoleSiteUrl" TEXT,
  "autopilotPublishToWritgoaiBlog" BOOLEAN NOT NULL DEFAULT false,
  "customTones" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "language" "Language" NOT NULL DEFAULT 'NL',
  "autopilotImageCount" INTEGER NOT NULL DEFAULT 2,
  "autopilotPublishingDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "autopilotPublishingTime" TEXT NOT NULL DEFAULT '09:00',
  "wooCommerceEnabled" BOOLEAN NOT NULL DEFAULT false,
  "imageModel" TEXT NOT NULL DEFAULT 'flux-pro',
  "useFreeStockImages" BOOLEAN NOT NULL DEFAULT true,
  "wooCommerceAutoUpdate" BOOLEAN DEFAULT false,
  "wooCommerceUpdateSchedule" TEXT DEFAULT 'weekly',
  "aiDetectionProvider" TEXT NOT NULL DEFAULT 'originality',
  CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE
);

-- Video table
CREATE TABLE "Video" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "vid" TEXT UNIQUE NOT NULL,
  "topic" TEXT NOT NULL,
  "script" TEXT NOT NULL,
  "language" TEXT NOT NULL DEFAULT 'Dutch',
  "voiceId" TEXT,
  "style" TEXT NOT NULL DEFAULT 'Cinematic',
  "duration" TEXT NOT NULL DEFAULT '30-60',
  "status" TEXT NOT NULL DEFAULT 'processing',
  "videoUrl" TEXT,
  "thumbnailUrl" TEXT,
  "error" TEXT,
  "clientId" TEXT,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Video_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE,
  CONSTRAINT "Video_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- SavedContent table
CREATE TABLE "SavedContent" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "contentHtml" TEXT,
  "category" TEXT,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "description" TEXT,
  "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "metaDesc" TEXT,
  "slug" TEXT,
  "thumbnailUrl" TEXT,
  "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "isFavorite" BOOLEAN NOT NULL DEFAULT false,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "publishedUrl" TEXT,
  "publishedAt" TIMESTAMP(3),
  "wordCount" INTEGER,
  "characterCount" INTEGER,
  "projectId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "generatorType" TEXT,
  "wordpressCategory" TEXT,
  "language" "Language" NOT NULL DEFAULT 'NL',
  CONSTRAINT "SavedContent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE,
  CONSTRAINT "SavedContent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id")
);

-- CreditTransaction table
CREATE TABLE "CreditTransaction" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "model" TEXT,
  "tokensUsed" INTEGER,
  "messageId" TEXT,
  "balanceAfter" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CreditTransaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE
);

-- Password Reset Token table
CREATE TABLE "PasswordResetToken" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "email" TEXT NOT NULL,
  "token" TEXT UNIQUE NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- BlogPost table (for public blog posts)
CREATE TABLE "BlogPost" (
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

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "Client_email_idx" ON "Client"("email");
CREATE INDEX "Client_subscriptionId_idx" ON "Client"("subscriptionId");
CREATE INDEX "Client_affiliateCode_idx" ON "Client"("affiliateCode");
CREATE INDEX "Project_clientId_idx" ON "Project"("clientId");
CREATE INDEX "Project_websiteUrl_idx" ON "Project"("websiteUrl");
CREATE INDEX "Video_clientId_idx" ON "Video"("clientId");
CREATE INDEX "Video_userId_idx" ON "Video"("userId");
CREATE INDEX "Video_status_idx" ON "Video"("status");
CREATE INDEX "SavedContent_clientId_idx" ON "SavedContent"("clientId");
CREATE INDEX "SavedContent_type_idx" ON "SavedContent"("type");
CREATE INDEX "SavedContent_category_idx" ON "SavedContent"("category");
CREATE INDEX "SavedContent_isFavorite_idx" ON "SavedContent"("isFavorite");
CREATE INDEX "SavedContent_isArchived_idx" ON "SavedContent"("isArchived");
CREATE INDEX "SavedContent_createdAt_idx" ON "SavedContent"("createdAt");
CREATE INDEX "SavedContent_generatorType_idx" ON "SavedContent"("generatorType");
CREATE INDEX "CreditTransaction_clientId_idx" ON "CreditTransaction"("clientId");
CREATE INDEX "CreditTransaction_createdAt_idx" ON "CreditTransaction"("createdAt");
CREATE INDEX "CreditTransaction_type_idx" ON "CreditTransaction"("type");
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");
CREATE INDEX "BlogPost_slug_idx" ON "BlogPost"("slug");
CREATE INDEX "BlogPost_status_idx" ON "BlogPost"("status");
CREATE INDEX "BlogPost_category_idx" ON "BlogPost"("category");
CREATE INDEX "BlogPost_publishedAt_idx" ON "BlogPost"("publishedAt");
CREATE INDEX "BlogPost_createdAt_idx" ON "BlogPost"("createdAt");

-- ============================================
-- FUNCTIONS FOR UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updatedAt
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_updated_at BEFORE UPDATE ON "Client"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brandsettings_updated_at BEFORE UPDATE ON "BrandSettings"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_updated_at BEFORE UPDATE ON "Project"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_updated_at BEFORE UPDATE ON "Video"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_savedcontent_updated_at BEFORE UPDATE ON "SavedContent"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blogpost_updated_at BEFORE UPDATE ON "BlogPost"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- NOTES
-- ============================================
-- This is a basic schema with the most essential tables.
-- The full Prisma schema has 71 tables. Add additional tables as needed.
-- 
-- Important tables not included above but that may be needed:
-- - Conversation, ChatMessage, BackgroundJob
-- - ClientAISettings, ClientAIProfile
-- - ArticleIdea, Keyword, Feedback
-- - AutopilotJob, AutopilotSchedule
-- - EmailTemplate, EmailCampaign, EmailLog
-- - SocialMediaAccount, SocialMediaPost, ScheduledPost
-- - LinkbuildingPartnership, AffiliateEarning, AffiliatePayout
-- - Invoice, Order, Assignment
-- - And many more...
--
-- To add more tables, follow the pattern above:
-- 1. Create table with appropriate columns and types
-- 2. Add foreign key constraints
-- 3. Add indexes for commonly queried columns
-- 4. Add updated_at trigger if needed
