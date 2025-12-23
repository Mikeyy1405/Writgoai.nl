-- ============================================
-- CONTENT PLAN STATUS MIGRATION
-- Adds status tracking to content plans
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add status column to content_plans table
-- This tracks the overall status of the content plan
ALTER TABLE content_plans 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'archived', 'draft'));

-- 2. Add updated_at trigger to content_plans if not exists
CREATE OR REPLACE FUNCTION update_content_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_content_plans_updated_at ON content_plans;

CREATE TRIGGER trigger_update_content_plans_updated_at
  BEFORE UPDATE ON content_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_content_plans_updated_at();

-- 3. Note: Individual article status will be stored in the plan JSONB field
-- Each article in the plan array will have a status field with values:
-- 'todo', 'in_progress', 'review', 'published', 'update_needed'
-- This is flexible and doesn't require schema changes

-- 4. Create index for better query performance on status
CREATE INDEX IF NOT EXISTS idx_content_plans_status ON content_plans(status);

-- ============================================
-- VERIFICATION QUERIES
-- Run these after migration to verify:
-- ============================================

-- Check if status column exists and has correct constraint
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'content_plans' 
AND column_name = 'status';

-- Check constraint
SELECT 
  constraint_name, 
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%content_plans%status%';

-- Check indexes
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'content_plans'
AND indexname = 'idx_content_plans_status';

-- Sample query to see structure
SELECT 
  id,
  project_id,
  status,
  niche,
  language,
  created_at,
  updated_at
FROM content_plans
LIMIT 1;
