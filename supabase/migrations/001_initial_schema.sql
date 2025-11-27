-- WritgoAI Database Schema for Supabase
-- Generated from Prisma schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension for generating IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Language enum
CREATE TYPE "Language" AS ENUM ('NL', 'EN', 'DE', 'ES', 'FR', 'IT', 'PT', 'PL', 'SV', 'DA');

-- =====================================================
-- USER MANAGEMENT TABLES
-- =====================================================

-- Admin Users table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- Client Users table
CREATE TABLE IF NOT EXISTS "Client" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "email" TEXT NOT NULL,
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
    "subscriptionId" TEXT,
    "subscriptionPlan" TEXT,
    "subscriptionStartDate" TIMESTAMP(3),
    "subscriptionStatus" TEXT,
    "subscriptionCredits" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "topUpCredits" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hasFullyManagedService" BOOLEAN NOT NULL DEFAULT false,
    "managedServiceStartDate" TIMESTAMP(3),
    "managedServiceSubscriptionId" TEXT,
    "affiliateCode" TEXT,
    "affiliateCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "affiliateEnabled" BOOLEAN NOT NULL DEFAULT true,
    "affiliateTotalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "affiliateWithdrawn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "linkbuildingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "referredBy" TEXT,
    "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Client_email_key" ON "Client"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Client_subscriptionId_key" ON "Client"("subscriptionId");
CREATE UNIQUE INDEX IF NOT EXISTS "Client_affiliateCode_key" ON "Client"("affiliateCode");

-- =====================================================
-- PROJECT TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
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

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Project_clientId_idx" ON "Project"("clientId");
CREATE INDEX IF NOT EXISTS "Project_websiteUrl_idx" ON "Project"("websiteUrl");

-- =====================================================
-- CONTENT TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS "SavedContent" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
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

    CONSTRAINT "SavedContent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SavedContent_clientId_idx" ON "SavedContent"("clientId");
CREATE INDEX IF NOT EXISTS "SavedContent_type_idx" ON "SavedContent"("type");
CREATE INDEX IF NOT EXISTS "SavedContent_category_idx" ON "SavedContent"("category");
CREATE INDEX IF NOT EXISTS "SavedContent_isFavorite_idx" ON "SavedContent"("isFavorite");
CREATE INDEX IF NOT EXISTS "SavedContent_isArchived_idx" ON "SavedContent"("isArchived");
CREATE INDEX IF NOT EXISTS "SavedContent_createdAt_idx" ON "SavedContent"("createdAt");
CREATE INDEX IF NOT EXISTS "SavedContent_generatorType_idx" ON "SavedContent"("generatorType");

-- Article Ideas
CREATE TABLE IF NOT EXISTS "ArticleIdea" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "focusKeyword" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "secondaryKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "searchIntent" TEXT,
    "searchVolume" INTEGER,
    "difficulty" INTEGER,
    "contentOutline" JSONB,
    "targetWordCount" INTEGER,
    "contentType" TEXT,
    "contentCategory" TEXT,
    "internalLinks" JSONB,
    "relatedArticles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageIdeas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videoIdeas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "category" TEXT,
    "cluster" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'idea',
    "hasContent" BOOLEAN NOT NULL DEFAULT false,
    "contentId" TEXT,
    "generatedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "aiScore" INTEGER,
    "trending" BOOLEAN NOT NULL DEFAULT false,
    "seasonal" BOOLEAN NOT NULL DEFAULT false,
    "competitorGap" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT,
    "language" "Language" NOT NULL DEFAULT 'NL',

    CONSTRAINT "ArticleIdea_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ArticleIdea_contentId_key" ON "ArticleIdea"("contentId");
CREATE UNIQUE INDEX IF NOT EXISTS "ArticleIdea_clientId_slug_key" ON "ArticleIdea"("clientId", "slug");
CREATE INDEX IF NOT EXISTS "ArticleIdea_clientId_idx" ON "ArticleIdea"("clientId");
CREATE INDEX IF NOT EXISTS "ArticleIdea_projectId_idx" ON "ArticleIdea"("projectId");
CREATE INDEX IF NOT EXISTS "ArticleIdea_focusKeyword_idx" ON "ArticleIdea"("focusKeyword");
CREATE INDEX IF NOT EXISTS "ArticleIdea_status_idx" ON "ArticleIdea"("status");
CREATE INDEX IF NOT EXISTS "ArticleIdea_priority_idx" ON "ArticleIdea"("priority");
CREATE INDEX IF NOT EXISTS "ArticleIdea_scheduledFor_idx" ON "ArticleIdea"("scheduledFor");

-- =====================================================
-- AUTOPILOT TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS "AutopilotJob" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "clientId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "projectId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentStep" TEXT,
    "contentId" TEXT,
    "publishedUrl" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutopilotJob_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AutopilotJob_clientId_idx" ON "AutopilotJob"("clientId");
CREATE INDEX IF NOT EXISTS "AutopilotJob_articleId_idx" ON "AutopilotJob"("articleId");
CREATE INDEX IF NOT EXISTS "AutopilotJob_status_idx" ON "AutopilotJob"("status");
CREATE INDEX IF NOT EXISTS "AutopilotJob_startedAt_idx" ON "AutopilotJob"("startedAt");

CREATE TABLE IF NOT EXISTS "AutopilotSchedule" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "clientId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scheduleType" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3),
    "frequency" TEXT,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "timeOfDay" TEXT NOT NULL DEFAULT '09:00',
    "customInterval" INTEGER,
    "articleIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "processingStrategy" TEXT NOT NULL DEFAULT 'sequential',
    "articlesPerRun" INTEGER NOT NULL DEFAULT 1,
    "autoPublish" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnCompletion" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "successfulRuns" INTEGER NOT NULL DEFAULT 0,
    "failedRuns" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "processedArticleIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentType" TEXT NOT NULL DEFAULT 'blog',
    "includeAffiliateLinks" BOOLEAN NOT NULL DEFAULT true,
    "includeBolcomProducts" BOOLEAN NOT NULL DEFAULT true,
    "includeImages" BOOLEAN NOT NULL DEFAULT true,
    "secondTimeOfDay" TEXT,
    "autoSelectMode" BOOLEAN NOT NULL DEFAULT false,
    "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "platforms" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "AutopilotSchedule_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AutopilotSchedule_clientId_idx" ON "AutopilotSchedule"("clientId");
CREATE INDEX IF NOT EXISTS "AutopilotSchedule_projectId_idx" ON "AutopilotSchedule"("projectId");
CREATE INDEX IF NOT EXISTS "AutopilotSchedule_isActive_idx" ON "AutopilotSchedule"("isActive");
CREATE INDEX IF NOT EXISTS "AutopilotSchedule_nextRunAt_idx" ON "AutopilotSchedule"("nextRunAt");
CREATE INDEX IF NOT EXISTS "AutopilotSchedule_scheduleType_idx" ON "AutopilotSchedule"("scheduleType");

-- =====================================================
-- CREDITS & TRANSACTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS "CreditTransaction" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "clientId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "model" TEXT,
    "tokensUsed" INTEGER,
    "messageId" TEXT,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CreditTransaction_clientId_idx" ON "CreditTransaction"("clientId");
CREATE INDEX IF NOT EXISTS "CreditTransaction_createdAt_idx" ON "CreditTransaction"("createdAt");
CREATE INDEX IF NOT EXISTS "CreditTransaction_type_idx" ON "CreditTransaction"("type");

CREATE TABLE IF NOT EXISTS "CreditPurchase" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "clientId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "credits" DOUBLE PRECISION NOT NULL,
    "priceEur" DOUBLE PRECISION NOT NULL,
    "stripePaymentId" TEXT,
    "stripeSessionId" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CreditPurchase_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CreditPurchase_stripePaymentId_key" ON "CreditPurchase"("stripePaymentId");
CREATE INDEX IF NOT EXISTS "CreditPurchase_clientId_idx" ON "CreditPurchase"("clientId");
CREATE INDEX IF NOT EXISTS "CreditPurchase_paymentStatus_idx" ON "CreditPurchase"("paymentStatus");

CREATE TABLE IF NOT EXISTS "CreditPackage" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "name" TEXT NOT NULL,
    "credits" DOUBLE PRECISION NOT NULL,
    "priceEur" DOUBLE PRECISION NOT NULL,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditPackage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CreditPackage_name_key" ON "CreditPackage"("name");

-- =====================================================
-- CHAT & CONVERSATION TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "title" TEXT NOT NULL DEFAULT 'Nieuw gesprek',
    "clientId" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Conversation_clientId_idx" ON "Conversation"("clientId");
CREATE INDEX IF NOT EXISTS "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");

CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "toolCalls" JSONB,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videos" JSONB,
    "attachments" JSONB,
    "codeBlocks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ChatMessage_conversationId_idx" ON "ChatMessage"("conversationId");
CREATE INDEX IF NOT EXISTS "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- =====================================================
-- VIDEO TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS "Video" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "vid" TEXT NOT NULL,
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

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Video_vid_key" ON "Video"("vid");
CREATE INDEX IF NOT EXISTS "Video_clientId_idx" ON "Video"("clientId");
CREATE INDEX IF NOT EXISTS "Video_userId_idx" ON "Video"("userId");
CREATE INDEX IF NOT EXISTS "Video_status_idx" ON "Video"("status");

-- =====================================================
-- BLOG POSTS (Public Blog)
-- =====================================================

CREATE TABLE IF NOT EXISTS "BlogPost" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "language" "Language" NOT NULL DEFAULT 'NL',

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BlogPost_slug_key" ON "BlogPost"("slug");
CREATE INDEX IF NOT EXISTS "BlogPost_status_idx" ON "BlogPost"("status");
CREATE INDEX IF NOT EXISTS "BlogPost_publishedAt_idx" ON "BlogPost"("publishedAt");
CREATE INDEX IF NOT EXISTS "BlogPost_category_idx" ON "BlogPost"("category");

-- =====================================================
-- FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Project -> Client
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" 
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SavedContent -> Client
ALTER TABLE "SavedContent" ADD CONSTRAINT "SavedContent_clientId_fkey" 
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SavedContent -> Project
ALTER TABLE "SavedContent" ADD CONSTRAINT "SavedContent_projectId_fkey" 
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ArticleIdea -> Client
ALTER TABLE "ArticleIdea" ADD CONSTRAINT "ArticleIdea_clientId_fkey" 
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ArticleIdea -> Project
ALTER TABLE "ArticleIdea" ADD CONSTRAINT "ArticleIdea_projectId_fkey" 
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ArticleIdea -> SavedContent
ALTER TABLE "ArticleIdea" ADD CONSTRAINT "ArticleIdea_contentId_fkey" 
    FOREIGN KEY ("contentId") REFERENCES "SavedContent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AutopilotJob -> Client
ALTER TABLE "AutopilotJob" ADD CONSTRAINT "AutopilotJob_clientId_fkey" 
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AutopilotSchedule -> Client
ALTER TABLE "AutopilotSchedule" ADD CONSTRAINT "AutopilotSchedule_clientId_fkey" 
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AutopilotSchedule -> Project
ALTER TABLE "AutopilotSchedule" ADD CONSTRAINT "AutopilotSchedule_projectId_fkey" 
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreditTransaction -> Client
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_clientId_fkey" 
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreditPurchase -> Client
ALTER TABLE "CreditPurchase" ADD CONSTRAINT "CreditPurchase_clientId_fkey" 
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Conversation -> Client
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_clientId_fkey" 
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ChatMessage -> Conversation
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" 
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Video -> Client
ALTER TABLE "Video" ADD CONSTRAINT "Video_clientId_fkey" 
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Video -> User
ALTER TABLE "Video" ADD CONSTRAINT "Video_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updatedAt column
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_updated_at BEFORE UPDATE ON "Client" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_updated_at BEFORE UPDATE ON "Project" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_content_updated_at BEFORE UPDATE ON "SavedContent" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_article_idea_updated_at BEFORE UPDATE ON "ArticleIdea" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_autopilot_job_updated_at BEFORE UPDATE ON "AutopilotJob" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_autopilot_schedule_updated_at BEFORE UPDATE ON "AutopilotSchedule" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credit_package_updated_at BEFORE UPDATE ON "CreditPackage" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversation_updated_at BEFORE UPDATE ON "Conversation" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_updated_at BEFORE UPDATE ON "Video" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_post_updated_at BEFORE UPDATE ON "BlogPost" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SavedContent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ArticleIdea" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AutopilotJob" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AutopilotSchedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditPurchase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Video" ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS, so server-side operations work without issues
-- Client-side operations respect these policies

-- =====================================================
-- CLIENT TABLE POLICIES
-- =====================================================

-- Clients can view and update their own data
CREATE POLICY "Clients can view own data" ON "Client"
  FOR SELECT USING (
    auth.uid()::text = id 
    OR auth.jwt() ->> 'role' = 'admin'
    OR auth.jwt() ->> 'role' = 'superadmin'
  );

CREATE POLICY "Clients can update own data" ON "Client"
  FOR UPDATE USING (
    auth.uid()::text = id 
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- =====================================================
-- PROJECT TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can view own projects" ON "Project"
  FOR SELECT USING (
    "clientId" = auth.uid()::text 
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can insert own projects" ON "Project"
  FOR INSERT WITH CHECK (
    "clientId" = auth.uid()::text
  );

CREATE POLICY "Users can update own projects" ON "Project"
  FOR UPDATE USING (
    "clientId" = auth.uid()::text 
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can delete own projects" ON "Project"
  FOR DELETE USING (
    "clientId" = auth.uid()::text
  );

-- =====================================================
-- SAVED CONTENT TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can view own content" ON "SavedContent"
  FOR SELECT USING (
    "clientId" = auth.uid()::text 
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can insert own content" ON "SavedContent"
  FOR INSERT WITH CHECK (
    "clientId" = auth.uid()::text
  );

CREATE POLICY "Users can update own content" ON "SavedContent"
  FOR UPDATE USING (
    "clientId" = auth.uid()::text 
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can delete own content" ON "SavedContent"
  FOR DELETE USING (
    "clientId" = auth.uid()::text
  );

-- =====================================================
-- ARTICLE IDEA TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can view own article ideas" ON "ArticleIdea"
  FOR SELECT USING (
    "clientId" = auth.uid()::text 
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can insert own article ideas" ON "ArticleIdea"
  FOR INSERT WITH CHECK (
    "clientId" = auth.uid()::text
  );

CREATE POLICY "Users can update own article ideas" ON "ArticleIdea"
  FOR UPDATE USING (
    "clientId" = auth.uid()::text 
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can delete own article ideas" ON "ArticleIdea"
  FOR DELETE USING (
    "clientId" = auth.uid()::text
  );

-- =====================================================
-- AUTOPILOT JOB TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can view own autopilot jobs" ON "AutopilotJob"
  FOR SELECT USING (
    "clientId" = auth.uid()::text 
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can insert own autopilot jobs" ON "AutopilotJob"
  FOR INSERT WITH CHECK (
    "clientId" = auth.uid()::text
  );

CREATE POLICY "Users can update own autopilot jobs" ON "AutopilotJob"
  FOR UPDATE USING (
    "clientId" = auth.uid()::text 
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- =====================================================
-- AUTOPILOT SCHEDULE TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can view own schedules" ON "AutopilotSchedule"
  FOR SELECT USING (
    "clientId" = auth.uid()::text 
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can manage own schedules" ON "AutopilotSchedule"
  FOR ALL USING (
    "clientId" = auth.uid()::text 
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- =====================================================
-- CREDIT TRANSACTION TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can view own transactions" ON "CreditTransaction"
  FOR SELECT USING (
    "clientId" = auth.uid()::text 
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- Only service role can insert transactions (server-side only)

-- =====================================================
-- CREDIT PURCHASE TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can view own purchases" ON "CreditPurchase"
  FOR SELECT USING (
    "clientId" = auth.uid()::text 
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- =====================================================
-- CONVERSATION TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can view own conversations" ON "Conversation"
  FOR SELECT USING (
    "clientId" = auth.uid()::text 
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can manage own conversations" ON "Conversation"
  FOR ALL USING (
    "clientId" = auth.uid()::text
  );

-- =====================================================
-- CHAT MESSAGE TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can view messages in own conversations" ON "ChatMessage"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Conversation" c 
      WHERE c.id = "conversationId" 
      AND (c."clientId" = auth.uid()::text OR auth.jwt() ->> 'role' = 'admin')
    )
  );

CREATE POLICY "Users can insert messages in own conversations" ON "ChatMessage"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Conversation" c 
      WHERE c.id = "conversationId" 
      AND c."clientId" = auth.uid()::text
    )
  );

-- =====================================================
-- VIDEO TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can view own videos" ON "Video"
  FOR SELECT USING (
    "clientId" = auth.uid()::text 
    OR "userId" = auth.uid()::text
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can manage own videos" ON "Video"
  FOR ALL USING (
    "clientId" = auth.uid()::text 
    OR "userId" = auth.uid()::text
  );

-- =====================================================
-- PUBLIC TABLES (No RLS needed)
-- =====================================================

-- BlogPost is public content - no RLS needed for SELECT
-- User table is for admin users only - managed by service role

-- Note: These policies assume you're using Supabase Auth with auth.uid()
-- If using a different auth mechanism, adjust the policies accordingly
