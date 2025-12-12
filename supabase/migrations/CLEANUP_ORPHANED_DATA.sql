-- ============================================
-- CLEANUP ORPHANED DATA EN INVALID REFERENCES
-- ============================================
-- Dit script verwijdert alle orphaned data en invalid foreign key references
-- RUN DIT ALLEEN als je zeker weet dat je orphaned data hebt (na DIAGNOSE_ISSUES.sql)
--
-- Auteur: WritgoAI Team
-- Datum: 12 December 2024
-- ============================================

-- ============================================
-- WAARSCHUWING
-- ============================================
SELECT 
  '⚠️ WAARSCHUWING' as status,
  'Dit script VERWIJDERT orphaned data permanent!' as message,
  'Maak een backup als je twijfelt' as advice;

-- ============================================
-- STAP 1: BACKUP COUNTS (VOOR VERIFICATIE)
-- ============================================
SELECT 
  '📊 BEFORE CLEANUP' as step,
  (
    SELECT COUNT(*) FROM "ContentPlanItem"
  ) as total_plan_items,
  (
    SELECT COUNT(*) 
    FROM "ContentPlanItem" cpi
    LEFT JOIN "ContentPlan" cp ON cpi."planId" = cp.id
    WHERE cp.id IS NULL
  ) as orphaned_plan_items,
  (
    SELECT COUNT(*) FROM "TopicalMapArticle"
  ) as total_map_articles,
  (
    SELECT COUNT(*) 
    FROM "TopicalMapArticle" tma
    LEFT JOIN "TopicalAuthorityMap" tam ON tma."mapId" = tam.id
    WHERE tam.id IS NULL
  ) as orphaned_map_articles;

-- ============================================
-- STAP 2: VERWIJDER ORPHANED CONTENTPLANITEMS
-- ============================================
-- Dit zijn items die verwijzen naar een planId die niet bestaat
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Verwijder orphaned items
  DELETE FROM "ContentPlanItem"
  WHERE "planId" NOT IN (SELECT id FROM "ContentPlan");
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count > 0 THEN
    RAISE NOTICE '🗑️ Deleted % orphaned ContentPlanItem records', deleted_count;
  ELSE
    RAISE NOTICE '✅ No orphaned ContentPlanItem records to delete';
  END IF;
END $$;

-- ============================================
-- STAP 3: VERWIJDER ORPHANED TOPICALMEPARTICLES
-- ============================================
-- Dit zijn articles die verwijzen naar een mapId die niet bestaat
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Verwijder orphaned articles
  DELETE FROM "TopicalMapArticle"
  WHERE "mapId" NOT IN (SELECT id FROM "TopicalAuthorityMap");
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count > 0 THEN
    RAISE NOTICE '🗑️ Deleted % orphaned TopicalMapArticle records', deleted_count;
  ELSE
    RAISE NOTICE '✅ No orphaned TopicalMapArticle records to delete';
  END IF;
END $$;

-- ============================================
-- STAP 4: FIX INVALID BLOGPOST REFERENCES
-- ============================================
-- Set blogPostId to NULL where the referenced BlogPost doesn't exist
-- Dit is veiliger dan verwijderen

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
-- STAP 5: FIX ORPHANED BATCHJOBS
-- ============================================
-- Verwijder BatchJobs die verwijzen naar niet-bestaande maps
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
    RAISE NOTICE '✅ No orphaned BatchJob records to delete';
  END IF;
END $$;

-- ============================================
-- STAP 6: AFTER CLEANUP COUNTS
-- ============================================
SELECT 
  '📊 AFTER CLEANUP' as step,
  (
    SELECT COUNT(*) FROM "ContentPlanItem"
  ) as total_plan_items,
  (
    SELECT COUNT(*) 
    FROM "ContentPlanItem" cpi
    LEFT JOIN "ContentPlan" cp ON cpi."planId" = cp.id
    WHERE cp.id IS NULL
  ) as remaining_orphaned_plan_items,
  (
    SELECT COUNT(*) FROM "TopicalMapArticle"
  ) as total_map_articles,
  (
    SELECT COUNT(*) 
    FROM "TopicalMapArticle" tma
    LEFT JOIN "TopicalAuthorityMap" tam ON tma."mapId" = tam.id
    WHERE tam.id IS NULL
  ) as remaining_orphaned_map_articles;

-- ============================================
-- STAP 7: FINAL VERIFICATION
-- ============================================
SELECT 
  '🔍 FINAL VERIFICATION' as step,
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM "ContentPlanItem" cpi
      LEFT JOIN "ContentPlan" cp ON cpi."planId" = cp.id
      WHERE cp.id IS NULL
    ) = 0 AND (
      SELECT COUNT(*) 
      FROM "TopicalMapArticle" tma
      LEFT JOIN "TopicalAuthorityMap" tam ON tma."mapId" = tam.id
      WHERE tam.id IS NULL
    ) = 0 THEN '✅ ALL ORPHANED DATA CLEANED'
    ELSE '⚠️ SOME ORPHANED DATA REMAINS'
  END as orphaned_data_status,
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM "ContentPlanItem"
      WHERE "blogPostId" IS NOT NULL 
        AND "blogPostId" NOT IN (SELECT id FROM "BlogPost")
    ) = 0 AND (
      SELECT COUNT(*) 
      FROM "TopicalMapArticle"
      WHERE "blogPostId" IS NOT NULL 
        AND "blogPostId" NOT IN (SELECT id FROM "BlogPost")
    ) = 0 THEN '✅ ALL INVALID REFERENCES FIXED'
    ELSE '⚠️ SOME INVALID REFERENCES REMAIN'
  END as invalid_references_status;

-- ============================================
-- SUCCESS
-- ============================================
SELECT 
  '🎉 CLEANUP COMPLETED!' as status,
  'Alle orphaned data en invalid references zijn opgeschoond' as message,
  NOW() as completed_at;
