-- =====================================================
-- AUTOPILOT CONTENT SYSTEM
-- Automatisch contentplan en posting
-- Created: 2025-12-13
-- =====================================================

-- =====================================================
-- 1. UPDATE PROJECT TABLE FOR WORDPRESS CREDENTIALS
-- =====================================================
-- Already exists in base tables, but ensure these columns exist
DO $$
BEGIN
  -- Add WordPress credentials if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Project' AND column_name = 'wordpressUrl') THEN
    ALTER TABLE "Project" ADD COLUMN "wordpressUrl" TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Project' AND column_name = 'wordpressUsername') THEN
    ALTER TABLE "Project" ADD COLUMN "wordpressUsername" TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Project' AND column_name = 'wordpressPassword') THEN
    ALTER TABLE "Project" ADD COLUMN "wordpressPassword" TEXT;
  END IF;
END $$;

-- =====================================================
-- 2. CONTENTPLAN TABLE (30-DAGEN PLANNEN)
-- =====================================================
CREATE TABLE IF NOT EXISTS "ContentPlan" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  "status" TEXT DEFAULT 'active', -- active, paused, completed
  "blogPostsPerWeek" INTEGER DEFAULT 4,
  "socialPostsPerDay" INTEGER DEFAULT 2,
  "niche" TEXT,
  "targetAudience" TEXT,
  "contentThemes" TEXT[],
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "ContentPlan_projectId_idx" ON "ContentPlan"("projectId");
CREATE INDEX IF NOT EXISTS "ContentPlan_status_idx" ON "ContentPlan"("status");
CREATE INDEX IF NOT EXISTS "ContentPlan_dates_idx" ON "ContentPlan"("startDate", "endDate");

-- =====================================================
-- 3. AUTOPILOT LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "AutopilotLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "action" TEXT NOT NULL, -- blog_published, social_published, blog_generated, social_generated, error
  "status" TEXT NOT NULL, -- success, error, warning
  "details" JSONB,
  "errorMessage" TEXT,
  "postId" TEXT, -- BlogPost.id or SocialMediaPost.id
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "AutopilotLog_projectId_idx" ON "AutopilotLog"("projectId");
CREATE INDEX IF NOT EXISTS "AutopilotLog_createdAt_idx" ON "AutopilotLog"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AutopilotLog_status_idx" ON "AutopilotLog"("status");
CREATE INDEX IF NOT EXISTS "AutopilotLog_action_idx" ON "AutopilotLog"("action");

-- =====================================================
-- 4. UPDATE BLOGPOST TABLE
-- =====================================================
DO $$
BEGIN
  -- Add scheduledAt if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'BlogPost' AND column_name = 'scheduledAt') THEN
    ALTER TABLE "BlogPost" ADD COLUMN "scheduledAt" TIMESTAMP;
  END IF;
  
  -- Ensure publishedAt exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'BlogPost' AND column_name = 'publishedAt') THEN
    ALTER TABLE "BlogPost" ADD COLUMN "publishedAt" TIMESTAMP;
  END IF;
  
  -- Add wordpressId if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'BlogPost' AND column_name = 'wordpressId') THEN
    ALTER TABLE "BlogPost" ADD COLUMN "wordpressId" TEXT;
  END IF;
  
  -- Add contentPlanId for linking to 30-day plans
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'BlogPost' AND column_name = 'contentPlanId') THEN
    ALTER TABLE "BlogPost" ADD COLUMN "contentPlanId" TEXT REFERENCES "ContentPlan"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "BlogPost_scheduledAt_idx" ON "BlogPost"("scheduledAt");
CREATE INDEX IF NOT EXISTS "BlogPost_status_scheduled_idx" ON "BlogPost"("status") WHERE "status" = 'scheduled';
CREATE INDEX IF NOT EXISTS "BlogPost_contentPlanId_idx" ON "BlogPost"("contentPlanId");

-- =====================================================
-- 5. UPDATE SOCIALMEDIAPOST TABLE
-- =====================================================
DO $$
BEGIN
  -- Add scheduledAt if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'SocialMediaPost' AND column_name = 'scheduledAt') THEN
    ALTER TABLE "SocialMediaPost" ADD COLUMN "scheduledAt" TIMESTAMP;
  END IF;
  
  -- Add publishedAt if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'SocialMediaPost' AND column_name = 'publishedAt') THEN
    ALTER TABLE "SocialMediaPost" ADD COLUMN "publishedAt" TIMESTAMP;
  END IF;
  
  -- Add getlatePostId if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'SocialMediaPost' AND column_name = 'getlatePostId') THEN
    ALTER TABLE "SocialMediaPost" ADD COLUMN "getlatePostId" TEXT;
  END IF;
  
  -- Add contentPlanId for linking to 30-day plans
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'SocialMediaPost' AND column_name = 'contentPlanId') THEN
    ALTER TABLE "SocialMediaPost" ADD COLUMN "contentPlanId" TEXT REFERENCES "ContentPlan"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "SocialMediaPost_scheduledAt_idx" ON "SocialMediaPost"("scheduledAt");
CREATE INDEX IF NOT EXISTS "SocialMediaPost_status_scheduled_idx" ON "SocialMediaPost"("status") WHERE "status" = 'scheduled';
CREATE INDEX IF NOT EXISTS "SocialMediaPost_contentPlanId_idx" ON "SocialMediaPost"("contentPlanId");

-- =====================================================
-- 6. UPDATE AUTOPILOTCONFIG TABLE
-- =====================================================
-- The AutopilotConfig table already exists from social_media_pipeline.sql
-- Add any missing columns
DO $$
BEGIN
  -- Add projectId if not exists (for multi-project support)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'AutopilotConfig' AND column_name = 'projectId') THEN
    ALTER TABLE "AutopilotConfig" ADD COLUMN "projectId" TEXT REFERENCES "Project"("id") ON DELETE CASCADE;
  END IF;
  
  -- Add contentPlanId for linking to 30-day plans
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'AutopilotConfig' AND column_name = 'contentPlanId') THEN
    ALTER TABLE "AutopilotConfig" ADD COLUMN "contentPlanId" TEXT REFERENCES "ContentPlan"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "AutopilotConfig_projectId_idx" ON "AutopilotConfig"("projectId");
CREATE INDEX IF NOT EXISTS "AutopilotConfig_contentPlanId_idx" ON "AutopilotConfig"("contentPlanId");

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================
ALTER TABLE "ContentPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AutopilotLog" ENABLE ROW LEVEL SECURITY;

-- ContentPlan admin policy
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ContentPlan' AND policyname = 'admin_full_access'
  ) THEN
    CREATE POLICY "admin_full_access" ON "ContentPlan"
      FOR ALL 
      USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'email' = 'info@writgo.nl');
  END IF;
END $$;

-- AutopilotLog admin policy
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'AutopilotLog' AND policyname = 'admin_full_access'
  ) THEN
    CREATE POLICY "admin_full_access" ON "AutopilotLog"
      FOR ALL 
      USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'email' = 'info@writgo.nl');
  END IF;
END $$;

-- =====================================================
-- 8. TRIGGERS FOR UPDATED TIMESTAMPS
-- =====================================================
CREATE OR REPLACE FUNCTION update_contentplan_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trigger_update_contentplan_timestamp" ON "ContentPlan";
CREATE TRIGGER "trigger_update_contentplan_timestamp"
  BEFORE UPDATE ON "ContentPlan"
  FOR EACH ROW
  EXECUTE FUNCTION update_contentplan_timestamp();

-- =====================================================
-- 9. HELPER FUNCTIONS
-- =====================================================

-- Function to get scheduled posts for today
CREATE OR REPLACE FUNCTION get_scheduled_posts_today(p_project_id TEXT)
RETURNS TABLE (
  post_id TEXT,
  post_type TEXT,
  title TEXT,
  scheduled_at TIMESTAMP,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    "id" as post_id,
    'blog' as post_type,
    "title",
    "scheduledAt" as scheduled_at,
    "status"
  FROM "BlogPost"
  WHERE "projectId" = p_project_id
    AND "status" = 'scheduled'
    AND DATE("scheduledAt") = CURRENT_DATE
  UNION ALL
  SELECT 
    "id" as post_id,
    'social' as post_type,
    "content" as title,
    "scheduledAt" as scheduled_at,
    "status"
  FROM "SocialMediaPost"
  WHERE "strategyId" IN (
    SELECT "id" FROM "SocialMediaStrategy" WHERE "clientId" IN (
      SELECT "clientId" FROM "Project" WHERE "id" = p_project_id
    )
  )
    AND "status" = 'scheduled'
    AND DATE("scheduledAt") = CURRENT_DATE
  ORDER BY scheduled_at;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. VERIFICATION
-- =====================================================
DO $$ 
BEGIN
  RAISE NOTICE '✅ Autopilot system migration completed successfully!';
  RAISE NOTICE 'Tables: ContentPlan, AutopilotLog created/updated';
  RAISE NOTICE 'Updated: BlogPost, SocialMediaPost, AutopilotConfig with scheduling fields';
  RAISE NOTICE 'Helper function: get_scheduled_posts_today() available';
END $$;
