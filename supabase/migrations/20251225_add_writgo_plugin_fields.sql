-- Migration: Add WritGo Connector Plugin fields to projects table
-- Description: Adds writgo_api_key for plugin authentication and removes old wp_username/wp_password fields
-- Date: 2025-12-25

-- Add writgo_api_key column for plugin authentication
ALTER TABLE projects ADD COLUMN IF NOT EXISTS writgo_api_key TEXT;

-- Add index for better performance on API key lookups
CREATE INDEX IF NOT EXISTS idx_projects_writgo_api_key ON projects(writgo_api_key);

-- Add comment explaining the new column
COMMENT ON COLUMN projects.writgo_api_key IS 'API key from WritGo Connector plugin for secure authentication';

-- Note: We keep wp_url, wp_username, wp_password for backward compatibility
-- These will be deprecated in favor of writgo_api_key
