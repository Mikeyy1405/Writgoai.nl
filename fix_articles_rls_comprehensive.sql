-- Comprehensive fix for articles table RLS policies
-- This replaces all existing policies with proper user-scoped policies
-- that check project ownership

-- Drop all existing policies on articles table
DROP POLICY IF EXISTS "Public can view published articles" ON articles;
DROP POLICY IF EXISTS "Authenticated users can manage articles" ON articles;
DROP POLICY IF EXISTS "Users can view own articles" ON articles;
DROP POLICY IF EXISTS "Users can insert own articles" ON articles;
DROP POLICY IF EXISTS "Users can update own articles" ON articles;
DROP POLICY IF EXISTS "Users can delete own articles" ON articles;

-- Ensure RLS is enabled
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can only view articles from their own projects
CREATE POLICY "Users can view own articles" ON articles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = articles.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Policy 2: Users can only insert articles into their own projects
CREATE POLICY "Users can insert own articles" ON articles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = articles.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Policy 3: Users can only update articles from their own projects
CREATE POLICY "Users can update own articles" ON articles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = articles.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Policy 4: Users can only delete articles from their own projects
CREATE POLICY "Users can delete own articles" ON articles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = articles.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Optional: Public read access for published articles (if needed)
-- Uncomment if you want published articles to be publicly accessible
-- CREATE POLICY "Public can view published articles" ON articles
--   FOR SELECT USING (status = 'published');
