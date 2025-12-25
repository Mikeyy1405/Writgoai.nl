-- Migration: Add social media post and missing fields to article_jobs
-- This migration adds:
-- - social_media_post: for generated social media content
-- - article_id: link to the saved article in articles table
-- - keyword: the focus keyword used for generation
-- - description: article description/brief
-- - content_type: type of content generated

-- Add missing columns to article_jobs
ALTER TABLE article_jobs
ADD COLUMN IF NOT EXISTS social_media_post TEXT,
ADD COLUMN IF NOT EXISTS article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS keyword TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'article',
ADD COLUMN IF NOT EXISTS word_count INTEGER,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'nl';

-- Create index for article_id lookups
CREATE INDEX IF NOT EXISTS idx_article_jobs_article_id ON article_jobs(article_id);

-- Add comments for documentation
COMMENT ON COLUMN article_jobs.social_media_post IS 'AI-generated social media post to promote the article';
COMMENT ON COLUMN article_jobs.article_id IS 'Reference to the saved article in articles table';
COMMENT ON COLUMN article_jobs.keyword IS 'Focus keyword used for article generation';
COMMENT ON COLUMN article_jobs.description IS 'Brief description/context for article';
COMMENT ON COLUMN article_jobs.content_type IS 'Type of content: article, guide, tutorial, etc.';
COMMENT ON COLUMN article_jobs.word_count IS 'Target word count for generation';
COMMENT ON COLUMN article_jobs.language IS 'Language code (nl, en, de)';
