-- Update existing blog schema to match requirements
-- This adds missing fields to the articles table

-- Add seo_keywords column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'articles' AND column_name = 'seo_keywords') THEN
    ALTER TABLE articles ADD COLUMN seo_keywords TEXT[];
  END IF;
END $$;

-- Ensure featured_image column is named correctly (it's called featured_image, not featured_image_url)
-- This is fine as is, just documenting

-- Add index for seo_keywords if needed
CREATE INDEX IF NOT EXISTS idx_articles_seo_keywords ON articles USING GIN (seo_keywords);

-- Create view for post counts by category
CREATE OR REPLACE VIEW article_category_counts AS
SELECT 
  c.id,
  c.name,
  c.slug,
  c.description,
  COUNT(m.article_id) as post_count
FROM article_categories c
LEFT JOIN article_category_mapping m ON c.id = m.category_id
LEFT JOIN articles a ON m.article_id = a.id AND a.status = 'published'
GROUP BY c.id, c.name, c.slug, c.description;

-- Create view for post counts by tag
CREATE OR REPLACE VIEW article_tag_counts AS
SELECT 
  t.id,
  t.name,
  t.slug,
  COUNT(m.article_id) as post_count
FROM article_tags t
LEFT JOIN article_tag_mapping m ON t.id = m.tag_id
LEFT JOIN articles a ON m.article_id = a.id AND a.status = 'published'
GROUP BY t.id, t.name, t.slug;

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Convert to lowercase and replace special characters
  slug := LOWER(title);
  -- Replace spaces with hyphens
  slug := REGEXP_REPLACE(slug, '[^a-z0-9]+', '-', 'g');
  -- Remove leading/trailing hyphens
  slug := TRIM(BOTH '-' FROM slug);
  RETURN slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to ensure unique slug
CREATE OR REPLACE FUNCTION ensure_unique_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- If slug is not provided, generate from title
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.title);
  END IF;

  base_slug := NEW.slug;
  new_slug := base_slug;

  -- Check for uniqueness and append number if needed
  WHILE EXISTS (
    SELECT 1 FROM articles 
    WHERE slug = new_slug 
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) LOOP
    new_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;

  NEW.slug := new_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure unique slug on insert/update
DROP TRIGGER IF EXISTS ensure_unique_slug_trigger ON articles;
CREATE TRIGGER ensure_unique_slug_trigger
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_unique_slug();
