-- ============================================
-- TOPICAL AUTHORITY SYSTEM MIGRATION
-- ============================================
-- This migration adds tables for the AI-powered topical authority system
-- No RSS feeds - uses Perplexity AI via AIML API for content discovery

-- ============================================
-- 1. TOPICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS writgo_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL, -- 1-5 (1 = highest)
  target_percentage INTEGER NOT NULL, -- 40 = 40% of content
  color TEXT, -- For UI visualization
  icon TEXT, -- Emoji or icon name
  pillar_page_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default topics based on TOPICAL_AUTHORITY_STRATEGY.md
INSERT INTO writgo_topics (name, slug, priority, target_percentage, color, icon, description) VALUES
  ('Google SEO Updates', 'google-seo-updates', 1, 40, '#4285F4', '🔍', 'Core updates, algorithm changes, Search Console features, ranking factors'),
  ('AI & SEO', 'ai-seo', 2, 30, '#EA4335', '🤖', 'ChatGPT voor SEO, AI content tools, AI-powered keyword research, future of AI in search'),
  ('WordPress SEO', 'wordpress-seo', 3, 20, '#21759B', '📝', 'Yoast optimization, technical WP SEO, speed optimization, schema voor WordPress'),
  ('Content Marketing', 'content-marketing', 4, 10, '#34A853', '💡', 'SEO copywriting, content strategie, link building, E-E-A-T'),
  ('Local SEO', 'local-seo', 5, 0, '#FBBC04', '📍', 'Google Business Profile, local rankings, citations')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 2. KEYWORD CLUSTERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS writgo_keyword_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES writgo_topics(id) ON DELETE CASCADE,
  cluster_name TEXT NOT NULL,
  pillar_keyword TEXT NOT NULL,
  keywords JSONB NOT NULL DEFAULT '[]', -- Array of related keywords
  search_volume INTEGER DEFAULT 0,
  difficulty INTEGER DEFAULT 0, -- 0-100
  content_type TEXT NOT NULL CHECK (content_type IN ('pillar', 'cluster', 'supporting')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  article_count INTEGER DEFAULT 0, -- How many articles in this cluster
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_keyword_clusters_topic ON writgo_keyword_clusters(topic_id);
CREATE INDEX IF NOT EXISTS idx_keyword_clusters_type ON writgo_keyword_clusters(content_type);
CREATE INDEX IF NOT EXISTS idx_keyword_clusters_status ON writgo_keyword_clusters(status);

-- ============================================
-- 3. CONTENT CALENDAR TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS writgo_content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES writgo_topics(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES writgo_keyword_clusters(id) ON DELETE SET NULL,
  planned_date DATE NOT NULL,
  planned_time TIME DEFAULT '09:00:00',
  content_type TEXT NOT NULL CHECK (content_type IN ('pillar', 'cluster', 'supporting')),
  title TEXT,
  focus_keyword TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'generating', 'queued', 'published', 'skipped')),
  priority_score INTEGER DEFAULT 0, -- 0-1000
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}', -- Additional planning data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON writgo_content_calendar(planned_date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON writgo_content_calendar(status);
CREATE INDEX IF NOT EXISTS idx_content_calendar_topic ON writgo_content_calendar(topic_id);

-- ============================================
-- 4. TOPICAL AUTHORITY METRICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS writgo_topical_authority_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES writgo_topics(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  authority_score DECIMAL(5,2) DEFAULT 0, -- 0-100
  article_count INTEGER DEFAULT 0,
  pillar_count INTEGER DEFAULT 0,
  cluster_count INTEGER DEFAULT 0,
  ai_overview_count INTEGER DEFAULT 0, -- How many AI Overview appearances
  avg_ranking DECIMAL(5,2) DEFAULT 0,
  total_traffic INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  avg_ctr DECIMAL(5,4) DEFAULT 0,
  internal_links_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(topic_id, date)
);

CREATE INDEX IF NOT EXISTS idx_authority_metrics_topic_date ON writgo_topical_authority_metrics(topic_id, date);

-- ============================================
-- 5. INTERNAL LINKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS writgo_internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  target_article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  anchor_text TEXT NOT NULL,
  link_type TEXT CHECK (link_type IN ('pillar_to_cluster', 'cluster_to_pillar', 'cluster_to_cluster', 'supporting')),
  semantic_score DECIMAL(5,4) DEFAULT 0, -- 0-1, how semantically related
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_article_id, target_article_id, anchor_text)
);

CREATE INDEX IF NOT EXISTS idx_internal_links_source ON writgo_internal_links(source_article_id);
CREATE INDEX IF NOT EXISTS idx_internal_links_target ON writgo_internal_links(target_article_id);

-- ============================================
-- 6. UPDATE CONTENT OPPORTUNITIES TABLE
-- ============================================
-- Add new columns for topical authority system
ALTER TABLE writgo_content_opportunities 
  ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES writgo_topics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cluster_id UUID REFERENCES writgo_keyword_clusters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS content_type TEXT CHECK (content_type IN ('pillar', 'cluster', 'supporting')),
  ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS relevance_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS freshness_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS authority_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discovery_source TEXT; -- 'ai', 'gsc', 'keyword_research', 'manual'

CREATE INDEX IF NOT EXISTS idx_opportunities_topic ON writgo_content_opportunities(topic_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_score ON writgo_content_opportunities(priority_score);
CREATE INDEX IF NOT EXISTS idx_opportunities_discovery ON writgo_content_opportunities(discovery_source);

-- ============================================
-- 7. UPDATE ARTICLES TABLE
-- ============================================
-- Add columns to track topical authority
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES writgo_topics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cluster_id UUID REFERENCES writgo_keyword_clusters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS content_type TEXT CHECK (content_type IN ('pillar', 'cluster', 'supporting')),
  ADD COLUMN IF NOT EXISTS ai_overview_optimized BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS schema_markup JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_articles_topic ON articles(topic_id);
CREATE INDEX IF NOT EXISTS idx_articles_cluster ON articles(cluster_id);
CREATE INDEX IF NOT EXISTS idx_articles_content_type ON articles(content_type);

-- ============================================
-- 8. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE writgo_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE writgo_keyword_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE writgo_content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE writgo_topical_authority_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE writgo_internal_links ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read on topics" ON writgo_topics
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on keyword_clusters" ON writgo_keyword_clusters
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on content_calendar" ON writgo_content_calendar
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on authority_metrics" ON writgo_topical_authority_metrics
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on internal_links" ON writgo_internal_links
  FOR SELECT TO authenticated USING (true);

-- Allow service role to insert/update/delete
CREATE POLICY "Allow service role full access on topics" ON writgo_topics
  FOR ALL TO service_role USING (true);

CREATE POLICY "Allow service role full access on keyword_clusters" ON writgo_keyword_clusters
  FOR ALL TO service_role USING (true);

CREATE POLICY "Allow service role full access on content_calendar" ON writgo_content_calendar
  FOR ALL TO service_role USING (true);

CREATE POLICY "Allow service role full access on authority_metrics" ON writgo_topical_authority_metrics
  FOR ALL TO service_role USING (true);

CREATE POLICY "Allow service role full access on internal_links" ON writgo_internal_links
  FOR ALL TO service_role USING (true);

-- ============================================
-- 9. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_writgo_topics_updated_at BEFORE UPDATE ON writgo_topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_writgo_keyword_clusters_updated_at BEFORE UPDATE ON writgo_keyword_clusters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_writgo_content_calendar_updated_at BEFORE UPDATE ON writgo_content_calendar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate authority score
CREATE OR REPLACE FUNCTION calculate_authority_score(topic_id_param UUID)
RETURNS DECIMAL AS $$
DECLARE
  score DECIMAL := 0;
  article_cnt INTEGER;
  pillar_cnt INTEGER;
  cluster_cnt INTEGER;
  avg_rank DECIMAL;
BEGIN
  -- Get counts
  SELECT COUNT(*) INTO article_cnt FROM articles WHERE topic_id = topic_id_param AND status = 'published';
  SELECT COUNT(*) INTO pillar_cnt FROM articles WHERE topic_id = topic_id_param AND content_type = 'pillar' AND status = 'published';
  SELECT COUNT(*) INTO cluster_cnt FROM articles WHERE topic_id = topic_id_param AND content_type = 'cluster' AND status = 'published';
  SELECT AVG(avg_position) INTO avg_rank FROM articles WHERE topic_id = topic_id_param AND status = 'published' AND avg_position IS NOT NULL;
  
  -- Calculate score (0-100)
  score := LEAST(100, (
    (pillar_cnt * 10) + -- 10 points per pillar
    (cluster_cnt * 5) + -- 5 points per cluster
    (article_cnt * 2) + -- 2 points per article
    (CASE WHEN avg_rank IS NOT NULL THEN (100 - avg_rank) / 2 ELSE 0 END) -- Ranking bonus
  ));
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Run this migration in Supabase SQL Editor
-- Then the API endpoints can use these tables
