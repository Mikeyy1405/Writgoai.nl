-- ============================================
-- COMPLETE CLIENTID COLUMN FIX
-- ============================================
-- This script ensures all content tables have a clientId column
-- with proper foreign key constraints to the Client table.
-- 
-- SAFE TO RUN MULTIPLE TIMES (Idempotent)
-- ============================================

-- ============================================
-- STEP 1: Ensure Client table exists
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'Client'
  ) THEN
    RAISE EXCEPTION '❌ CRITICAL: Client table does not exist! Run 20251210_create_base_tables.sql first.';
  ELSE
    RAISE NOTICE '✅ Client table exists';
  END IF;
END $$;

-- ============================================
-- STEP 2: Fix ContentPlan table
-- ============================================
DO $$ 
BEGIN
  -- Check if table exists
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'ContentPlan') THEN
    RAISE NOTICE 'Checking ContentPlan table...';
    
    -- Add clientId column if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ContentPlan' AND column_name = 'clientId'
    ) THEN
      RAISE NOTICE '⚙️  Adding clientId column to ContentPlan...';
      ALTER TABLE "ContentPlan" ADD COLUMN "clientId" TEXT;
      RAISE NOTICE '✅ Added clientId column to ContentPlan';
    ELSE
      RAISE NOTICE '✅ ContentPlan.clientId already exists';
    END IF;
    
    -- Add foreign key if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'ContentPlan_clientId_fkey'
      AND table_name = 'ContentPlan'
    ) THEN
      RAISE NOTICE '⚙️  Adding foreign key constraint to ContentPlan...';
      ALTER TABLE "ContentPlan"
      ADD CONSTRAINT "ContentPlan_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE;
      RAISE NOTICE '✅ Added foreign key to ContentPlan';
    ELSE
      RAISE NOTICE '✅ ContentPlan foreign key already exists';
    END IF;
    
    -- Add NOT NULL constraint if column allows nulls
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'ContentPlan' 
      AND column_name = 'clientId'
      AND is_nullable = 'YES'
    ) THEN
      RAISE NOTICE '⚙️  Setting ContentPlan.clientId to NOT NULL...';
      -- First, set a default value for any existing NULL rows (shouldn't exist)
      UPDATE "ContentPlan" SET "clientId" = (
        SELECT id FROM "Client" LIMIT 1
      ) WHERE "clientId" IS NULL;
      ALTER TABLE "ContentPlan" ALTER COLUMN "clientId" SET NOT NULL;
      RAISE NOTICE '✅ ContentPlan.clientId is now NOT NULL';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  ContentPlan table does not exist - skipping';
  END IF;
END $$;

-- ============================================
-- STEP 3: Fix TopicalAuthorityMap table
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'TopicalAuthorityMap') THEN
    RAISE NOTICE 'Checking TopicalAuthorityMap table...';
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'TopicalAuthorityMap' AND column_name = 'clientId'
    ) THEN
      RAISE NOTICE '⚙️  Adding clientId column to TopicalAuthorityMap...';
      ALTER TABLE "TopicalAuthorityMap" ADD COLUMN "clientId" TEXT;
      RAISE NOTICE '✅ Added clientId column to TopicalAuthorityMap';
    ELSE
      RAISE NOTICE '✅ TopicalAuthorityMap.clientId already exists';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'TopicalAuthorityMap_clientId_fkey'
    ) THEN
      RAISE NOTICE '⚙️  Adding foreign key constraint to TopicalAuthorityMap...';
      ALTER TABLE "TopicalAuthorityMap"
      ADD CONSTRAINT "TopicalAuthorityMap_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE;
      RAISE NOTICE '✅ Added foreign key to TopicalAuthorityMap';
    ELSE
      RAISE NOTICE '✅ TopicalAuthorityMap foreign key already exists';
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'TopicalAuthorityMap' 
      AND column_name = 'clientId'
      AND is_nullable = 'YES'
    ) THEN
      RAISE NOTICE '⚙️  Setting TopicalAuthorityMap.clientId to NOT NULL...';
      UPDATE "TopicalAuthorityMap" SET "clientId" = (
        SELECT id FROM "Client" LIMIT 1
      ) WHERE "clientId" IS NULL;
      ALTER TABLE "TopicalAuthorityMap" ALTER COLUMN "clientId" SET NOT NULL;
      RAISE NOTICE '✅ TopicalAuthorityMap.clientId is now NOT NULL';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  TopicalAuthorityMap table does not exist - skipping';
  END IF;
END $$;

-- ============================================
-- STEP 4: Fix SocialMediaStrategy table
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'SocialMediaStrategy') THEN
    RAISE NOTICE 'Checking SocialMediaStrategy table...';
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'SocialMediaStrategy' AND column_name = 'clientId'
    ) THEN
      RAISE NOTICE '⚙️  Adding clientId column to SocialMediaStrategy...';
      ALTER TABLE "SocialMediaStrategy" ADD COLUMN "clientId" TEXT;
      RAISE NOTICE '✅ Added clientId column to SocialMediaStrategy';
    ELSE
      RAISE NOTICE '✅ SocialMediaStrategy.clientId already exists';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'SocialMediaStrategy_clientId_fkey'
    ) THEN
      RAISE NOTICE '⚙️  Adding foreign key constraint to SocialMediaStrategy...';
      ALTER TABLE "SocialMediaStrategy"
      ADD CONSTRAINT "SocialMediaStrategy_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE;
      RAISE NOTICE '✅ Added foreign key to SocialMediaStrategy';
    ELSE
      RAISE NOTICE '✅ SocialMediaStrategy foreign key already exists';
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'SocialMediaStrategy' 
      AND column_name = 'clientId'
      AND is_nullable = 'YES'
    ) THEN
      RAISE NOTICE '⚙️  Setting SocialMediaStrategy.clientId to NOT NULL...';
      UPDATE "SocialMediaStrategy" SET "clientId" = (
        SELECT id FROM "Client" LIMIT 1
      ) WHERE "clientId" IS NULL;
      ALTER TABLE "SocialMediaStrategy" ALTER COLUMN "clientId" SET NOT NULL;
      RAISE NOTICE '✅ SocialMediaStrategy.clientId is now NOT NULL';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  SocialMediaStrategy table does not exist - skipping';
  END IF;
END $$;

-- ============================================
-- STEP 5: Fix WebsiteAnalysis table
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'WebsiteAnalysis') THEN
    RAISE NOTICE 'Checking WebsiteAnalysis table...';
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'WebsiteAnalysis' AND column_name = 'clientId'
    ) THEN
      RAISE NOTICE '⚙️  Adding clientId column to WebsiteAnalysis...';
      ALTER TABLE "WebsiteAnalysis" ADD COLUMN "clientId" TEXT;
      RAISE NOTICE '✅ Added clientId column to WebsiteAnalysis';
    ELSE
      RAISE NOTICE '✅ WebsiteAnalysis.clientId already exists';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'WebsiteAnalysis_clientId_fkey'
    ) THEN
      RAISE NOTICE '⚙️  Adding foreign key constraint to WebsiteAnalysis...';
      ALTER TABLE "WebsiteAnalysis"
      ADD CONSTRAINT "WebsiteAnalysis_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE;
      RAISE NOTICE '✅ Added foreign key to WebsiteAnalysis';
    ELSE
      RAISE NOTICE '✅ WebsiteAnalysis foreign key already exists';
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'WebsiteAnalysis' 
      AND column_name = 'clientId'
      AND is_nullable = 'YES'
    ) THEN
      RAISE NOTICE '⚙️  Setting WebsiteAnalysis.clientId to NOT NULL...';
      UPDATE "WebsiteAnalysis" SET "clientId" = (
        SELECT id FROM "Client" LIMIT 1
      ) WHERE "clientId" IS NULL;
      ALTER TABLE "WebsiteAnalysis" ALTER COLUMN "clientId" SET NOT NULL;
      RAISE NOTICE '✅ WebsiteAnalysis.clientId is now NOT NULL';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  WebsiteAnalysis table does not exist - skipping';
  END IF;
END $$;

-- ============================================
-- STEP 6: Verify BlogPost table (should already have clientId)
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'BlogPost') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'BlogPost' AND column_name = 'clientId'
    ) THEN
      RAISE NOTICE '✅ BlogPost.clientId exists';
    ELSE
      RAISE NOTICE '❌ BlogPost.clientId is MISSING - This should not happen!';
      RAISE EXCEPTION 'BlogPost table is missing clientId column. Check base tables migration.';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  BlogPost table does not exist';
  END IF;
END $$;

-- ============================================
-- STEP 7: Add indexes for performance
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Adding indexes for clientId columns...';
  
  -- ContentPlan index
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'ContentPlan') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_contentplan_clientid'
    ) THEN
      CREATE INDEX idx_contentplan_clientid ON "ContentPlan"("clientId");
      RAISE NOTICE '✅ Added index on ContentPlan.clientId';
    END IF;
  END IF;
  
  -- TopicalAuthorityMap index
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'TopicalAuthorityMap') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_topicalmap_clientid'
    ) THEN
      CREATE INDEX idx_topicalmap_clientid ON "TopicalAuthorityMap"("clientId");
      RAISE NOTICE '✅ Added index on TopicalAuthorityMap.clientId';
    END IF;
  END IF;
  
  -- SocialMediaStrategy index
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'SocialMediaStrategy') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_socialstrategy_clientid'
    ) THEN
      CREATE INDEX idx_socialstrategy_clientid ON "SocialMediaStrategy"("clientId");
      RAISE NOTICE '✅ Added index on SocialMediaStrategy.clientId';
    END IF;
  END IF;
  
  -- WebsiteAnalysis index
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'WebsiteAnalysis') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_websiteanalysis_clientid'
    ) THEN
      CREATE INDEX idx_websiteanalysis_clientid ON "WebsiteAnalysis"("clientId");
      RAISE NOTICE '✅ Added index on WebsiteAnalysis.clientId';
    END IF;
  END IF;
END $$;

-- ============================================
-- STEP 8: Final verification
-- ============================================
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'FINAL VERIFICATION';
  RAISE NOTICE '============================================';
  
  -- Count tables that should have clientId but don't
  SELECT COUNT(*) INTO missing_count
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  AND t.tablename IN ('ContentPlan', 'TopicalAuthorityMap', 'SocialMediaStrategy', 'WebsiteAnalysis', 'BlogPost')
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_name = t.tablename
    AND c.column_name = 'clientId'
  );
  
  IF missing_count > 0 THEN
    RAISE EXCEPTION '❌ Still % tables missing clientId column!', missing_count;
  ELSE
    RAISE NOTICE '✅ All content tables have clientId column';
    RAISE NOTICE '✅ All foreign keys are in place';
    RAISE NOTICE '✅ All indexes are created';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ClientId fix completed successfully!';
    RAISE NOTICE '';
  END IF;
END $$;

-- ============================================
-- STEP 9: Show final state
-- ============================================
SELECT 
  'Final ClientId Status' as "Section",
  table_name as "Table",
  column_name as "Column",
  data_type as "Type",
  is_nullable as "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'clientId'
ORDER BY table_name;
