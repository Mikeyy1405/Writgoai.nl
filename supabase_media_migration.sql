-- Media Storage Table
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'image' or 'video'
  url TEXT NOT NULL,
  prompt TEXT,
  model VARCHAR(100),
  alt_text TEXT,
  caption TEXT,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  duration INTEGER, -- for videos, in seconds
  status VARCHAR(20) DEFAULT 'generated',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Generation Logs
CREATE TABLE IF NOT EXISTS ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'text', 'image', 'video'
  model VARCHAR(100) NOT NULL,
  prompt TEXT,
  output TEXT,
  tokens_used INTEGER,
  cost DECIMAL(10, 6),
  duration_ms INTEGER,
  status VARCHAR(20) DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update articles table for media support
ALTER TABLE articles ADD COLUMN IF NOT EXISTS featured_image_id UUID REFERENCES media(id);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS model_used VARCHAR(100);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS generation_time_ms INTEGER;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_media_project ON media(project_id, type);
CREATE INDEX IF NOT EXISTS idx_media_article ON media(article_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_project ON ai_generation_logs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_type ON ai_generation_logs(type, model);

-- RLS Policies
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their media" ON media
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "System can manage media" ON media
  FOR ALL WITH CHECK (true);

CREATE POLICY "Users can view their AI logs" ON ai_generation_logs
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "System can manage AI logs" ON ai_generation_logs
  FOR ALL WITH CHECK (true);
