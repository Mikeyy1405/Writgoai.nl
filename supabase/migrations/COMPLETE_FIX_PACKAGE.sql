-- ============================================
-- COMPLETE FIX VOOR FOREIGN KEY ISSUES
-- ============================================
-- Dit script lost ALLE foreign key problemen op in één keer:
-- 1. Cleanup orphaned data
-- 2. Fix invalid references
-- 3. Voeg ontbrekende foreign keys toe
-- 4. Verificatie
--
-- RUN DIT IN SUPABASE SQL EDITOR
--
-- Auteur: WritgoAI Team
-- Datum: 12 December 2024
-- ============================================

-- Enable extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- STAP 1: INITIAL DIAGNOSTICS
-- ============================================
SELECT '🔍 STAP 1: Initial Diagnostics' as status;

-- Check if BlogPost table exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'BlogPost'
  ) THEN
    RAISE EXCEPTION 'CRITICAL: BlogPost table does not exist! Please run COMPLETE_MIGRATION_PACKAGE.sql first.';
  END IF;
  
  RAISE NOTICE '✅ BlogPost table exists';
END $$;

-- Show current foreign key count
SELECT 
  '📊 Current Foreign Key Count' as info,
  COUNT(*) as foreign_key_count,
  CASE 
    WHEN COUNT(*) = 8 THEN '✅ CORRECT (8 expected)'
    WHEN COUNT(*) < 8 THEN '⚠️ TOO FEW (expected 8, found ' || COUNT(*) || ')'
    ELSE '⚠️ TOO MANY (expected 8, found ' || COUNT(*) || ')'
  END as status
FROM information_schema.table_constraints AS tc 
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN (
    'ContentPlan',
    'ContentPlanItem',
    'TopicalAuthorityMap',
    'TopicalMapArticle',
    'BatchJob'
  );

-- Show orphaned data count
SELECT 
  '📊 Current Orphaned Data Count' as info,
  (
    SELECT COUNT(*) 
    FROM "ContentPlanItem" cpi
    LEFT JOIN "ContentPlan" cp ON cpi."planId" = cp.id
    WHERE cp.id IS NULL
  ) as orphaned_plan_items,
  (
    SELECT COUNT(*) 
    FROM "TopicalMapArticle" tma
    LEFT JOIN "TopicalAuthorityMap" tam ON tma."mapId" = tam.id
    WHERE tam.id IS NULL
  ) as orphaned_map_articles;

-- ============================================
-- STAP 2: CLEANUP ORPHANED DATA
-- ============================================
SELECT '🧹 STAP 2: Cleaning up orphaned data...' as status;

-- Cleanup orphaned ContentPlanItems
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM "ContentPlanItem"
  WHERE "planId" NOT IN (SELECT id FROM "ContentPlan");
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count > 0 THEN
    RAISE NOTICE '🗑️ Deleted % orphaned ContentPlanItem records', deleted_count;
  ELSE
    RAISE NOTICE '✅ No orphaned ContentPlanItem records found';
  END IF;
END $$;

-- Cleanup orphaned TopicalMapArticles
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM "TopicalMapArticle"
  WHERE "mapId" NOT IN (SELECT id FROM "TopicalAuthorityMap");
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count > 0 THEN
    RAISE NOTICE '🗑️ Deleted % orphaned TopicalMapArticle records', deleted_count;
  ELSE
    RAISE NOTICE '✅ No orphaned TopicalMapArticle records found';
  END IF;
END $$;

-- Cleanup orphaned BatchJobs
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM "BatchJob"
  WHERE "mapId" NOT IN (SELECT id FROM "TopicalAuthorityMap");
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count > 0 THEN
    RAISE NOTICE '🗑️ Deleted % orphaned BatchJob records', deleted_count;
  ELSE
    RAISE NOTICE '✅ No orphaned BatchJob records found';
  END IF;
END $$;

-- ============================================
-- STAP 3: FIX INVALID BLOGPOST REFERENCES
-- ============================================
SELECT '🔧 STAP 3: Fixing invalid BlogPost references...' as status;

-- Fix ContentPlanItem invalid references
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  UPDATE "ContentPlanItem"
  SET "blogPostId" = NULL
  WHERE "blogPostId" IS NOT NULL 
    AND "blogPostId" NOT IN (SELECT id FROM "BlogPost");
  
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  
  IF fixed_count > 0 THEN
    RAISE NOTICE '🔧 Fixed % invalid blogPostId references in ContentPlanItem', fixed_count;
  ELSE
    RAISE NOTICE '✅ No invalid blogPostId references in ContentPlanItem';
  END IF;
END $$;

-- Fix TopicalMapArticle invalid references
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  UPDATE "TopicalMapArticle"
  SET "blogPostId" = NULL
  WHERE "blogPostId" IS NOT NULL 
    AND "blogPostId" NOT IN (SELECT id FROM "BlogPost");
  
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  
  IF fixed_count > 0 THEN
    RAISE NOTICE '🔧 Fixed % invalid blogPostId references in TopicalMapArticle', fixed_count;
  ELSE
    RAISE NOTICE '✅ No invalid blogPostId references in TopicalMapArticle';
  END IF;
END $$;

-- ============================================
-- STAP 4: VOEG ONTBREKENDE FOREIGN KEYS TOE
-- ============================================
SELECT '🔗 STAP 4: Adding missing foreign keys...' as status;

-- Add ContentPlanItem.blogPostId foreign key
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ContentPlanItem_blogPostId_fkey'
      AND table_name = 'ContentPlanItem'
  ) THEN
    ALTER TABLE "ContentPlanItem"
    ADD CONSTRAINT "ContentPlanItem_blogPostId_fkey"
    FOREIGN KEY ("blogPostId") 
    REFERENCES "BlogPost"(id)
    ON DELETE SET NULL 
    ON UPDATE CASCADE;
    
    RAISE NOTICE '✨ Added ContentPlanItem_blogPostId_fkey foreign key';
  ELSE
    RAISE NOTICE '⏭️ ContentPlanItem_blogPostId_fkey already exists';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE '❌ Failed to add ContentPlanItem_blogPostId_fkey: %', SQLERRM;
END $$;

-- Add TopicalMapArticle.blogPostId foreign key
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'TopicalMapArticle_blogPostId_fkey'
      AND table_name = 'TopicalMapArticle'
  ) THEN
    ALTER TABLE "TopicalMapArticle"
    ADD CONSTRAINT "TopicalMapArticle_blogPostId_fkey"
    FOREIGN KEY ("blogPostId") 
    REFERENCES "BlogPost"(id)
    ON DELETE SET NULL 
    ON UPDATE CASCADE;
    
    RAISE NOTICE '✨ Added TopicalMapArticle_blogPostId_fkey foreign key';
  ELSE
    RAISE NOTICE '⏭️ TopicalMapArticle_blogPostId_fkey already exists';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE '❌ Failed to add TopicalMapArticle_blogPostId_fkey: %', SQLERRM;
END $$;

-- ============================================
-- STAP 5: COMPREHENSIVE VERIFICATION
-- ============================================
SELECT '🔍 STAP 5: Verifying fixes...' as status;

-- Verify all foreign keys
SELECT 
  '🔗 All Foreign Keys' as verification,
  tc.table_name, 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS references_table
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN (
    'ContentPlan',
    'ContentPlanItem',
    'TopicalAuthorityMap',
    'TopicalMapArticle',
    'BatchJob'
  )
ORDER BY tc.table_name, kcu.column_name;

-- Count foreign keys
SELECT 
  '📊 Foreign Key Count' as verification,
  COUNT(*) as total_foreign_keys,
  CASE 
    WHEN COUNT(*) = 8 THEN '✅ PERFECT! (8 expected, 8 found)'
    WHEN COUNT(*) < 8 THEN '❌ STILL MISSING SOME! (8 expected, ' || COUNT(*) || ' found)'
    ELSE '⚠️ TOO MANY! (8 expected, ' || COUNT(*) || ' found)'
  END as status
FROM information_schema.table_constraints AS tc 
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN (
    'ContentPlan',
    'ContentPlanItem',
    'TopicalAuthorityMap',
    'TopicalMapArticle',
    'BatchJob'
  );

-- Verify no orphaned data remains
SELECT 
  '🧹 Orphaned Data Check' as verification,
  (
    SELECT COUNT(*) 
    FROM "ContentPlanItem" cpi
    LEFT JOIN "ContentPlan" cp ON cpi."planId" = cp.id
    WHERE cp.id IS NULL
  ) as orphaned_plan_items,
  (
    SELECT COUNT(*) 
    FROM "TopicalMapArticle" tma
    LEFT JOIN "TopicalAuthorityMap" tam ON tma."mapId" = tam.id
    WHERE tam.id IS NULL
  ) as orphaned_map_articles,
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM "ContentPlanItem" cpi
      LEFT JOIN "ContentPlan" cp ON cpi."planId" = cp.id
      WHERE cp.id IS NULL
    ) + (
      SELECT COUNT(*) 
      FROM "TopicalMapArticle" tma
      LEFT JOIN "TopicalAuthorityMap" tam ON tma."mapId" = tam.id
      WHERE tam.id IS NULL
    ) = 0 THEN '✅ NO ORPHANED DATA'
    ELSE '❌ ORPHANED DATA STILL EXISTS'
  END as status;

-- Verify no invalid references
SELECT 
  '🔗 Invalid Reference Check' as verification,
  (
    SELECT COUNT(*) 
    FROM "ContentPlanItem"
    WHERE "blogPostId" IS NOT NULL 
      AND "blogPostId" NOT IN (SELECT id FROM "BlogPost")
  ) as invalid_plan_item_refs,
  (
    SELECT COUNT(*) 
    FROM "TopicalMapArticle"
    WHERE "blogPostId" IS NOT NULL 
      AND "blogPostId" NOT IN (SELECT id FROM "BlogPost")
  ) as invalid_article_refs,
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM "ContentPlanItem"
      WHERE "blogPostId" IS NOT NULL 
        AND "blogPostId" NOT IN (SELECT id FROM "BlogPost")
    ) + (
      SELECT COUNT(*) 
      FROM "TopicalMapArticle"
      WHERE "blogPostId" IS NOT NULL 
        AND "blogPostId" NOT IN (SELECT id FROM "BlogPost")
    ) = 0 THEN '✅ NO INVALID REFERENCES'
    ELSE '❌ INVALID REFERENCES STILL EXIST'
  END as status;

-- ============================================
-- FINAL STATUS
-- ============================================
SELECT 
  '🎉 FIX COMPLETED!' as final_status,
  'Database foreign keys en data integrity zijn hersteld' as message,
  NOW() as completed_at;

-- ============================================
-- EXPECTED RESULTS
-- ============================================
-- ✅ 8 Foreign Keys:
--    1. ContentPlan.clientId → Client.id
--    2. ContentPlanItem.planId → ContentPlan.id
--    3. ContentPlanItem.blogPostId → BlogPost.id
--    4. TopicalAuthorityMap.clientId → Client.id
--    5. TopicalMapArticle.mapId → TopicalAuthorityMap.id
--    6. TopicalMapArticle.parentId → TopicalMapArticle.id
--    7. TopicalMapArticle.blogPostId → BlogPost.id
--    8. BatchJob.mapId → TopicalAuthorityMap.id
--
-- ✅ 0 Orphaned Records
-- ✅ 0 Invalid References
--
-- Als je dit alles ziet, is de database volledig gerepareerd! 🚀
