-- Media Library Migration
-- Extends existing media table for user uploads

-- Add new fields to media table for user uploads
ALTER TABLE media ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE media ADD COLUMN IF NOT EXISTS filename VARCHAR(255);
ALTER TABLE media ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
ALTER TABLE media ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE media ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE media ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Make project_id and article_id nullable for media library uploads
ALTER TABLE media ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE media ALTER COLUMN article_id DROP NOT NULL;

-- Create index for user uploads
CREATE INDEX IF NOT EXISTS idx_media_user_id ON media(user_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_type_user ON media(type, user_id);

-- Update RLS policies for media library

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their media" ON media;
DROP POLICY IF EXISTS "System can manage media" ON media;

-- Users can view their own media and project media
CREATE POLICY "Users can view their media" ON media
  FOR SELECT USING (
    user_id = auth.uid() OR
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Users can insert their own media
CREATE POLICY "Users can insert their media" ON media
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- Users can update their own media
CREATE POLICY "Users can update their media" ON media
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- Users can delete their own media
CREATE POLICY "Users can delete their media" ON media
  FOR DELETE USING (
    user_id = auth.uid()
  );

-- System/service role can do everything
CREATE POLICY "Service role can manage all media" ON media
  FOR ALL USING (
    auth.jwt()->>'role' = 'service_role'
  );
