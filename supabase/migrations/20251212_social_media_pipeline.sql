-- Social Media Pipeline Tables Migration
-- Created: 2025-12-12
-- Purpose: Enable social media content planning and automation

-- =====================================================
-- TABLE: SocialMediaStrategy
-- Purpose: Store social media content strategies
-- =====================================================
CREATE TABLE IF NOT EXISTS "SocialMediaStrategy" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "clientId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "niche" TEXT NOT NULL,
  "targetAudience" TEXT NOT NULL,
  "totalPosts" INTEGER NOT NULL DEFAULT 100,
  "platforms" JSONB NOT NULL DEFAULT '[]', -- ["linkedin", "instagram", "facebook", "twitter"]
  "period" TEXT NOT NULL DEFAULT '3-months', -- 1-month, 3-months, 6-months, 1-year
  "postingFrequency" JSONB NOT NULL DEFAULT '{}', -- {"linkedin": 3, "instagram": 5} per week
  "contentTypes" TEXT[] DEFAULT ARRAY[]::TEXT[], -- educational, promotional, engagement
  "tone" TEXT DEFAULT 'professional',
  "language" TEXT DEFAULT 'NL',
  "status" TEXT NOT NULL DEFAULT 'planning', -- planning, generating, completed, paused
  "progress" INTEGER DEFAULT 0, -- 0-100%
  "autopilotEnabled" BOOLEAN DEFAULT FALSE,
  "autopilotConfig" JSONB, -- {frequency, time, weekdays, maxPerDay}
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  CONSTRAINT "fk_social_strategy_client" FOREIGN KEY ("clientId") REFERENCES "Client"(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE: SocialMediaPost
-- Purpose: Store individual social media posts
-- =====================================================
CREATE TABLE IF NOT EXISTS "SocialMediaPost" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "strategyId" TEXT NOT NULL,
  "platform" TEXT NOT NULL, -- linkedin, instagram, facebook, twitter, tiktok
  "title" TEXT,
  "content" TEXT NOT NULL,
  "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[], -- images/videos
  "scheduledDate" TIMESTAMP,
  "status" TEXT DEFAULT 'pending', -- pending, scheduled, posted, failed
  "externalPostId" TEXT, -- ID from Later.com or Buffer
  "engagement" JSONB DEFAULT '{}', -- {likes, comments, shares, views}
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "publishedAt" TIMESTAMP,
  CONSTRAINT "fk_social_post_strategy" FOREIGN KEY ("strategyId") REFERENCES "SocialMediaStrategy"(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE: AutopilotConfig
-- Purpose: Store autopilot configurations for both blog and social
-- =====================================================
CREATE TABLE IF NOT EXISTS "AutopilotConfig" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "clientId" TEXT NOT NULL,
  "type" TEXT NOT NULL, -- blog, social
  "planId" TEXT NOT NULL, -- TopicalAuthorityMap.id or SocialMediaStrategy.id
  "enabled" BOOLEAN DEFAULT FALSE,
  "frequency" TEXT DEFAULT '3x-week', -- daily, 3x-week, 2x-week, weekly
  "time" TEXT DEFAULT '09:00', -- HH:MM format
  "weekdays" INTEGER[] DEFAULT ARRAY[]::INTEGER[], -- [1,3,5] for Mon,Wed,Fri
  "maxPerDay" INTEGER DEFAULT 1,
  "autoPublish" BOOLEAN DEFAULT TRUE,
  "lastRun" TIMESTAMP,
  "nextRun" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  CONSTRAINT "fk_autopilot_client" FOREIGN KEY ("clientId") REFERENCES "Client"(id) ON DELETE CASCADE,
  CONSTRAINT "unique_autopilot_plan" UNIQUE ("type", "planId")
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- SocialMediaStrategy indexes
CREATE INDEX IF NOT EXISTS "idx_social_strategy_client" ON "SocialMediaStrategy"("clientId");
CREATE INDEX IF NOT EXISTS "idx_social_strategy_status" ON "SocialMediaStrategy"("status");
CREATE INDEX IF NOT EXISTS "idx_social_strategy_created" ON "SocialMediaStrategy"("createdAt" DESC);

-- SocialMediaPost indexes
CREATE INDEX IF NOT EXISTS "idx_social_post_strategy" ON "SocialMediaPost"("strategyId");
CREATE INDEX IF NOT EXISTS "idx_social_post_platform" ON "SocialMediaPost"("platform");
CREATE INDEX IF NOT EXISTS "idx_social_post_status" ON "SocialMediaPost"("status");
CREATE INDEX IF NOT EXISTS "idx_social_post_scheduled" ON "SocialMediaPost"("scheduledDate");
CREATE INDEX IF NOT EXISTS "idx_social_post_created" ON "SocialMediaPost"("createdAt" DESC);

-- AutopilotConfig indexes
CREATE INDEX IF NOT EXISTS "idx_autopilot_client" ON "AutopilotConfig"("clientId");
CREATE INDEX IF NOT EXISTS "idx_autopilot_type_plan" ON "AutopilotConfig"("type", "planId");
CREATE INDEX IF NOT EXISTS "idx_autopilot_enabled" ON "AutopilotConfig"("enabled");
CREATE INDEX IF NOT EXISTS "idx_autopilot_next_run" ON "AutopilotConfig"("nextRun") WHERE "enabled" = TRUE;

-- =====================================================
-- TRIGGERS for Updated Timestamps
-- =====================================================

-- SocialMediaStrategy trigger
CREATE OR REPLACE FUNCTION update_social_strategy_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trigger_update_social_strategy_timestamp" ON "SocialMediaStrategy";
CREATE TRIGGER "trigger_update_social_strategy_timestamp"
  BEFORE UPDATE ON "SocialMediaStrategy"
  FOR EACH ROW
  EXECUTE FUNCTION update_social_strategy_timestamp();

-- AutopilotConfig trigger
CREATE OR REPLACE FUNCTION update_autopilot_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trigger_update_autopilot_timestamp" ON "AutopilotConfig";
CREATE TRIGGER "trigger_update_autopilot_timestamp"
  BEFORE UPDATE ON "AutopilotConfig"
  FOR EACH ROW
  EXECUTE FUNCTION update_autopilot_timestamp();

-- =====================================================
-- RLS POLICIES (Admin only access)
-- =====================================================

-- Enable RLS
ALTER TABLE "SocialMediaStrategy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialMediaPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AutopilotConfig" ENABLE ROW LEVEL SECURITY;

-- Admin full access policies
DO $$ 
BEGIN
  -- SocialMediaStrategy admin policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'SocialMediaStrategy' AND policyname = 'admin_full_access'
  ) THEN
    CREATE POLICY "admin_full_access" ON "SocialMediaStrategy"
      FOR ALL 
      USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'email' = 'info@writgo.nl');
  END IF;

  -- SocialMediaPost admin policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'SocialMediaPost' AND policyname = 'admin_full_access'
  ) THEN
    CREATE POLICY "admin_full_access" ON "SocialMediaPost"
      FOR ALL 
      USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'email' = 'info@writgo.nl');
  END IF;

  -- AutopilotConfig admin policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'AutopilotConfig' AND policyname = 'admin_full_access'
  ) THEN
    CREATE POLICY "admin_full_access" ON "AutopilotConfig"
      FOR ALL 
      USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'email' = 'info@writgo.nl');
  END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check tables exist
SELECT 
  'SocialMediaStrategy' as table_name,
  COUNT(*) as row_count
FROM "SocialMediaStrategy"
UNION ALL
SELECT 
  'SocialMediaPost' as table_name,
  COUNT(*) as row_count
FROM "SocialMediaPost"
UNION ALL
SELECT 
  'AutopilotConfig' as table_name,
  COUNT(*) as row_count
FROM "AutopilotConfig";

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE 'Social Media Pipeline migration completed successfully!';
  RAISE NOTICE 'Tables created: SocialMediaStrategy, SocialMediaPost, AutopilotConfig';
  RAISE NOTICE 'Indexes, triggers, and RLS policies configured.';
END $$;
