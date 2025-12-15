-- ==========================================
-- COMPLETE DATABASE VERIFICATION & FIX
-- Run this in Supabase SQL Editor
-- ==========================================

-- STEP 1: Check if contentPlan column exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'Project' 
        AND column_name = 'contentPlan'
    ) THEN '✅ contentPlan column EXISTS'
    ELSE '❌ contentPlan column MISSING'
  END as status;

-- STEP 2: Add contentPlan column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'Project' 
          AND column_name = 'contentPlan'
    ) THEN
        ALTER TABLE "Project" 
        ADD COLUMN "contentPlan" JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE '✅ Added contentPlan column';
    ELSE
        RAISE NOTICE 'ℹ️ contentPlan column already exists';
    END IF;
END $$;

-- STEP 3: Add index
CREATE INDEX IF NOT EXISTS "Project_contentPlan_idx" 
ON "Project" USING gin ("contentPlan");

-- STEP 4: Create RPC function for content plan updates
CREATE OR REPLACE FUNCTION update_project_content_plan(
  p_project_id text,
  p_content_plan jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_project jsonb;
BEGIN
  UPDATE "Project"
  SET "contentPlan" = p_content_plan,
      "updatedAt" = NOW()
  WHERE id = p_project_id
  RETURNING jsonb_build_object(
    'id', id,
    'name', name,
    'contentPlan', "contentPlan",
    'updatedAt', "updatedAt"
  ) INTO v_updated_project;
  
  IF v_updated_project IS NULL THEN
    RAISE EXCEPTION 'Project not found: %', p_project_id;
  END IF;
  
  RETURN v_updated_project;
END;
$$;

-- STEP 5: Grant permissions
GRANT EXECUTE ON FUNCTION update_project_content_plan(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION update_project_content_plan(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION update_project_content_plan(text, jsonb) TO anon;

-- STEP 6: Check Project table structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'Project'
ORDER BY ordinal_position;

-- STEP 7: Check BlogPost table structure  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'BlogPost'
ORDER BY ordinal_position;

-- STEP 8: Show sample project data
SELECT id, name, "clientId", "contentPlan"
FROM "Project" 
LIMIT 3;

-- STEP 9: Show blog post count
SELECT COUNT(*) as total_blog_posts FROM "BlogPost";

-- STEP 10: Final status report
DO $$
DECLARE
  contentplan_exists boolean;
  rpc_exists boolean;
BEGIN
  -- Check contentPlan column
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'Project' 
      AND column_name = 'contentPlan'
  ) INTO contentplan_exists;
  
  -- Check RPC function
  SELECT EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname = 'update_project_content_plan'
  ) INTO rpc_exists;
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'DATABASE STATUS REPORT';
  RAISE NOTICE '==========================================';
  
  IF contentplan_exists THEN
    RAISE NOTICE '✅ contentPlan column: OK';
  ELSE
    RAISE NOTICE '❌ contentPlan column: MISSING';
  END IF;
  
  IF rpc_exists THEN
    RAISE NOTICE '✅ RPC function: OK';
  ELSE
    RAISE NOTICE '❌ RPC function: MISSING';
  END IF;
  
  IF contentplan_exists AND rpc_exists THEN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ ALL SYSTEMS GO! Database is ready.';
    RAISE NOTICE '==========================================';
  ELSE
    RAISE NOTICE '==========================================';
    RAISE NOTICE '⚠️ ERRORS FOUND - Run migration steps above';
    RAISE NOTICE '==========================================';
  END IF;
END $$;
