-- ============================================
-- CRITICAL FIXES MIGRATION
-- Fixes missing columns, constraints, and tables
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add missing word_count column to articles
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;

-- 2. Add missing project_id column to articles (if not exists)
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_articles_project_id ON articles(project_id);

-- 3. Create content_plan_jobs table if not exists
CREATE TABLE IF NOT EXISTS content_plan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  website_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0,
  current_step TEXT,
  niche TEXT,
  language TEXT,
  target_count INTEGER,
  competition_level TEXT,
  reasoning TEXT,
  plan JSONB,
  clusters JSONB,
  stats JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_plan_jobs_user_id ON content_plan_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_content_plan_jobs_project_id ON content_plan_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_content_plan_jobs_status ON content_plan_jobs(status);
CREATE INDEX IF NOT EXISTS idx_content_plan_jobs_created_at ON content_plan_jobs(created_at DESC);

-- RLS Policies for content_plan_jobs
ALTER TABLE content_plan_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own jobs" ON content_plan_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs" ON content_plan_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all jobs" ON content_plan_jobs
  FOR ALL USING (true);

-- 4. Create content_plans table if not exists (for saved plans)
CREATE TABLE IF NOT EXISTS content_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  niche TEXT,
  language TEXT,
  target_count INTEGER,
  competition_level TEXT,
  reasoning TEXT,
  plan JSONB NOT NULL,
  clusters JSONB,
  stats JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_content_plans_project_id ON content_plans(project_id);

-- RLS for content_plans
ALTER TABLE content_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their project plans" ON content_plans
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage their project plans" ON content_plans
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- 5. Fix case sensitivity: Ensure projects table exists (not Project)
-- This is already correct in existing migrations

-- 6. Add missing columns to article_jobs (writer background jobs)
CREATE TABLE IF NOT EXISTS article_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT,
  meta_description TEXT,
  article_content TEXT,
  featured_image TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0,
  current_step TEXT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_article_jobs_user_id ON article_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_article_jobs_project_id ON article_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_article_jobs_status ON article_jobs(status);

-- RLS for article_jobs
ALTER TABLE article_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own article jobs" ON article_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own article jobs" ON article_jobs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all article jobs" ON article_jobs
  FOR ALL USING (true);

-- 7. Update articles table with all missing fields
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS excerpt TEXT,
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
ADD COLUMN IF NOT EXISTS featured_image TEXT,
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id);

-- Create unique constraint on slug if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'articles_slug_key'
  ) THEN
    ALTER TABLE articles ADD CONSTRAINT articles_slug_key UNIQUE (slug);
  END IF;
END $$;

-- 8. Ensure projects table has all necessary columns
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS wp_app_password TEXT; -- Modern WordPress app passwords instead of wp_password

-- ============================================
-- VERIFICATION QUERIES
-- Run these after migration to verify:
-- ============================================

-- Check articles columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'articles' 
ORDER BY ordinal_position;

-- Check content_plan_jobs status constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%content_plan_jobs_status%';

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('articles', 'projects', 'content_plan_jobs', 'content_plans', 'article_jobs')
ORDER BY table_name;
