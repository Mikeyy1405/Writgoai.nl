-- ============================================
-- FIX: Add missing category column to writgo_content_triggers
-- ============================================

-- Add category column if it doesn't exist
ALTER TABLE writgo_content_triggers 
  ADD COLUMN IF NOT EXISTS category TEXT;

-- Set default categories for existing triggers based on name
UPDATE writgo_content_triggers 
SET category = CASE
  WHEN name LIKE '%Google%' OR name LIKE '%SEO%' THEN 'Google SEO Updates'
  WHEN name LIKE '%AI%' OR name LIKE '%ChatGPT%' OR name LIKE '%OpenAI%' THEN 'AI & SEO'
  WHEN name LIKE '%WordPress%' THEN 'WordPress SEO'
  WHEN name LIKE '%Content%' OR name LIKE '%Marketing%' THEN 'Content Marketing'
  ELSE 'Google SEO Updates'
END
WHERE category IS NULL;
