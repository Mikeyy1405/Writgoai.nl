-- WritGo.nl Blog & AutoPilot System Migration (CLEAN VERSION)
-- This drops existing tables and creates fresh ones

-- ============================================
-- DROP EXISTING TABLES (if they exist)
-- ============================================

DROP TABLE IF EXISTS writgo_content_queue CASCADE;
DROP TABLE IF EXISTS writgo_activity_logs CASCADE;
DROP TABLE IF EXISTS writgo_performance_insights CASCADE;
DROP TABLE IF EXISTS writgo_gsc_data CASCADE;
DROP TABLE IF EXISTS writgo_keywords CASCADE;
DROP TABLE IF EXISTS writgo_autopilot_config CASCADE;
DROP TABLE IF EXISTS article_tag_mapping CASCADE;
DROP TABLE IF EXISTS article_category_mapping CASCADE;
DROP TABLE IF EXISTS article_tags CASCADE;
DROP TABLE IF EXISTS article_categories CASCADE;
DROP TABLE IF EXISTS articles CASCADE;

-- ============================================
-- BLOG SYSTEM TABLES
-- ============================================

-- Articles table for blog posts
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  meta_title TEXT,
  meta_description TEXT,
  focus_keyword TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  author_id UUID REFERENCES auth.users(id),
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  avg_position DECIMAL(5,2),
  ctr DECIMAL(5,4)
);

-- Article categories
CREATE TABLE article_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Article to category mapping (many-to-many)
CREATE TABLE article_category_mapping (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES article_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, category_id)
);

-- Article tags
CREATE TABLE article_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Article to tag mapping (many-to-many)
CREATE TABLE article_tag_mapping (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES article_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- ============================================
-- AUTOPILOT SYSTEM TABLES
-- ============================================

-- AutoPilot configuration for WritGo.nl
CREATE TABLE writgo_autopilot_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT false,
  strategies JSONB DEFAULT '{"link_magnet": true, "low_ctr": true, "striking_distance": true, "content_gap": true}'::jsonb,
  content_frequency TEXT DEFAULT 'weekly' CHECK (content_frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  target_keywords TEXT[],
  language TEXT DEFAULT 'nl',
  tone TEXT DEFAULT 'professional',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Keyword research results
CREATE TABLE writgo_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  competition TEXT,
  difficulty INTEGER,
  cpc DECIMAL(10,2),
  trend TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'published', 'rejected')),
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Google Search Console data for WritGo.nl
CREATE TABLE writgo_gsc_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  page TEXT NOT NULL,
  query TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr DECIMAL(5,4),
  position DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, page, query)
);

-- Performance insights and recommendations
CREATE TABLE writgo_performance_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('low_ctr', 'striking_distance', 'link_magnet', 'content_gap', 'declining_traffic')),
  description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed')),
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs for AutoPilot actions
CREATE TABLE writgo_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  keyword_id UUID REFERENCES writgo_keywords(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error', 'warning')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content generation queue
CREATE TABLE writgo_content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID REFERENCES writgo_keywords(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  outline JSONB,
  priority INTEGER DEFAULT 0,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'generating', 'completed', 'failed')),
  error_message TEXT,
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_writgo_gsc_data_date ON writgo_gsc_data(date DESC);
CREATE INDEX idx_writgo_gsc_data_page ON writgo_gsc_data(page);
CREATE INDEX idx_writgo_keywords_status ON writgo_keywords(status);
CREATE INDEX idx_writgo_performance_insights_status ON writgo_performance_insights(status, priority);
CREATE INDEX idx_writgo_content_queue_status ON writgo_content_queue(status, priority DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE writgo_autopilot_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE writgo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE writgo_gsc_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE writgo_performance_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE writgo_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE writgo_content_queue ENABLE ROW LEVEL SECURITY;

-- Public read access for published articles
CREATE POLICY "Public can view published articles" ON articles
  FOR SELECT USING (status = 'published');

-- Authenticated users can manage all articles
CREATE POLICY "Authenticated users can manage articles" ON articles
  FOR ALL USING (auth.role() = 'authenticated');

-- Public read access for categories and tags
CREATE POLICY "Public can view categories" ON article_categories
  FOR SELECT USING (true);

CREATE POLICY "Public can view tags" ON article_tags
  FOR SELECT USING (true);

-- Authenticated users can manage categories and tags
CREATE POLICY "Authenticated users can manage categories" ON article_categories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage tags" ON article_tags
  FOR ALL USING (auth.role() = 'authenticated');

-- Authenticated users can access all AutoPilot data
CREATE POLICY "Authenticated users can access autopilot config" ON writgo_autopilot_config
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access keywords" ON writgo_keywords
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access GSC data" ON writgo_gsc_data
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access performance insights" ON writgo_performance_insights
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access activity logs" ON writgo_activity_logs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access content queue" ON writgo_content_queue
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- FUNCTIONS
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
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_writgo_autopilot_config_updated_at BEFORE UPDATE ON writgo_autopilot_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_writgo_keywords_updated_at BEFORE UPDATE ON writgo_keywords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_writgo_performance_insights_updated_at BEFORE UPDATE ON writgo_performance_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default AutoPilot configuration
INSERT INTO writgo_autopilot_config (enabled, strategies, content_frequency, language, tone)
VALUES (
  false,
  '{"link_magnet": true, "low_ctr": true, "striking_distance": true, "content_gap": true}'::jsonb,
  'weekly',
  'nl',
  'professional'
);

-- Insert default categories
INSERT INTO article_categories (name, slug, description) VALUES
  ('SEO', 'seo', 'Alles over zoekmachine optimalisatie'),
  ('WordPress', 'wordpress', 'WordPress tips en tutorials'),
  ('AI & Automatisering', 'ai-automatisering', 'Kunstmatige intelligentie en automatisering'),
  ('Content Marketing', 'content-marketing', 'Content marketing strategieën'),
  ('Tutorials', 'tutorials', 'Stap-voor-stap handleidingen');

-- Insert default tags
INSERT INTO article_tags (name, slug) VALUES
  ('SEO', 'seo'),
  ('WordPress', 'wordpress'),
  ('AI', 'ai'),
  ('Content', 'content'),
  ('Automatisering', 'automatisering'),
  ('Google', 'google'),
  ('Ranking', 'ranking'),
  ('Keywords', 'keywords');
