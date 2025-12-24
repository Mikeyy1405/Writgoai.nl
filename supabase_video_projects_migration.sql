-- Video Projects Table - For multi-scene video projects
CREATE TABLE IF NOT EXISTS video_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  aspect_ratio VARCHAR(10) DEFAULT '9:16', -- '16:9', '9:16', '1:1'
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'processing', 'completed', 'failed'
  voice_id VARCHAR(50) DEFAULT 'Rachel', -- ElevenLabs voice ID
  music_url TEXT, -- Generated background music URL
  music_prompt TEXT, -- Prompt used for music generation
  final_video_url TEXT, -- Stitched final video URL
  total_duration INTEGER DEFAULT 0, -- Total duration in seconds
  total_credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video Scenes Table - Individual scenes within a project
CREATE TABLE IF NOT EXISTS video_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES video_projects(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL,
  prompt TEXT NOT NULL, -- Visual description for video generation
  narration_text TEXT, -- Voice-over text for this scene
  style VARCHAR(50) DEFAULT 'cinematic_drone', -- Visual style
  model VARCHAR(100) NOT NULL, -- 'luma/ray-2', 'kling-video/v1.6/standard/text-to-video', etc.
  duration INTEGER DEFAULT 5, -- Duration in seconds
  video_url TEXT, -- Generated video URL
  voice_url TEXT, -- Generated voice-over URL
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'generating', 'completed', 'failed'
  error_message TEXT,
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_projects_user ON video_projects(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_projects_status ON video_projects(status);
CREATE INDEX IF NOT EXISTS idx_video_scenes_project ON video_scenes(project_id, scene_number);
CREATE INDEX IF NOT EXISTS idx_video_scenes_status ON video_scenes(status);

-- Enable RLS
ALTER TABLE video_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_scenes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_projects
CREATE POLICY "Users can view their video projects" ON video_projects
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create video projects" ON video_projects
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their video projects" ON video_projects
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their video projects" ON video_projects
  FOR DELETE USING (user_id = auth.uid());

-- Service role policy for backend operations
CREATE POLICY "Service role full access to video_projects" ON video_projects
  FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for video_scenes
CREATE POLICY "Users can view their video scenes" ON video_scenes
  FOR SELECT USING (
    project_id IN (SELECT id FROM video_projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create video scenes" ON video_scenes
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM video_projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their video scenes" ON video_scenes
  FOR UPDATE USING (
    project_id IN (SELECT id FROM video_projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their video scenes" ON video_scenes
  FOR DELETE USING (
    project_id IN (SELECT id FROM video_projects WHERE user_id = auth.uid())
  );

-- Service role policy for backend operations
CREATE POLICY "Service role full access to video_scenes" ON video_scenes
  FOR ALL USING (true) WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trigger_video_projects_updated_at ON video_projects;
CREATE TRIGGER trigger_video_projects_updated_at
  BEFORE UPDATE ON video_projects
  FOR EACH ROW EXECUTE FUNCTION update_video_updated_at();

DROP TRIGGER IF EXISTS trigger_video_scenes_updated_at ON video_scenes;
CREATE TRIGGER trigger_video_scenes_updated_at
  BEFORE UPDATE ON video_scenes
  FOR EACH ROW EXECUTE FUNCTION update_video_updated_at();
