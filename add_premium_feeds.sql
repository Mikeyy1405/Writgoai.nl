-- Delete old/low-quality feeds and add premium RSS feeds
-- Focus on: Google Core Updates, AI Model releases, High-quality SEO news

-- First, deactivate all existing feeds
UPDATE writgo_content_triggers 
SET is_active = false 
WHERE trigger_type = 'rss_feed';

-- Delete existing feeds to start fresh
DELETE FROM writgo_content_triggers WHERE trigger_type = 'rss_feed';

-- GOOGLE OFFICIAL (Highest Priority)
INSERT INTO writgo_content_triggers (name, trigger_type, category, source_url, check_frequency, priority, is_active) VALUES
('Google Search Central Blog', 'rss_feed', 'seo', 'https://developers.google.com/search/blog/feeds/posts/default', 'hourly', 10, true),
('Google AI Blog', 'rss_feed', 'ai', 'https://blog.google/technology/ai/rss/', 'daily', 9, true),
('Google Research Blog', 'rss_feed', 'ai', 'https://research.google/blog/feed/', 'daily', 8, true);

-- AI MODEL UPDATES (Critical for AI news)
INSERT INTO writgo_content_triggers (name, trigger_type, category, source_url, check_frequency, priority, is_active) VALUES
('OpenAI News', 'rss_feed', 'ai', 'https://openai.com/news/rss.xml', 'hourly', 10, true),
('Anthropic News', 'rss_feed', 'ai', 'https://www.anthropic.com/news/rss.xml', 'daily', 9, true);

-- PREMIUM SEO NEWS
INSERT INTO writgo_content_triggers (name, trigger_type, category, source_url, check_frequency, priority, is_active) VALUES
('Search Engine Land', 'rss_feed', 'seo', 'https://searchengineland.com/feed', 'hourly', 9, true),
('Search Engine Journal', 'rss_feed', 'seo', 'https://www.searchenginejournal.com/feed/', 'daily', 9, true),
('Ahrefs Blog', 'rss_feed', 'seo', 'https://ahrefs.com/blog/feed/', 'daily', 8, true),
('Moz Blog', 'rss_feed', 'seo', 'https://moz.com/blog/feed', 'daily', 8, true);

-- WORDPRESS & SEO
INSERT INTO writgo_content_triggers (name, trigger_type, category, source_url, check_frequency, priority, is_active) VALUES
('Yoast SEO Blog', 'rss_feed', 'wordpress', 'https://yoast.com/feed/', 'daily', 8, true),
('WordPress News', 'rss_feed', 'wordpress', 'https://wordpress.org/news/feed/', 'daily', 7, true),
('WPBeginner', 'rss_feed', 'wordpress', 'https://www.wpbeginner.com/feed/', 'weekly', 7, true);

-- TECH & AI NEWS (Lower priority, but good for variety)
INSERT INTO writgo_content_triggers (name, trigger_type, category, source_url, check_frequency, priority, is_active) VALUES
('TechCrunch AI', 'rss_feed', 'ai', 'https://techcrunch.com/category/artificial-intelligence/feed/', 'daily', 7, true),
('The Verge AI', 'rss_feed', 'ai', 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml', 'daily', 7, true);

-- Verify the feeds
SELECT 
  name,
  category,
  priority,
  check_frequency,
  is_active,
  source_url
FROM writgo_content_triggers
WHERE trigger_type = 'rss_feed'
ORDER BY priority DESC, category, name;
