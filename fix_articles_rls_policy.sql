-- Fix RLS Policy for Articles Table
-- The issue is that auth.role() = 'authenticated' doesn't work as expected
-- We need to use auth.uid() IS NOT NULL instead

-- Drop the existing incorrect policy
DROP POLICY IF EXISTS "Authenticated users can manage articles" ON articles;

-- Create a corrected policy for authenticated users
CREATE POLICY "Authenticated users can manage articles" ON articles
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure the public read policy for published articles still exists
-- (This should already exist, but we'll recreate it just to be safe)
DROP POLICY IF EXISTS "Public can view published articles" ON articles;

CREATE POLICY "Public can view published articles" ON articles
  FOR SELECT
  USING (status = 'published');
