-- ============================================
-- RPC Function for Content Plan Updates
-- Date: 2025-12-15
-- Purpose: Fallback mechanism for contentPlan updates
-- ============================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS update_project_content_plan(text, jsonb);

-- Create RPC function for updating content plan
-- This is a fallback if direct update fails
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
  -- Update the project
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
  
  -- Check if update was successful
  IF v_updated_project IS NULL THEN
    RAISE EXCEPTION 'Project not found: %', p_project_id;
  END IF;
  
  -- Return updated project data
  RETURN v_updated_project;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_project_content_plan(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION update_project_content_plan(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION update_project_content_plan(text, jsonb) TO anon;

-- Add comment
COMMENT ON FUNCTION update_project_content_plan(text, jsonb) 
IS 'Updates contentPlan for a project. Fallback mechanism for direct updates. Returns updated project data.';

-- Test the function
DO $$
DECLARE
  test_project_id text;
  test_result jsonb;
BEGIN
  -- Get first project ID for testing
  SELECT id INTO test_project_id FROM "Project" LIMIT 1;
  
  IF test_project_id IS NOT NULL THEN
    -- Test the RPC function
    SELECT update_project_content_plan(
      test_project_id,
      '[{"title":"RPC Test","description":"Testing RPC function","keywords":"test","priority":"medium"}]'::jsonb
    ) INTO test_result;
    
    RAISE NOTICE '✅ RPC function test successful!';
    RAISE NOTICE '   Result: %', test_result;
    
    -- Cleanup test data
    PERFORM update_project_content_plan(
      test_project_id,
      '[]'::jsonb
    );
    
    RAISE NOTICE '✅ Test data cleaned up';
  ELSE
    RAISE NOTICE 'ℹ️ No projects found for RPC testing (empty database)';
  END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '✅ RPC FUNCTION CREATED: update_project_content_plan';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
