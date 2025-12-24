-- Add backlink settings to projects table
-- This allows users to enable/disable automatic backlink exchange in generated content

-- Add enable_backlinks column (default TRUE for existing projects)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS enable_backlinks BOOLEAN DEFAULT TRUE;

-- Add comment for documentation
COMMENT ON COLUMN projects.enable_backlinks IS 'Enable automatic backlink exchange in generated content (internal links to related articles)';
