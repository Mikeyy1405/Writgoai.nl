-- Migration: Restore WordPress Application Password authentication
-- Description: Removes WritGo plugin dependency, uses standard WordPress REST API with Application Passwords
-- Date: 2025-12-26

-- Ensure wp_username and wp_password columns exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS wp_username TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS wp_password TEXT;

-- Remove writgo_api_key column (plugin no longer used)
ALTER TABLE projects DROP COLUMN IF EXISTS writgo_api_key;

-- Remove index for writgo_api_key
DROP INDEX IF EXISTS idx_projects_writgo_api_key;

-- Add comments explaining the columns
COMMENT ON COLUMN projects.wp_username IS 'WordPress username for Application Password authentication';
COMMENT ON COLUMN projects.wp_password IS 'WordPress Application Password for REST API access (generate in WordPress Users > Profile > Application Passwords)';
COMMENT ON COLUMN projects.wp_url IS 'WordPress site URL (e.g., https://example.com)';
