-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AutoPilot Config Table
CREATE TABLE IF NOT EXISTS autopilot_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT FALSE,
  frequency VARCHAR(20) DEFAULT 'weekly',
  target_keywords TEXT[],
  content_strategy VARCHAR(50) DEFAULT 'balanced',
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GSC Data Table
CREATE TABLE IF NOT EXISTS gsc_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0,
  position DECIMAL(5,2) DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, query, date)
);

-- Performance Insights Table
CREATE TABLE IF NOT EXISTS performance_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL,
  priority DECIMAL(3,1) DEFAULT 0,
  query TEXT,
  suggested_action VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_logs_project ON activity_logs(project_id, created_at DESC);
CREATE INDEX idx_gsc_data_project_date ON gsc_data(project_id, date DESC);
CREATE INDEX idx_performance_insights_project ON performance_insights(project_id, status, priority DESC);

-- RLS Policies
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopilot_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_insights ENABLE ROW LEVEL SECURITY;

-- Policies for activity_logs
CREATE POLICY "Users can view their own activity logs" ON activity_logs
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- Policies for autopilot_config
CREATE POLICY "Users can manage their autopilot config" ON autopilot_config
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Policies for gsc_data
CREATE POLICY "Users can view their GSC data" ON gsc_data
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "System can insert GSC data" ON gsc_data
  FOR INSERT WITH CHECK (true);

-- Policies for performance_insights
CREATE POLICY "Users can view their insights" ON performance_insights
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "System can manage insights" ON performance_insights
  FOR ALL WITH CHECK (true);
