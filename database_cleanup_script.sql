-- ============================================
-- CLEANUP SCRIPT FOR FAILED CONTENT PLANS MIGRATION
-- ============================================
-- Run this ONLY if the migration was partially executed and failed
-- This will remove the tables so you can start fresh

-- Drop the tables in correct order (child tables first)
DROP TABLE IF EXISTS "ContentPlanItem" CASCADE;
DROP TABLE IF EXISTS "ContentPlan" CASCADE;

-- Verify tables are dropped
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ContentPlan', 'ContentPlanItem');

-- If the query above returns no rows, cleanup was successful
-- You can now run the fixed migration script