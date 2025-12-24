-- Backlink Exchange Network
-- Allows users to participate in automatic backlink exchange across all WritGo users

-- Add backlink exchange settings to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS participate_in_backlink_exchange BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS backlink_exchange_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS max_outbound_backlinks INTEGER DEFAULT 5;

-- Comments for documentation
COMMENT ON COLUMN projects.participate_in_backlink_exchange IS 'Opt-in to exchange backlinks with other WritGo users';
COMMENT ON COLUMN projects.backlink_exchange_category IS 'Category/niche for matching relevant sites (e.g., "SEO", "WordPress", "Marketing")';
COMMENT ON COLUMN projects.max_outbound_backlinks IS 'Maximum number of external backlinks to include per article (default 5)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_backlink_exchange
ON projects(participate_in_backlink_exchange, backlink_exchange_category)
WHERE participate_in_backlink_exchange = true;

-- Create backlink exchange stats table (optional, for tracking)
CREATE TABLE IF NOT EXISTS backlink_exchange_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  linked_to_project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  linked_to_article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article_id, linked_to_article_id)
);

-- Create index for stats
CREATE INDEX IF NOT EXISTS idx_backlink_stats_project
ON backlink_exchange_stats(project_id);

CREATE INDEX IF NOT EXISTS idx_backlink_stats_linked_project
ON backlink_exchange_stats(linked_to_project_id);

-- Enable RLS on stats table
ALTER TABLE backlink_exchange_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own backlink stats
CREATE POLICY "Users can view own backlink stats" ON backlink_exchange_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = backlink_exchange_stats.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Policy: System can insert backlink stats (via service role)
CREATE POLICY "System can insert backlink stats" ON backlink_exchange_stats
  FOR INSERT WITH CHECK (true);
