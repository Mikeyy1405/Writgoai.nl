-- WritGo Self-Promotion Migration
-- Enables automatic content generation for promoting WritGo itself
-- This system generates blogs and social posts to attract customers

-- Create writgo_self_promotion_config table
CREATE TABLE IF NOT EXISTS writgo_self_promotion_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Self-promotion settings
  enabled BOOLEAN DEFAULT true,

  -- Blog generation settings
  blog_enabled BOOLEAN DEFAULT true,
  blog_frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (blog_frequency IN ('daily', 'twice_weekly', 'weekly', 'biweekly', 'monthly')),
  blog_publish_immediately BOOLEAN DEFAULT false,
  blog_schedule_days_ahead INTEGER DEFAULT 1, -- Schedule X days in advance

  -- Social media promotion settings
  social_enabled BOOLEAN DEFAULT true,
  social_frequency TEXT NOT NULL DEFAULT 'daily' CHECK (social_frequency IN ('daily', 'twice_daily', 'three_times_daily', 'weekly')),
  social_post_times TEXT[] DEFAULT ARRAY['10:00', '15:00'],
  social_platforms TEXT[] DEFAULT ARRAY['instagram', 'linkedin', 'twitter'],
  social_publish_immediately BOOLEAN DEFAULT false,

  -- Content variation settings
  use_case_studies BOOLEAN DEFAULT true,
  use_feature_highlights BOOLEAN DEFAULT true,
  use_comparison_posts BOOLEAN DEFAULT true,
  use_tutorial_content BOOLEAN DEFAULT true,
  use_success_stories BOOLEAN DEFAULT true,

  -- Tracking
  last_blog_generated_at TIMESTAMP WITH TIME ZONE,
  last_social_generated_at TIMESTAMP WITH TIME ZONE,
  next_blog_run_at TIMESTAMP WITH TIME ZONE,
  next_social_run_at TIMESTAMP WITH TIME ZONE,

  -- Stats
  total_blogs_generated INTEGER DEFAULT 0,
  total_social_posts_generated INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_self_promo_enabled ON writgo_self_promotion_config(enabled);
CREATE INDEX IF NOT EXISTS idx_self_promo_next_blog ON writgo_self_promotion_config(next_blog_run_at) WHERE enabled = true AND blog_enabled = true;
CREATE INDEX IF NOT EXISTS idx_self_promo_next_social ON writgo_self_promotion_config(next_social_run_at) WHERE enabled = true AND social_enabled = true;

-- Create writgo_self_promotion_templates table for content templates
CREATE TABLE IF NOT EXISTS writgo_self_promotion_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template info
  template_type TEXT NOT NULL CHECK (template_type IN ('blog', 'social')),
  category TEXT NOT NULL CHECK (category IN (
    'feature_highlight',
    'use_case',
    'tutorial',
    'comparison',
    'success_story',
    'tips_tricks',
    'announcement',
    'case_study'
  )),

  -- Content
  title_template TEXT NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,
  keywords TEXT[], -- SEO keywords for blogs

  -- Social specific
  post_type TEXT CHECK (post_type IN ('educational', 'promotional', 'storytelling', 'engagement')),

  -- Targeting
  target_audience TEXT, -- e.g., "bloggers", "agencies", "entrepreneurs"

  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,

  -- Status
  active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_promo_templates_type ON writgo_self_promotion_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_promo_templates_category ON writgo_self_promotion_templates(category);
CREATE INDEX IF NOT EXISTS idx_promo_templates_active ON writgo_self_promotion_templates(active);

-- Insert default blog templates
INSERT INTO writgo_self_promotion_templates (template_type, category, title_template, topic, description, keywords, target_audience) VALUES
-- Feature Highlights
('blog', 'feature_highlight', 'How WritGo''s AI Content Writer Saves You 10+ Hours Per Week', 'AI Content Generation Speed and Efficiency', 'Explain how WritGo''s AI can generate high-quality blog posts in minutes instead of hours', ARRAY['ai content writer', 'content generation', 'save time writing', 'automated content'], 'bloggers, content creators'),
('blog', 'feature_highlight', 'WritGo vs Traditional Content Creation: A Complete Breakdown', 'Comparison between AI and manual writing', 'Compare the benefits of using WritGo AI vs traditional manual content writing', ARRAY['ai vs manual writing', 'content creation tools', 'writgo comparison', 'ai writing benefits'], 'business owners, marketers'),
('blog', 'feature_highlight', 'Why SEO Experts Choose WritGo for Content at Scale', 'SEO optimization and content scaling', 'How WritGo helps SEO professionals create optimized content at scale', ARRAY['seo content', 'content at scale', 'ai seo writing', 'bulk content generation'], 'seo professionals, agencies'),

-- Use Cases
('blog', 'use_case', 'How E-commerce Brands Use WritGo to Boost Product Descriptions', 'E-commerce product content generation', 'Show how e-commerce businesses leverage WritGo for product descriptions and category pages', ARRAY['ecommerce content', 'product descriptions', 'ai product writing', 'online store content'], 'ecommerce owners'),
('blog', 'use_case', '10 Ways Digital Agencies Scale Content Production with WritGo', 'Agency content scaling strategies', 'Demonstrate how agencies use WritGo to serve multiple clients efficiently', ARRAY['agency content', 'scale content production', 'client content', 'agency tools'], 'digital agencies'),
('blog', 'use_case', 'From Blank Page to Published Post: A Blogger''s WritGo Journey', 'Blogger workflow with WritGo', 'Walk through a typical blogger''s workflow using WritGo from idea to published post', ARRAY['blogging workflow', 'blog writing process', 'ai blog assistant', 'content workflow'], 'bloggers'),

-- Tutorials
('blog', 'tutorial', 'Getting Started with WritGo: Your First AI-Generated Blog Post', 'WritGo onboarding tutorial', 'Step-by-step guide for new users to create their first blog post', ARRAY['writgo tutorial', 'ai writing guide', 'getting started', 'first blog post'], 'beginners'),
('blog', 'tutorial', 'Advanced WritGo Techniques: Creating Topical Authority Content Clusters', 'Advanced content strategy with WritGo', 'Teach users how to use WritGo for comprehensive topic cluster creation', ARRAY['topical authority', 'content clusters', 'seo strategy', 'advanced techniques'], 'advanced users, seo experts'),
('blog', 'tutorial', 'How to Optimize WritGo Output for Maximum SEO Performance', 'SEO optimization tips for AI content', 'Guide on editing and optimizing AI-generated content for best SEO results', ARRAY['ai content seo', 'optimize ai writing', 'seo editing', 'content optimization'], 'content creators, marketers'),

-- Comparisons
('blog', 'comparison', 'WritGo vs Jasper vs Copy.ai: Which AI Writer Is Best for Blogs?', 'AI writing tool comparison', 'Honest comparison of WritGo against major competitors', ARRAY['ai writing comparison', 'writgo vs jasper', 'best ai writer', 'ai tools comparison'], 'content creators, entrepreneurs'),
('blog', 'comparison', 'Free vs Paid AI Content Tools: Why WritGo Offers the Best Value', 'Pricing and value comparison', 'Compare pricing models and value proposition of different AI writing tools', ARRAY['ai content pricing', 'best value ai writer', 'affordable ai tools', 'content tool cost'], 'budget-conscious users'),

-- Success Stories
('blog', 'success_story', 'How Sarah Grew Her Blog Traffic 300% Using WritGo', 'Customer success story - blogger', 'Real-world success story of a blogger who scaled with WritGo', ARRAY['blog growth', 'traffic increase', 'success story', 'content results'], 'bloggers, content creators'),
('blog', 'success_story', 'Case Study: Agency Increases Client Content Output by 500%', 'Customer success story - agency', 'How a digital agency transformed their content operations with WritGo', ARRAY['agency case study', 'content scaling', 'client results', 'roi'], 'agencies'),

-- Tips & Tricks
('blog', 'tips_tricks', '15 WritGo Hacks Every Content Creator Should Know', 'WritGo power user tips', 'Share lesser-known features and optimization techniques', ARRAY['writgo tips', 'content hacks', 'productivity tips', 'ai writing tricks'], 'all users'),
('blog', 'tips_tricks', 'The Ultimate WritGo Workflow for Publishing Daily Content', 'Daily content creation workflow', 'Show how to set up an efficient daily publishing routine', ARRAY['content workflow', 'daily publishing', 'content schedule', 'productivity'], 'bloggers, entrepreneurs'),

-- Announcements
('blog', 'announcement', 'Introducing WritGo''s New AI-Powered Content Calendar', 'New feature announcement', 'Announce and explain new WritGo features', ARRAY['new features', 'content calendar', 'writgo updates', 'product announcement'], 'existing users');

-- Insert default social media templates
INSERT INTO writgo_self_promotion_templates (template_type, category, title_template, topic, post_type, target_audience) VALUES
-- Educational
('social', 'tips_tricks', 'Quick WritGo Tip', '3 ways to improve your AI-generated content quality', 'educational', 'content creators'),
('social', 'tutorial', 'WritGo Tutorial', 'How to generate a week''s worth of content in 30 minutes', 'educational', 'busy entrepreneurs'),
('social', 'feature_highlight', 'Feature Spotlight', 'Did you know WritGo can auto-generate internal links?', 'educational', 'seo enthusiasts'),

-- Promotional
('social', 'feature_highlight', 'WritGo Power', 'Create SEO-optimized blog posts 10x faster with AI', 'promotional', 'bloggers'),
('social', 'comparison', 'Why WritGo?', 'Stop spending hours writing. Start creating content in minutes.', 'promotional', 'time-strapped creators'),
('social', 'use_case', 'Perfect For', 'WritGo is perfect for agencies managing multiple client blogs', 'promotional', 'agencies'),

-- Storytelling
('social', 'success_story', 'Success Story', 'How our users are achieving their content goals with WritGo', 'storytelling', 'potential customers'),
('social', 'case_study', 'Real Results', 'Meet the blogger who went from 2 posts/month to 20 with WritGo', 'storytelling', 'bloggers'),

-- Engagement
('social', 'tips_tricks', 'Question to Audience', 'What''s your biggest content creation challenge?', 'engagement', 'all users'),
('social', 'use_case', 'Poll', 'How often do you publish blog content?', 'engagement', 'content creators');

-- Function to calculate next self-promotion run time
CREATE OR REPLACE FUNCTION calculate_next_self_promo_time(
  p_frequency TEXT,
  p_last_run TIMESTAMP WITH TIME ZONE,
  p_is_blog BOOLEAN
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_base_time TIMESTAMP WITH TIME ZONE;
  v_next_time TIMESTAMP WITH TIME ZONE;
BEGIN
  v_base_time := COALESCE(p_last_run, v_now);

  IF p_is_blog THEN
    -- Blog scheduling
    CASE p_frequency
      WHEN 'daily' THEN
        v_next_time := v_base_time + INTERVAL '1 day';
      WHEN 'twice_weekly' THEN
        v_next_time := v_base_time + INTERVAL '3.5 days';
      WHEN 'weekly' THEN
        v_next_time := v_base_time + INTERVAL '7 days';
      WHEN 'biweekly' THEN
        v_next_time := v_base_time + INTERVAL '14 days';
      WHEN 'monthly' THEN
        v_next_time := v_base_time + INTERVAL '30 days';
      ELSE
        v_next_time := v_base_time + INTERVAL '7 days'; -- Default to weekly
    END CASE;
  ELSE
    -- Social scheduling
    CASE p_frequency
      WHEN 'daily' THEN
        v_next_time := v_base_time + INTERVAL '1 day';
      WHEN 'twice_daily' THEN
        v_next_time := v_base_time + INTERVAL '12 hours';
      WHEN 'three_times_daily' THEN
        v_next_time := v_base_time + INTERVAL '8 hours';
      WHEN 'weekly' THEN
        v_next_time := v_base_time + INTERVAL '7 days';
      ELSE
        v_next_time := v_base_time + INTERVAL '1 day'; -- Default to daily
    END CASE;
  END IF;

  RETURN v_next_time;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update next run times
CREATE OR REPLACE FUNCTION update_self_promo_next_run()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.enabled THEN
    IF NEW.blog_enabled THEN
      NEW.next_blog_run_at := calculate_next_self_promo_time(
        NEW.blog_frequency,
        NEW.last_blog_generated_at,
        true
      );
    ELSE
      NEW.next_blog_run_at := NULL;
    END IF;

    IF NEW.social_enabled THEN
      NEW.next_social_run_at := calculate_next_self_promo_time(
        NEW.social_frequency,
        NEW.last_social_generated_at,
        false
      );
    ELSE
      NEW.next_social_run_at := NULL;
    END IF;
  ELSE
    NEW.next_blog_run_at := NULL;
    NEW.next_social_run_at := NULL;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_self_promo_next_run
  BEFORE INSERT OR UPDATE ON writgo_self_promotion_config
  FOR EACH ROW
  EXECUTE FUNCTION update_self_promo_next_run();

-- Insert default configuration (one row only)
INSERT INTO writgo_self_promotion_config (
  enabled,
  blog_enabled,
  blog_frequency,
  blog_publish_immediately,
  social_enabled,
  social_frequency,
  social_post_times,
  social_platforms
) VALUES (
  true,
  true,
  'weekly',
  false,
  true,
  'daily',
  ARRAY['10:00', '16:00'],
  ARRAY['instagram', 'linkedin', 'twitter']
) ON CONFLICT DO NOTHING;

-- Add tracking columns to articles table
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS is_self_promotion BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS promotion_template_id UUID REFERENCES writgo_self_promotion_templates(id) ON DELETE SET NULL;

-- Add tracking columns to social_posts table
ALTER TABLE social_posts
ADD COLUMN IF NOT EXISTS is_self_promotion BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS promotion_template_id UUID REFERENCES writgo_self_promotion_templates(id) ON DELETE SET NULL;

-- Create indexes for self-promotion tracking
CREATE INDEX IF NOT EXISTS idx_articles_self_promo ON articles(is_self_promotion) WHERE is_self_promotion = true;
CREATE INDEX IF NOT EXISTS idx_social_posts_self_promo ON social_posts(is_self_promotion) WHERE is_self_promotion = true;

-- RPC function to increment blog count
CREATE OR REPLACE FUNCTION increment_self_promo_blog_count()
RETURNS void AS $$
BEGIN
  UPDATE writgo_self_promotion_config
  SET total_blogs_generated = total_blogs_generated + 1;
END;
$$ LANGUAGE plpgsql;

-- RPC function to increment social count
CREATE OR REPLACE FUNCTION increment_self_promo_social_count()
RETURNS void AS $$
BEGIN
  UPDATE writgo_self_promotion_config
  SET total_social_posts_generated = total_social_posts_generated + 1;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (uncomment and adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON writgo_self_promotion_config TO authenticated;
-- GRANT SELECT ON writgo_self_promotion_templates TO authenticated;
-- GRANT EXECUTE ON FUNCTION increment_self_promo_blog_count TO authenticated;
-- GRANT EXECUTE ON FUNCTION increment_self_promo_social_count TO authenticated;
