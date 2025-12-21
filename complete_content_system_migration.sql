-- Complete Content Trigger System Migration
-- This includes: Queue table fixes + Content Triggers + Affiliate Tools

-- ============================================
-- PART 1: FIX WRITGO_CONTENT_QUEUE
-- ============================================

-- Add missing columns to writgo_content_queue
ALTER TABLE writgo_content_queue 
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS excerpt TEXT,
  ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- Update status check constraint
ALTER TABLE writgo_content_queue DROP CONSTRAINT IF EXISTS writgo_content_queue_status_check;
ALTER TABLE writgo_content_queue 
  ADD CONSTRAINT writgo_content_queue_status_check 
  CHECK (status IN ('queued', 'generating', 'completed', 'failed', 'scheduled', 'published'));

-- Make keyword_id optional
ALTER TABLE writgo_content_queue 
  ALTER COLUMN keyword_id DROP NOT NULL;

-- ============================================
-- PART 2: CONTENT TRIGGERS SYSTEM
-- ============================================

-- Content trigger sources (RSS feeds, APIs, etc.)
CREATE TABLE IF NOT EXISTS writgo_content_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('rss_feed', 'api', 'web_scrape', 'manual')),
  source_url TEXT,
  check_frequency_hours INTEGER DEFAULT 6,
  is_active BOOLEAN DEFAULT true,
  keywords TEXT[], -- Keywords to monitor for
  last_checked_at TIMESTAMP WITH TIME ZONE,
  last_success_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detected content opportunities from triggers
CREATE TABLE IF NOT EXISTS writgo_content_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id UUID REFERENCES writgo_content_triggers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_url TEXT,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'detected' CHECK (status IN ('detected', 'researching', 'generating', 'queued', 'published', 'rejected')),
  priority INTEGER DEFAULT 5, -- 1-10, higher = more important
  metadata JSONB, -- Store raw data from source
  research_data JSONB, -- Store research findings
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research cache to avoid re-fetching same data
CREATE TABLE IF NOT EXISTS writgo_research_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  results JSONB NOT NULL,
  source TEXT, -- 'web_search', 'rss', etc.
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate tools database
CREATE TABLE IF NOT EXISTS writgo_affiliate_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'seo', 'ai', 'wordpress', etc.
  has_affiliate BOOLEAN DEFAULT false,
  affiliate_commission TEXT,
  affiliate_signup_url TEXT,
  priority INTEGER DEFAULT 5,
  keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_content_triggers_active ON writgo_content_triggers(is_active);
CREATE INDEX IF NOT EXISTS idx_content_triggers_last_checked ON writgo_content_triggers(last_checked_at);
CREATE INDEX IF NOT EXISTS idx_content_opportunities_status ON writgo_content_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_content_opportunities_detected ON writgo_content_opportunities(detected_at);
CREATE INDEX IF NOT EXISTS idx_research_cache_query ON writgo_research_cache(query);
CREATE INDEX IF NOT EXISTS idx_research_cache_expires ON writgo_research_cache(expires_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE writgo_content_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE writgo_content_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE writgo_research_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE writgo_affiliate_tools ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read on triggers" ON writgo_content_triggers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on opportunities" ON writgo_content_opportunities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on research cache" ON writgo_research_cache
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on affiliate tools" ON writgo_affiliate_tools
  FOR SELECT TO authenticated USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role all on triggers" ON writgo_content_triggers
  FOR ALL TO service_role USING (true);

CREATE POLICY "Allow service role all on opportunities" ON writgo_content_opportunities
  FOR ALL TO service_role USING (true);

CREATE POLICY "Allow service role all on research cache" ON writgo_research_cache
  FOR ALL TO service_role USING (true);

CREATE POLICY "Allow service role all on affiliate tools" ON writgo_affiliate_tools
  FOR ALL TO service_role USING (true);

-- ============================================
-- DEFAULT DATA: CONTENT TRIGGERS
-- ============================================

INSERT INTO writgo_content_triggers (name, trigger_type, source_url, keywords) VALUES
  -- Google / SEO Sources
  ('Google Search Central Blog', 'rss_feed', 'https://developers.google.com/search/blog/feeds/posts/default', ARRAY['google', 'seo', 'search', 'algorithm']),
  ('Search Engine Journal', 'rss_feed', 'https://www.searchenginejournal.com/feed/', ARRAY['seo', 'google', 'search']),
  ('Search Engine Land', 'rss_feed', 'https://searchengineland.com/feed', ARRAY['seo', 'google', 'search']),
  ('Moz Blog', 'rss_feed', 'https://moz.com/blog/feed', ARRAY['seo', 'search', 'ranking']),
  ('Ahrefs Blog', 'rss_feed', 'https://ahrefs.com/blog/feed/', ARRAY['seo', 'backlinks', 'keywords']),
  
  -- AI Sources
  ('OpenAI Blog', 'rss_feed', 'https://openai.com/blog/rss.xml', ARRAY['ai', 'gpt', 'chatgpt', 'openai']),
  ('Anthropic News', 'rss_feed', 'https://www.anthropic.com/news/rss.xml', ARRAY['ai', 'claude', 'anthropic']),
  ('Google AI Blog', 'rss_feed', 'http://googleaiblog.blogspot.com/atom.xml', ARRAY['ai', 'google', 'gemini']),
  ('Hugging Face Blog', 'rss_feed', 'https://huggingface.co/blog/feed.xml', ARRAY['ai', 'ml', 'models']),
  
  -- Tech News
  ('TechCrunch AI', 'rss_feed', 'https://techcrunch.com/category/artificial-intelligence/feed/', ARRAY['ai', 'tech', 'news']),
  ('VentureBeat AI', 'rss_feed', 'https://venturebeat.com/category/ai/feed/', ARRAY['ai', 'tech', 'news']),
  ('The Verge AI', 'rss_feed', 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', ARRAY['ai', 'tech']),
  
  -- WordPress
  ('WordPress News', 'rss_feed', 'https://wordpress.org/news/feed/', ARRAY['wordpress', 'cms']),
  ('WPBeginner', 'rss_feed', 'https://www.wpbeginner.com/feed/', ARRAY['wordpress', 'tutorials']),
  ('Yoast SEO Blog', 'rss_feed', 'https://yoast.com/feed/', ARRAY['wordpress', 'seo', 'yoast'])
ON CONFLICT DO NOTHING;

-- ============================================
-- DEFAULT DATA: AFFILIATE TOOLS (TOP 20)
-- ============================================

INSERT INTO writgo_affiliate_tools (name, category, has_affiliate, affiliate_commission, affiliate_signup_url, priority, keywords) VALUES
  -- SEO Tools
  ('Ahrefs', 'seo', true, '20% recurring', 'https://ahrefs.com/affiliates', 10, ARRAY['seo', 'backlinks', 'keywords', 'rank tracking']),
  ('SEMrush', 'seo', true, '40% recurring', 'https://www.semrush.com/partners/', 10, ARRAY['seo', 'keywords', 'competitor analysis']),
  ('Surfer SEO', 'seo', true, '25% recurring', 'https://surferseo.com/affiliates/', 9, ARRAY['seo', 'content optimization', 'on-page']),
  ('Mangools', 'seo', true, '30% recurring', 'https://mangools.com/affiliates', 8, ARRAY['seo', 'keywords', 'serp']),
  ('SE Ranking', 'seo', true, '30% recurring', 'https://seranking.com/affiliate-program.html', 8, ARRAY['seo', 'rank tracking', 'audit']),
  
  -- AI Writing Tools
  ('Jasper AI', 'ai', true, '30% recurring', 'https://www.jasper.ai/affiliates', 9, ARRAY['ai', 'content', 'writing']),
  ('Copy.ai', 'ai', true, '30% recurring', 'https://www.copy.ai/affiliate-program', 8, ARRAY['ai', 'copywriting', 'content']),
  ('Writesonic', 'ai', true, '30% recurring', 'https://writesonic.com/affiliate', 8, ARRAY['ai', 'writing', 'content']),
  
  -- WordPress Hosting
  ('WP Engine', 'wordpress', true, '$200 per sale', 'https://wpengine.com/affiliate/', 9, ARRAY['wordpress', 'hosting', 'managed']),
  ('Kinsta', 'wordpress', true, '$50-500 per sale', 'https://kinsta.com/affiliates/', 9, ARRAY['wordpress', 'hosting', 'premium']),
  
  -- WordPress Plugins
  ('Elementor Pro', 'wordpress', true, '50% first payment', 'https://elementor.com/affiliates/', 8, ARRAY['wordpress', 'page builder', 'design']),
  ('Rank Math', 'wordpress', true, '20% recurring', 'https://rankmath.com/affiliates/', 9, ARRAY['wordpress', 'seo', 'plugin']),
  ('WP Rocket', 'wordpress', true, '20% per sale', 'https://wp-rocket.me/affiliate-program/', 8, ARRAY['wordpress', 'caching', 'speed']),
  
  -- Tools without affiliate (for reference)
  ('ChatGPT', 'ai', false, NULL, NULL, 10, ARRAY['ai', 'chatbot', 'gpt']),
  ('Claude', 'ai', false, NULL, NULL, 10, ARRAY['ai', 'chatbot', 'anthropic']),
  ('Google Search Console', 'seo', false, NULL, NULL, 10, ARRAY['google', 'seo', 'search']),
  ('Google Analytics', 'analytics', false, NULL, NULL, 9, ARRAY['analytics', 'tracking', 'google']),
  ('Yoast SEO', 'wordpress', false, NULL, NULL, 9, ARRAY['wordpress', 'seo', 'plugin']),
  ('WordPress', 'wordpress', false, NULL, NULL, 10, ARRAY['wordpress', 'cms']),
  ('Gutenberg', 'wordpress', false, NULL, NULL, 7, ARRAY['wordpress', 'editor', 'blocks'])
ON CONFLICT DO NOTHING;
