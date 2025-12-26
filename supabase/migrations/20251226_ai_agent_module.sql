-- AI Agent Module Database Schema
-- Created: 2025-12-26
-- Purpose: Add complete AI Agent functionality to WritGo.nl

-- ============================================================================
-- 1. AGENT TASKS
-- ============================================================================
CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- Task details
  title TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL, -- Full prompt sent to agent

  -- Status
  status TEXT NOT NULL DEFAULT 'queued',
  -- queued, running, completed, failed, cancelled

  priority TEXT DEFAULT 'normal', -- low, normal, high

  -- Execution
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,

  -- Results
  result_data JSONB, -- Output data
  result_files TEXT[], -- URLs to generated files
  error_message TEXT,

  -- Metadata
  template_id UUID REFERENCES agent_templates(id) ON DELETE SET NULL,
  vps_task_id TEXT, -- ID on VPS side
  credits_used INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_agent_tasks_user_id ON agent_tasks(user_id);
CREATE INDEX idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX idx_agent_tasks_created_at ON agent_tasks(created_at DESC);

-- RLS Policies
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON agent_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks"
  ON agent_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON agent_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON agent_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. AGENT TEMPLATES (Playbooks)
-- ============================================================================
CREATE TABLE agent_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- research, ecommerce, content, admin
  icon TEXT, -- emoji or icon name

  -- Template content
  prompt_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  -- [{"name": "product_url", "type": "url", "required": true}]

  -- Scheduling
  is_scheduled BOOLEAN DEFAULT FALSE,
  schedule_cron TEXT, -- cron expression
  schedule_enabled BOOLEAN DEFAULT FALSE,

  -- Usage stats
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  avg_duration_seconds INTEGER,

  -- Sharing
  is_public BOOLEAN DEFAULT FALSE, -- Share with other users?
  is_system BOOLEAN DEFAULT FALSE, -- Built-in template

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_agent_templates_user_id ON agent_templates(user_id);
CREATE INDEX idx_agent_templates_category ON agent_templates(category);
CREATE INDEX idx_agent_templates_is_public ON agent_templates(is_public) WHERE is_public = TRUE;

-- RLS Policies
ALTER TABLE agent_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own and public templates"
  ON agent_templates FOR SELECT
  USING (auth.uid() = user_id OR is_public = TRUE OR is_system = TRUE);

CREATE POLICY "Users can create own templates"
  ON agent_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON agent_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON agent_templates FOR DELETE
  USING (auth.uid() = user_id AND is_system = FALSE);

-- ============================================================================
-- 3. AGENT SESSIONS (Browser activity logs)
-- ============================================================================
CREATE TABLE agent_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session info
  container_id TEXT, -- Docker container ID on VPS
  vnc_url TEXT, -- VNC streaming URL

  -- Activity log (step by step)
  activity_log JSONB DEFAULT '[]'::jsonb,
  /* [
    {
      "timestamp": "2025-12-26T14:32:01Z",
      "action": "browser_open",
      "details": "Chromium launched",
      "success": true
    },
    {
      "timestamp": "2025-12-26T14:32:05Z",
      "action": "navigate",
      "url": "https://bol.com",
      "success": true
    }
  ] */

  -- Screenshots
  screenshots TEXT[], -- URLs to screenshots

  -- Browser state
  current_url TEXT,
  browser_cookies JSONB, -- Encrypted

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  ended_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_agent_sessions_task_id ON agent_sessions(task_id);
CREATE INDEX idx_agent_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX idx_agent_sessions_is_active ON agent_sessions(is_active) WHERE is_active = TRUE;

-- RLS Policies
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON agent_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON agent_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON agent_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. AGENT CREDENTIALS (Encrypted vault)
-- ============================================================================
CREATE TABLE agent_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Service info
  service_name TEXT NOT NULL, -- wordpress, google, bol.com, etc.
  service_type TEXT NOT NULL, -- oauth, api_key, password, session
  display_name TEXT,

  -- Credentials (ENCRYPTED)
  encrypted_data TEXT NOT NULL, -- JSON with credentials, encrypted with AES-256-GCM
  encryption_iv TEXT NOT NULL,
  encryption_tag TEXT NOT NULL,

  -- OAuth specific
  oauth_access_token TEXT,
  oauth_refresh_token TEXT,
  oauth_expires_at TIMESTAMP WITH TIME ZONE,
  oauth_scopes TEXT[],

  -- Session specific (for browser sessions)
  session_cookies JSONB, -- Encrypted
  session_expires_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  last_used_at TIMESTAMP WITH TIME ZONE,
  last_validated_at TIMESTAMP WITH TIME ZONE,
  is_valid BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(user_id, service_name)
);

-- Indexes
CREATE INDEX idx_agent_credentials_user_id ON agent_credentials(user_id);
CREATE INDEX idx_agent_credentials_service_name ON agent_credentials(service_name);

-- RLS Policies
ALTER TABLE agent_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credentials"
  ON agent_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own credentials"
  ON agent_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials"
  ON agent_credentials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials"
  ON agent_credentials FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. AGENT CHAT MESSAGES
-- ============================================================================
CREATE TABLE agent_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,

  -- Message info
  role TEXT NOT NULL, -- user, agent, system
  content TEXT NOT NULL,

  -- Metadata
  action_required BOOLEAN DEFAULT FALSE, -- Agent needs confirmation
  action_type TEXT, -- run_task, confirm_action, etc.
  action_data JSONB,

  -- Attachments
  attachments TEXT[], -- File URLs

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_agent_chat_user_id ON agent_chat_messages(user_id);
CREATE INDEX idx_agent_chat_task_id ON agent_chat_messages(task_id);
CREATE INDEX idx_agent_chat_created_at ON agent_chat_messages(created_at DESC);

-- RLS Policies
ALTER TABLE agent_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat messages"
  ON agent_chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat messages"
  ON agent_chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_tasks_updated_at BEFORE UPDATE ON agent_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_templates_updated_at BEFORE UPDATE ON agent_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_sessions_updated_at BEFORE UPDATE ON agent_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_credentials_updated_at BEFORE UPDATE ON agent_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. DEFAULT SYSTEM TEMPLATES
-- ============================================================================
INSERT INTO agent_templates (
  id,
  name,
  description,
  category,
  icon,
  prompt_template,
  variables,
  is_system,
  is_public
) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'Daily GSC Report',
  'Haalt Google Search Console data op en maakt een PDF rapport',
  'research',
  '📊',
  'Login to Google Search Console for {project_url}. Export data for the last 7 days including: total clicks, impressions, CTR, average position. Export top 10 performing queries and top 10 pages. Create a PDF report with charts and save it.',
  '[{"name": "project_url", "type": "url", "required": true, "description": "Your website URL"}]'::jsonb,
  TRUE,
  TRUE
),
(
  '00000000-0000-0000-0000-000000000002',
  'Competitor Content Monitor',
  'Checkt nieuwe blog posts van concurrenten',
  'research',
  '🎯',
  'Monitor these competitor blogs: {competitor_urls}. Find all blog posts published in the last 7 days. For each post, extract: title, URL, publish date, word count, main keywords. Create a CSV report with findings and highlight any posts targeting similar keywords as my site.',
  '[{"name": "competitor_urls", "type": "text", "required": true, "description": "Comma-separated list of competitor URLs"}]'::jsonb,
  TRUE,
  TRUE
),
(
  '00000000-0000-0000-0000-000000000003',
  'Bol.com Price Monitor',
  'Monitort productprijzen op Bol.com',
  'ecommerce',
  '💎',
  'Search Bol.com for these products: {product_names}. For each product, extract: title, price, seller, availability, rating. Create a CSV with all data. If any price is below {alert_price}, send an alert.',
  '[{"name": "product_names", "type": "text", "required": true, "description": "Product names to search"}, {"name": "alert_price", "type": "number", "required": false, "description": "Alert if price below this amount"}]'::jsonb,
  TRUE,
  TRUE
),
(
  '00000000-0000-0000-0000-000000000004',
  'WordPress Bulk Publisher',
  'Publiceert meerdere drafts naar WordPress',
  'content',
  '📝',
  'Login to WordPress at {wordpress_url}. Get all draft posts. For each draft: verify featured image exists, check meta description is set, ensure categories are assigned. Publish all drafts that pass validation. Create a report of published posts.',
  '[{"name": "wordpress_url", "type": "url", "required": true, "description": "WordPress admin URL"}]'::jsonb,
  TRUE,
  TRUE
),
(
  '00000000-0000-0000-0000-000000000005',
  'Social Media Content Generator',
  'Genereert social media posts vanuit je laatste blog',
  'content',
  '✨',
  'Get the latest published article from {website_url}. Create 3 variations of social media posts for LinkedIn, Twitter, and Facebook. Each post should: highlight the main value proposition, include relevant hashtags, add a call-to-action. Save as a CSV with platform-specific posts.',
  '[{"name": "website_url", "type": "url", "required": true, "description": "Your website URL"}]'::jsonb,
  TRUE,
  TRUE
);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
