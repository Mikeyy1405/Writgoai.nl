-- ============================================
-- DIAGNOSE FOREIGN KEY EN CONSTRAINT ISSUES
-- ============================================
-- Dit script helpt je om alle database problemen te identificeren
-- Voer dit uit in Supabase SQL Editor
--
-- Auteur: WritgoAI Team
-- Datum: 12 December 2024
-- ============================================

-- ============================================
-- STAP 1: CHECK OF BLOGPOST TABEL BESTAAT
-- ============================================
SELECT 
  '📊 STAP 1: BlogPost Tabel Check' as diagnose_step,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'BlogPost'
  ) as blogpost_exists;

-- ============================================
-- STAP 2: CHECK ALLE FOREIGN KEYS
-- ============================================
SELECT 
  '🔗 STAP 2: Foreign Key Overzicht' as diagnose_step,
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
  '📈 Foreign Key Count' as metric,
  COUNT(*) as total_foreign_keys
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
-- STAP 3: CHECK MISSING FOREIGN KEYS
-- ============================================
-- Check of ContentPlanItem.blogPostId foreign key bestaat
SELECT 
  '❓ STAP 3: Missing Foreign Keys Check' as diagnose_step,
  'ContentPlanItem_blogPostId_fkey' as expected_constraint,
  EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ContentPlanItem_blogPostId_fkey'
  ) as exists;

-- Check of TopicalMapArticle.blogPostId foreign key bestaat
SELECT 
  '❓ Missing Foreign Key Check' as diagnose_step,
  'TopicalMapArticle_blogPostId_fkey' as expected_constraint,
  EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'TopicalMapArticle_blogPostId_fkey'
  ) as exists;

-- ============================================
-- STAP 4: CHECK DATA IN CONTENTPLAN
-- ============================================
SELECT 
  '💾 STAP 4: ContentPlan Data Check' as diagnose_step,
  COUNT(*) as contentplan_count,
  COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
FROM "ContentPlan";

-- Toon sample van ContentPlan IDs
SELECT 
  '💾 ContentPlan Sample IDs' as info,
  id,
  name,
  status,
  "createdAt"
FROM "ContentPlan"
ORDER BY "createdAt" DESC
LIMIT 5;

-- ============================================
-- STAP 5: CHECK DATA IN CONTENTPLANITEM
-- ============================================
SELECT 
  '💾 STAP 5: ContentPlanItem Data Check' as diagnose_step,
  COUNT(*) as contentplanitem_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'generating' THEN 1 END) as generating_count,
  COUNT(CASE WHEN status = 'generated' THEN 1 END) as generated_count,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
FROM "ContentPlanItem";

-- ============================================
-- STAP 6: CHECK ORPHANED DATA
-- ============================================
-- Check voor orphaned ContentPlanItems (items zonder valide plan)
SELECT 
  '⚠️ STAP 6: Orphaned ContentPlanItems' as diagnose_step,
  COUNT(*) as orphaned_items_count
FROM "ContentPlanItem" cpi
LEFT JOIN "ContentPlan" cp ON cpi."planId" = cp.id
WHERE cp.id IS NULL;

-- Toon sample van orphaned items (max 10)
SELECT 
  '⚠️ Sample Orphaned Items' as info,
  cpi.id as item_id,
  cpi."planId" as invalid_plan_id,
  cpi.title,
  cpi.status
FROM "ContentPlanItem" cpi
LEFT JOIN "ContentPlan" cp ON cpi."planId" = cp.id
WHERE cp.id IS NULL
LIMIT 10;

-- Check voor orphaned TopicalMapArticles
SELECT 
  '⚠️ Orphaned TopicalMapArticles' as diagnose_step,
  COUNT(*) as orphaned_articles_count
FROM "TopicalMapArticle" tma
LEFT JOIN "TopicalAuthorityMap" tam ON tma."mapId" = tam.id
WHERE tam.id IS NULL;

-- ============================================
-- STAP 7: CHECK BLOGPOST REFERENCES
-- ============================================
-- Check hoeveel ContentPlanItems een blogPostId hebben
SELECT 
  '📝 STAP 7: BlogPost References in ContentPlanItem' as diagnose_step,
  COUNT(*) as total_items,
  COUNT("blogPostId") as items_with_blogpost,
  COUNT(*) - COUNT("blogPostId") as items_without_blogpost
FROM "ContentPlanItem";

-- Check voor invalid blogPostId references (blogPostId die niet bestaat)
SELECT 
  '⚠️ Invalid BlogPost References' as diagnose_step,
  COUNT(*) as invalid_references_count
FROM "ContentPlanItem" cpi
LEFT JOIN "BlogPost" bp ON cpi."blogPostId" = bp.id
WHERE cpi."blogPostId" IS NOT NULL 
  AND bp.id IS NULL;

-- ============================================
-- STAP 8: CHECK DATATYPES
-- ============================================
SELECT 
  '🔤 STAP 8: ID Column Datatypes' as diagnose_step,
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN (
  'ContentPlan',
  'ContentPlanItem',
  'BlogPost',
  'TopicalAuthorityMap',
  'TopicalMapArticle'
)
  AND column_name IN ('id', 'planId', 'blogPostId', 'mapId', 'clientId')
ORDER BY table_name, column_name;

-- ============================================
-- SAMENVATTING
-- ============================================
SELECT 
  '✅ DIAGNOSE COMPLETE' as status,
  'Check de resultaten hierboven voor problemen' as message;

-- Verwachte foreign key count: 8
-- - ContentPlan.clientId → Client.id
-- - ContentPlanItem.planId → ContentPlan.id
-- - ContentPlanItem.blogPostId → BlogPost.id (MISSING?)
-- - TopicalAuthorityMap.clientId → Client.id
-- - TopicalMapArticle.mapId → TopicalAuthorityMap.id
-- - TopicalMapArticle.parentId → TopicalMapArticle.id
-- - TopicalMapArticle.blogPostId → BlogPost.id (MISSING?)
-- - BatchJob.mapId → TopicalAuthorityMap.id
