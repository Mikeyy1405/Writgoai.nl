-- WordPress Autopilot System Database Schema
-- Migration: 20241216000000_wordpress_autopilot

-- Create WordPressAutopilotSite table
CREATE TABLE IF NOT EXISTS "WordPressAutopilotSite" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "clientId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "siteUrl" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "applicationPassword" TEXT NOT NULL,
  "niche" TEXT,
  "language" TEXT DEFAULT 'nl',
  "postingFrequency" TEXT NOT NULL DEFAULT 'weekly',
  "contentTypes" JSONB DEFAULT '["article", "guide", "how-to"]'::jsonb,
  "status" TEXT NOT NULL DEFAULT 'active',
  "lastPostDate" TIMESTAMP,
  "nextPostDate" TIMESTAMP,
  "totalPosts" INTEGER NOT NULL DEFAULT 0,
  "averageViews" INTEGER,
  "topicalAuthorityScore" INTEGER,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "fk_client" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE
);

-- Create ContentStrategy table
CREATE TABLE IF NOT EXISTS "ContentStrategy" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "siteId" TEXT NOT NULL,
  "niche" TEXT NOT NULL,
  "mainTopics" JSONB DEFAULT '[]'::jsonb,
  "subtopics" JSONB DEFAULT '{}'::jsonb,
  "keywordClusters" JSONB DEFAULT '[]'::jsonb,
  "contentCalendar" JSONB DEFAULT '[]'::jsonb,
  "topicalAuthorityGoal" INTEGER DEFAULT 80,
  "currentCoverage" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "fk_site" FOREIGN KEY ("siteId") REFERENCES "WordPressAutopilotSite"("id") ON DELETE CASCADE
);

-- Create ContentCalendarItem table
CREATE TABLE IF NOT EXISTS "ContentCalendarItem" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "siteId" TEXT NOT NULL,
  "strategyId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "focusKeyword" TEXT NOT NULL,
  "secondaryKeywords" JSONB DEFAULT '[]'::jsonb,
  "contentType" TEXT NOT NULL DEFAULT 'article',
  "topic" TEXT NOT NULL,
  "subtopic" TEXT,
  "scheduledDate" TIMESTAMP NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "contentId" TEXT,
  "wordpressPostId" INTEGER,
  "publishedUrl" TEXT,
  "generatedAt" TIMESTAMP,
  "publishedAt" TIMESTAMP,
  "error" TEXT,
  CONSTRAINT "fk_site_calendar" FOREIGN KEY ("siteId") REFERENCES "WordPressAutopilotSite"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_strategy" FOREIGN KEY ("strategyId") REFERENCES "ContentStrategy"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_content" FOREIGN KEY ("contentId") REFERENCES "SavedContent"("id") ON DELETE SET NULL
);

-- Create AutopilotSettings table
CREATE TABLE IF NOT EXISTS "AutopilotSettings" (
  "siteId" TEXT NOT NULL PRIMARY KEY,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "postingFrequency" TEXT NOT NULL DEFAULT 'weekly',
  "preferredPostingTime" TEXT,
  "contentLength" TEXT DEFAULT 'auto',
  "includeImages" BOOLEAN DEFAULT true,
  "includeFAQ" BOOLEAN DEFAULT true,
  "includeYouTube" BOOLEAN DEFAULT false,
  "autoPublish" BOOLEAN DEFAULT true,
  "notifications" JSONB DEFAULT '{"onPublish": true, "onError": true}'::jsonb,
  CONSTRAINT "fk_site_settings" FOREIGN KEY ("siteId") REFERENCES "WordPressAutopilotSite"("id") ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_autopilot_site_client" ON "WordPressAutopilotSite"("clientId");
CREATE INDEX IF NOT EXISTS "idx_autopilot_site_status" ON "WordPressAutopilotSite"("status");
CREATE INDEX IF NOT EXISTS "idx_content_strategy_site" ON "ContentStrategy"("siteId");
CREATE INDEX IF NOT EXISTS "idx_calendar_site" ON "ContentCalendarItem"("siteId");
CREATE INDEX IF NOT EXISTS "idx_calendar_status" ON "ContentCalendarItem"("status");
CREATE INDEX IF NOT EXISTS "idx_calendar_scheduled" ON "ContentCalendarItem"("scheduledDate");
CREATE INDEX IF NOT EXISTS "idx_calendar_content" ON "ContentCalendarItem"("contentId");

-- Add comments for documentation
COMMENT ON TABLE "WordPressAutopilotSite" IS 'WordPress sites configured for automatic content generation';
COMMENT ON TABLE "ContentStrategy" IS 'Topical authority content strategies for each site';
COMMENT ON TABLE "ContentCalendarItem" IS 'Scheduled content items with generation and publishing status';
COMMENT ON TABLE "AutopilotSettings" IS 'Autopilot configuration settings per site';
