-- ============================================
-- WORDPRESS SYNC MIGRATION
-- Adds missing WordPress integration columns to articles table
-- Run this in Supabase SQL Editor
-- ============================================

-- Add WordPress sync columns to articles table
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS wordpress_id INTEGER,
ADD COLUMN IF NOT EXISTS wordpress_url TEXT;

-- Create index for WordPress ID lookups (for faster sync checks)
CREATE INDEX IF NOT EXISTS idx_articles_wordpress_id ON articles(wordpress_id) WHERE wordpress_id IS NOT NULL;

-- Create index for project_id filtering (for blog post separation)
CREATE INDEX IF NOT EXISTS idx_articles_project_id_null ON articles(project_id) WHERE project_id IS NULL;

-- ============================================
-- COMMENTS
-- ============================================
-- wordpress_id: Stores the WordPress post ID after successful sync
-- wordpress_url: Stores the WordPress post URL for quick reference
-- The index on wordpress_id allows fast lookups when syncing from WordPress back to our DB
-- The partial index on project_id IS NULL optimizes queries for WritGo.nl blog articles
-- ============================================

-- ============================================
-- VERIFICATION QUERIES
-- Run these after migration to verify:
-- ============================================

-- Check if columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'articles'
AND column_name IN ('wordpress_id', 'wordpress_url')
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'articles'
AND indexname LIKE '%wordpress%'
ORDER BY indexname;

-- Check all articles columns (final verification)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'articles'
ORDER BY ordinal_position;
