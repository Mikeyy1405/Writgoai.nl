-- ============================================
-- PROJECT KNOWLEDGE BASE MIGRATION
-- Creates table for storing project-specific knowledge base entries
-- Run this in Supabase SQL Editor
-- ============================================

-- Create project_knowledge_base table
CREATE TABLE IF NOT EXISTS project_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  source_url TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_knowledge_base_project ON project_knowledge_base(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON project_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_is_active ON project_knowledge_base(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_created_at ON project_knowledge_base(created_at DESC);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_knowledge_base_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_project_knowledge_base_updated_at
  BEFORE UPDATE ON project_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_project_knowledge_base_updated_at();

-- Enable Row Level Security
ALTER TABLE project_knowledge_base ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view knowledge base entries for their own projects
CREATE POLICY "Users can view own project knowledge base" ON project_knowledge_base
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_knowledge_base.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert knowledge base entries for their own projects
CREATE POLICY "Users can insert own project knowledge base" ON project_knowledge_base
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_knowledge_base.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update knowledge base entries for their own projects
CREATE POLICY "Users can update own project knowledge base" ON project_knowledge_base
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_knowledge_base.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete knowledge base entries for their own projects
CREATE POLICY "Users can delete own project knowledge base" ON project_knowledge_base
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_knowledge_base.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON TABLE project_knowledge_base IS 'Stores project-specific knowledge base entries for AI content generation context';

-- ============================================
-- VERIFICATION QUERIES (Optional)
-- Uncomment and run these separately after migration to verify:
-- ============================================

/*
-- Check if table exists and has correct structure
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'project_knowledge_base'
ORDER BY ordinal_position;

-- Check indexes
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'project_knowledge_base';

-- Check triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'project_knowledge_base';

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'project_knowledge_base';
*/
