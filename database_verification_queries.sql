-- ============================================
-- VERIFICATION QUERIES FOR CONTENT PLANS MIGRATION
-- ============================================
-- Run these queries AFTER running the fixed migration to verify success

-- 1. Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ContentPlan', 'ContentPlanItem')
ORDER BY table_name;
-- Expected result: 2 rows (ContentPlan, ContentPlanItem)

-- 2. Check ContentPlan table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ContentPlan'
ORDER BY ordinal_position;
-- Verify that 'id' and 'clientId' are both 'text' datatype

-- 3. Check ContentPlanItem table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ContentPlanItem'
ORDER BY ordinal_position;
-- Verify that 'id', 'planId', and 'blogPostId' are all 'text' datatype

-- 4. Check foreign key constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('ContentPlan', 'ContentPlanItem')
ORDER BY tc.table_name, tc.constraint_name;
-- Expected: 3 foreign keys (ContentPlan->Client, ContentPlanItem->ContentPlan, ContentPlanItem->BlogPost)

-- 5. Check indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('ContentPlan', 'ContentPlanItem')
ORDER BY tablename, indexname;
-- Expected: Multiple indexes for performance

-- 6. Test insert (optional - to verify functionality)
-- Uncomment to test:
/*
BEGIN;

-- Get a real client ID from your database
DO $$
DECLARE
  test_client_id TEXT;
  test_plan_id TEXT;
BEGIN
  -- Get first client ID
  SELECT id INTO test_client_id FROM "Client" LIMIT 1;
  
  IF test_client_id IS NOT NULL THEN
    -- Insert test content plan
    INSERT INTO "ContentPlan" (
      "clientId", "name", "niche", "targetAudience", "totalPosts", "period"
    ) VALUES (
      test_client_id, 
      'Test Content Plan', 
      'AI & Marketing', 
      'Small Business Owners', 
      5, 
      '1 maand'
    ) RETURNING id INTO test_plan_id;
    
    -- Insert test content plan item
    INSERT INTO "ContentPlanItem" (
      "planId", "title", "description", "contentType"
    ) VALUES (
      test_plan_id,
      'Test Blog Post',
      'A test blog post description',
      'Guide'
    );
    
    RAISE NOTICE 'Test data inserted successfully!';
    RAISE NOTICE 'Client ID: %', test_client_id;
    RAISE NOTICE 'Plan ID: %', test_plan_id;
  ELSE
    RAISE NOTICE 'No clients found in database. Create a client first.';
  END IF;
END $$;

ROLLBACK; -- Don't commit test data
*/

-- SUCCESS MESSAGE
SELECT 'Migration verification complete! ✅' AS status;