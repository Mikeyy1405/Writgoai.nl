-- ============================================
-- FIX: Update writgo_content_queue table
-- ============================================
-- Adds missing columns that the application expects

-- Add missing columns to writgo_content_queue
ALTER TABLE writgo_content_queue 
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS excerpt TEXT,
  ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
  ADD COLUMN IF NOT EXISTS featured_image TEXT,
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES writgo_topics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cluster_id UUID REFERENCES writgo_keyword_clusters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS content_type TEXT CHECK (content_type IN ('pillar', 'cluster', 'supporting'));

-- Update status enum to include 'scheduled' and 'draft'
ALTER TABLE writgo_content_queue 
  DROP CONSTRAINT IF EXISTS writgo_content_queue_status_check;

ALTER TABLE writgo_content_queue
  ADD CONSTRAINT writgo_content_queue_status_check 
  CHECK (status IN ('queued', 'scheduled', 'generating', 'completed', 'failed', 'draft'));

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_content_queue_scheduled ON writgo_content_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_content_queue_topic ON writgo_content_queue(topic_id);
CREATE INDEX IF NOT EXISTS idx_content_queue_cluster ON writgo_content_queue(cluster_id);

-- Update existing rows to have default values
UPDATE writgo_content_queue 
SET 
  content = COALESCE(content, ''),
  excerpt = COALESCE(excerpt, ''),
  featured_image = COALESCE(featured_image, ''),
  metadata = COALESCE(metadata, '{}')
WHERE content IS NULL OR excerpt IS NULL OR featured_image IS NULL OR metadata IS NULL;
