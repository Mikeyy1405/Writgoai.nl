-- Fix articles table RLS policies to support user_id ownership
-- This allows users to access articles they own directly (via user_id)
-- OR articles in projects they own (via project_id)

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own articles" ON articles;
DROP POLICY IF EXISTS "Users can insert own articles" ON articles;
DROP POLICY IF EXISTS "Users can update own articles" ON articles;
DROP POLICY IF EXISTS "Users can delete own articles" ON articles;

-- Ensure RLS is enabled
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view articles they own directly OR via project
CREATE POLICY "Users can view own articles" ON articles
  FOR SELECT USING (
    -- User owns article directly
    user_id = auth.uid()
    OR
    -- User owns the project this article belongs to
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = articles.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Policy 2: Users can insert articles if they own the project OR set themselves as user_id
CREATE POLICY "Users can insert own articles" ON articles
  FOR INSERT WITH CHECK (
    -- User is set as owner
    user_id = auth.uid()
    OR
    -- User owns the project
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = articles.project_id
      AND projects.user_id = auth.uid()
    ))
  );

-- Policy 3: Users can update articles they own directly OR via project
CREATE POLICY "Users can update own articles" ON articles
  FOR UPDATE USING (
    -- User owns article directly
    user_id = auth.uid()
    OR
    -- User owns the project this article belongs to
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = articles.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Policy 4: Users can delete articles they own directly OR via project
CREATE POLICY "Users can delete own articles" ON articles
  FOR DELETE USING (
    -- User owns article directly
    user_id = auth.uid()
    OR
    -- User owns the project this article belongs to
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = articles.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Optional: Public read access for published articles (if needed)
-- CREATE POLICY "Public can view published articles" ON articles
--   FOR SELECT USING (status = 'published');
