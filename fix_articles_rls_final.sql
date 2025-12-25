-- ============================================
-- FINAL FIX FOR ARTICLES RLS ERROR
-- This fixes the "new row violates row-level security policy" error
-- when updating articles from bibliotheek
-- ============================================

-- Drop all existing policies on articles table
DROP POLICY IF EXISTS "Public can view published articles" ON articles;
DROP POLICY IF EXISTS "Authenticated users can manage articles" ON articles;
DROP POLICY IF EXISTS "Users can view own articles" ON articles;
DROP POLICY IF EXISTS "Users can insert own articles" ON articles;
DROP POLICY IF EXISTS "Users can update own articles" ON articles;
DROP POLICY IF EXISTS "Users can delete own articles" ON articles;

-- Ensure articles table has user_id column
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Ensure RLS is enabled
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Public can view published articles (for blog)
CREATE POLICY "Public can view published articles" ON articles
  FOR SELECT USING (status = 'published');

-- Policy 1: Users can view articles they own directly OR via project
CREATE POLICY "Users can view own articles" ON articles
  FOR SELECT USING (
    -- User owns article directly
    user_id = auth.uid()
    OR
    -- User owns the project this article belongs to
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = articles.project_id
      AND projects.user_id = auth.uid()
    ))
  );

-- Policy 2: Users can insert articles if they own the project OR set themselves as user_id
CREATE POLICY "Users can insert own articles" ON articles
  FOR INSERT WITH CHECK (
    -- User is set as owner
    user_id = auth.uid()
    OR
    -- User owns the project (if project_id is set)
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
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = articles.project_id
      AND projects.user_id = auth.uid()
    ))
  ) WITH CHECK (
    -- After update, user still owns it directly
    user_id = auth.uid()
    OR
    -- After update, user still owns the project (or project_id is null for WritGo blog)
    (project_id IS NULL OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = articles.project_id
      AND projects.user_id = auth.uid()
    ))
  );

-- Policy 4: Users can delete articles they own directly OR via project
CREATE POLICY "Users can delete own articles" ON articles
  FOR DELETE USING (
    -- User owns article directly
    user_id = auth.uid()
    OR
    -- User owns the project this article belongs to
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = articles.project_id
      AND projects.user_id = auth.uid()
    ))
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);

-- Update existing articles to set user_id from their project
UPDATE articles
SET user_id = projects.user_id
FROM projects
WHERE articles.project_id = projects.id
  AND articles.user_id IS NULL;
