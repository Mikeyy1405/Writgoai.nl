-- Affiliate Opportunities Discovery System Migration
-- This creates the table for tracking affiliate opportunities detected in content

-- Create affiliate_opportunities table
CREATE TABLE IF NOT EXISTS affiliate_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  brand_name TEXT,
  mentioned_at TEXT, -- Location in article (e.g., "Paragraph 3", "Section 2")
  context TEXT, -- Context in which product is mentioned
  affiliate_programs JSONB DEFAULT '[]'::jsonb, -- Array of found programs
  status TEXT DEFAULT 'discovered' CHECK (status IN ('discovered', 'researching', 'signed_up', 'active', 'dismissed')),
  research_completed BOOLEAN DEFAULT false,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliate_opps_project ON affiliate_opportunities(project_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_opps_article ON affiliate_opportunities(article_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_opps_status ON affiliate_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_opps_discovered_at ON affiliate_opportunities(discovered_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_affiliate_opportunities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_affiliate_opportunities_updated_at
  BEFORE UPDATE ON affiliate_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_opportunities_updated_at();

-- Add comment for documentation
COMMENT ON TABLE affiliate_opportunities IS 'Tracks affiliate opportunities detected in generated content for automatic affiliate program discovery';
