-- ============================================
-- FIX MISSING FOREIGN KEYS EN CONSTRAINTS
-- ============================================
-- Dit script voegt de ontbrekende foreign keys toe
-- Voer dit uit in Supabase SQL Editor NA het draaien van DIAGNOSE_ISSUES.sql
--
-- Auteur: WritgoAI Team
-- Datum: 12 December 2024
-- ============================================

-- ============================================
-- STAP 1: VERIFICATIE - BLOGPOST TABEL MOET BESTAAN
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'BlogPost'
  ) THEN
    RAISE EXCEPTION 'BlogPost table does not exist! Please run COMPLETE_MIGRATION_PACKAGE.sql first.';
  END IF;
  
  RAISE NOTICE '✅ BlogPost table exists';
END $$;

-- ============================================
-- STAP 2: CLEANUP ORPHANED DATA (VEILIG)
-- ============================================
-- Verwijder ContentPlanItems die verwijzen naar niet-bestaande plannen
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  -- Verwijder orphaned items
  DELETE FROM "ContentPlanItem"
  WHERE "planId" NOT IN (SELECT id FROM "ContentPlan");
  
  GET DIAGNOSTICS orphaned_count = ROW_COUNT;
  
  IF orphaned_count > 0 THEN
    RAISE NOTICE '🧹 Cleaned up % orphaned ContentPlanItem records', orphaned_count;
  ELSE
    RAISE NOTICE '✅ No orphaned ContentPlanItem records found';
  END IF;
END $$;

-- Verwijder TopicalMapArticles die verwijzen naar niet-bestaande maps
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  DELETE FROM "TopicalMapArticle"
  WHERE "mapId" NOT IN (SELECT id FROM "TopicalAuthorityMap");
  
  GET DIAGNOSTICS orphaned_count = ROW_COUNT;
  
  IF orphaned_count > 0 THEN
    RAISE NOTICE '🧹 Cleaned up % orphaned TopicalMapArticle records', orphaned_count;
  ELSE
    RAISE NOTICE '✅ No orphaned TopicalMapArticle records found';
  END IF;
END $$;

-- Verwijder invalid blogPostId references
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  UPDATE "ContentPlanItem"
  SET "blogPostId" = NULL
  WHERE "blogPostId" IS NOT NULL 
    AND "blogPostId" NOT IN (SELECT id FROM "BlogPost");
  
  GET DIAGNOSTICS invalid_count = ROW_COUNT;
  
  IF invalid_count > 0 THEN
    RAISE NOTICE '🧹 Cleaned up % invalid blogPostId references in ContentPlanItem', invalid_count;
  ELSE
    RAISE NOTICE '✅ No invalid blogPostId references found in ContentPlanItem';
  END IF;
END $$;

DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  UPDATE "TopicalMapArticle"
  SET "blogPostId" = NULL
  WHERE "blogPostId" IS NOT NULL 
    AND "blogPostId" NOT IN (SELECT id FROM "BlogPost");
  
  GET DIAGNOSTICS invalid_count = ROW_COUNT;
  
  IF invalid_count > 0 THEN
    RAISE NOTICE '🧹 Cleaned up % invalid blogPostId references in TopicalMapArticle', invalid_count;
  ELSE
    RAISE NOTICE '✅ No invalid blogPostId references found in TopicalMapArticle';
  END IF;
END $$;

-- ============================================
-- STAP 3: VOEG ONTBREKENDE FOREIGN KEYS TOE
-- ============================================

-- ContentPlanItem.blogPostId → BlogPost.id
DO $$ 
BEGIN
  -- Check of foreign key al bestaat
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ContentPlanItem_blogPostId_fkey'
      AND table_name = 'ContentPlanItem'
  ) THEN
    -- Voeg foreign key toe
    ALTER TABLE "ContentPlanItem"
    ADD CONSTRAINT "ContentPlanItem_blogPostId_fkey"
    FOREIGN KEY ("blogPostId") 
    REFERENCES "BlogPost"(id)
    ON DELETE SET NULL 
    ON UPDATE CASCADE;
    
    RAISE NOTICE '✅ Added ContentPlanItem_blogPostId_fkey foreign key';
  ELSE
    RAISE NOTICE '⏭️ ContentPlanItem_blogPostId_fkey already exists, skipping';
  END IF;
END $$;

-- TopicalMapArticle.blogPostId → BlogPost.id
DO $$ 
BEGIN
  -- Check of foreign key al bestaat
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'TopicalMapArticle_blogPostId_fkey'
      AND table_name = 'TopicalMapArticle'
  ) THEN
    -- Voeg foreign key toe
    ALTER TABLE "TopicalMapArticle"
    ADD CONSTRAINT "TopicalMapArticle_blogPostId_fkey"
    FOREIGN KEY ("blogPostId") 
    REFERENCES "BlogPost"(id)
    ON DELETE SET NULL 
    ON UPDATE CASCADE;
    
    RAISE NOTICE '✅ Added TopicalMapArticle_blogPostId_fkey foreign key';
  ELSE
    RAISE NOTICE '⏭️ TopicalMapArticle_blogPostId_fkey already exists, skipping';
  END IF;
END $$;

-- ============================================
-- STAP 4: VERIFICATIE VAN ALLE FOREIGN KEYS
-- ============================================
SELECT 
  '🔍 VERIFICATIE: Alle Foreign Keys' as check_step,
  tc.table_name, 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
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

-- Telling van foreign keys
SELECT 
  '📊 Foreign Key Count' as metric,
  COUNT(*) as total_foreign_keys,
  CASE 
    WHEN COUNT(*) = 8 THEN '✅ CORRECT (8 verwacht)'
    WHEN COUNT(*) < 8 THEN '❌ TE WEINIG (8 verwacht, ' || COUNT(*) || ' gevonden)'
    ELSE '⚠️ TE VEEL (8 verwacht, ' || COUNT(*) || ' gevonden)'
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

-- ============================================
-- STAP 5: CONTROLEER VOOR RESTERENDE PROBLEMEN
-- ============================================

-- Check voor orphaned data
SELECT 
  '🔍 Post-Fix Orphaned Data Check' as check_step,
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
    ELSE '⚠️ ORPHANED DATA FOUND'
  END as status;

-- ============================================
-- FINAL STATUS
-- ============================================
SELECT 
  '🎉 FIX COMPLETED!' as status,
  'Alle foreign keys zijn toegevoegd en orphaned data is opgeschoond' as message,
  NOW() as completed_at;

-- ============================================
-- VERWACHTE FOREIGN KEYS (8 TOTAAL)
-- ============================================
-- 1. ContentPlan.clientId → Client.id
-- 2. ContentPlanItem.planId → ContentPlan.id
-- 3. ContentPlanItem.blogPostId → BlogPost.id ✨ TOEGEVOEGD
-- 4. TopicalAuthorityMap.clientId → Client.id
-- 5. TopicalMapArticle.mapId → TopicalAuthorityMap.id
-- 6. TopicalMapArticle.parentId → TopicalMapArticle.id
-- 7. TopicalMapArticle.blogPostId → BlogPost.id ✨ TOEGEVOEGD
-- 8. BatchJob.mapId → TopicalAuthorityMap.id
