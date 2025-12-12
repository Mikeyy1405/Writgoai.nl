-- ============================================
-- DIAGNOSE CLIENTID COLUMN ISSUES
-- ============================================
-- This script checks all tables for client-related columns
-- and identifies any inconsistencies or missing foreign keys

-- ============================================
-- STEP 1: Check Client table exists
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'Client'
  ) THEN
    RAISE NOTICE '✅ Client table exists';
  ELSE
    RAISE NOTICE '❌ Client table MISSING - This is a critical issue!';
  END IF;
END $$;

-- ============================================
-- STEP 2: Show Client table structure
-- ============================================
SELECT 
  'Client Table Structure' as "Section",
  column_name as "Column",
  data_type as "Type",
  is_nullable as "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Client'
ORDER BY ordinal_position;

-- ============================================
-- STEP 3: Find all tables with client-related columns
-- ============================================
SELECT 
  'All Client Columns Found' as "Section",
  table_name as "Table",
  column_name as "Column",
  data_type as "Type"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    column_name LIKE '%client%' 
    OR column_name LIKE '%Client%'
  )
ORDER BY table_name, column_name;

-- ============================================
-- STEP 4: Check foreign key relationships
-- ============================================
SELECT 
  'Foreign Key Relationships' as "Section",
  tc.table_name as "Table",
  kcu.column_name as "Column",
  ccu.table_name as "References Table",
  ccu.column_name as "References Column",
  tc.constraint_name as "Constraint Name"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (
    kcu.column_name LIKE '%client%'
    OR kcu.column_name LIKE '%Client%'
  )
ORDER BY tc.table_name;

-- ============================================
-- STEP 5: Check which content tables exist
-- ============================================
SELECT 
  'Content Tables Status' as "Section",
  CASE 
    WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'ContentPlan') 
    THEN '✅ ContentPlan exists'
    ELSE '❌ ContentPlan missing'
  END as "ContentPlan",
  CASE 
    WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'TopicalAuthorityMap') 
    THEN '✅ TopicalAuthorityMap exists'
    ELSE '❌ TopicalAuthorityMap missing'
  END as "TopicalAuthorityMap",
  CASE 
    WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'SocialMediaStrategy') 
    THEN '✅ SocialMediaStrategy exists'
    ELSE '❌ SocialMediaStrategy missing'
  END as "SocialMediaStrategy",
  CASE 
    WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'WebsiteAnalysis') 
    THEN '✅ WebsiteAnalysis exists'
    ELSE '❌ WebsiteAnalysis missing'
  END as "WebsiteAnalysis";

-- ============================================
-- STEP 6: Check for missing clientId columns
-- ============================================
DO $$
DECLARE
  tables_to_check TEXT[] := ARRAY['ContentPlan', 'TopicalAuthorityMap', 'SocialMediaStrategy', 'WebsiteAnalysis', 'BlogPost', 'Project'];
  tbl TEXT;
  has_column BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'CHECKING FOR MISSING CLIENTID COLUMNS';
  RAISE NOTICE '============================================';
  
  FOREACH tbl IN ARRAY tables_to_check
  LOOP
    -- Check if table exists
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = tbl) THEN
      -- Check if clientId column exists
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = tbl
        AND column_name = 'clientId'
      ) INTO has_column;
      
      IF has_column THEN
        RAISE NOTICE '✅ %.clientId exists', tbl;
      ELSE
        RAISE NOTICE '❌ %.clientId MISSING', tbl;
      END IF;
    ELSE
      RAISE NOTICE '⚠️  % table does not exist', tbl;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- STEP 7: Check for case sensitivity issues
-- ============================================
SELECT 
  'Case Sensitivity Check' as "Section",
  table_name as "Table",
  column_name as "Column Name (Actual)",
  CASE 
    WHEN column_name = 'clientId' THEN '✅ Correct'
    WHEN column_name = 'client_id' THEN '⚠️  Snake case detected'
    WHEN column_name = 'ClientId' THEN '⚠️  Pascal case detected'
    ELSE '❌ Unexpected format'
  END as "Status"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name ILIKE '%client%id%'
ORDER BY table_name;

-- ============================================
-- STEP 8: Summary
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'DIAGNOSIS COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Review the output above';
  RAISE NOTICE '2. Identify any tables missing clientId columns';
  RAISE NOTICE '3. Run COMPLETE_CLIENTID_FIX.sql to fix all issues';
  RAISE NOTICE '';
END $$;
