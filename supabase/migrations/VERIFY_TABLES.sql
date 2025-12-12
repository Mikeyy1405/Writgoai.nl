-- ============================================
-- VERIFICATIE SCRIPT VOOR MIGRATIES
-- ============================================
-- Gebruik dit script om te valideren dat alle tabellen
-- correct zijn aangemaakt na het uitvoeren van
-- COMPLETE_MIGRATION_PACKAGE.sql
--
-- Voer dit uit in Supabase SQL Editor
-- ============================================

-- Stap 1: Check welke tabellen bestaan
SELECT 
  '✅ Table Check' as step,
  table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'BlogPost',
    'ContentPlan',
    'ContentPlanItem',
    'TopicalAuthorityMap',
    'TopicalMapArticle',
    'BatchJob'
  )
ORDER BY table_name;

-- Stap 2: Check alle kolommen van nieuwe tabellen
SELECT 
  '✅ Column Check' as step,
  table_name, 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN (
  'BlogPost',
  'ContentPlan',
  'ContentPlanItem',
  'TopicalAuthorityMap',
  'TopicalMapArticle',
  'BatchJob'
)
ORDER BY table_name, ordinal_position;

-- Stap 3: Check foreign key constraints
SELECT 
  '✅ Foreign Key Check' as step,
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN (
    'ContentPlanItem',
    'TopicalMapArticle',
    'BatchJob'
  )
ORDER BY tc.table_name, kcu.column_name;

-- Stap 4: Check indexes
SELECT 
  '✅ Index Check' as step,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN (
  'BlogPost',
  'ContentPlan',
  'ContentPlanItem',
  'TopicalAuthorityMap',
  'TopicalMapArticle',
  'BatchJob'
)
ORDER BY tablename, indexname;

-- Stap 5: Check RLS policies
SELECT 
  '✅ RLS Policy Check' as step,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN (
  'BlogPost',
  'ContentPlan',
  'ContentPlanItem',
  'TopicalAuthorityMap',
  'TopicalMapArticle',
  'BatchJob'
)
ORDER BY tablename, policyname;

-- Stap 6: Check triggers
SELECT 
  '✅ Trigger Check' as step,
  event_object_table as table_name,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN (
  'BlogPost',
  'ContentPlan',
  'ContentPlanItem',
  'TopicalAuthorityMap',
  'TopicalMapArticle',
  'BatchJob'
)
ORDER BY event_object_table, trigger_name;

-- Stap 7: Test insert (DRY RUN - wordt niet opgeslagen)
-- Uncomment deze regels om een test insert te doen:
/*
BEGIN;

-- Test BlogPost insert
INSERT INTO "BlogPost" (
  title, slug, excerpt, content, status
) VALUES (
  'Test Blog Post',
  'test-blog-post-' || gen_random_uuid()::text,
  'This is a test excerpt',
  'This is test content',
  'draft'
);

-- Als dit werkt, rollback (we willen geen test data)
ROLLBACK;

SELECT '✅ Test Insert Successful' as step, 'BlogPost table is writable' as message;
*/

-- ============================================
-- VERWACHTE RESULTATEN
-- ============================================
-- Stap 1: 6 tabellen (BlogPost, ContentPlan, ContentPlanItem, TopicalAuthorityMap, TopicalMapArticle, BatchJob)
-- Stap 2: Alle kolommen met TEXT ids (niet UUID)
-- Stap 3: 5 foreign keys:
--   - ContentPlan.clientId → Client.id
--   - ContentPlanItem.planId → ContentPlan.id
--   - ContentPlanItem.blogPostId → BlogPost.id
--   - TopicalAuthorityMap.clientId → Client.id
--   - TopicalMapArticle.mapId → TopicalAuthorityMap.id
--   - TopicalMapArticle.parentId → TopicalMapArticle.id
--   - TopicalMapArticle.blogPostId → BlogPost.id
--   - BatchJob.mapId → TopicalAuthorityMap.id
-- Stap 4: Meerdere indexes per tabel
-- Stap 5: Admin access policies voor alle tabellen
-- Stap 6: updated_at triggers voor alle tabellen

SELECT '🎉 Verification Complete!' as final_status,
       'If you see all expected results above, the migration was successful!' as message;
