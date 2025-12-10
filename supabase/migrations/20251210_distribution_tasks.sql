-- Distribution Tasks Table Migration
-- Creates table for distribution_tasks to manage multi-platform content distribution

-- ============================================
-- ENUMS
-- ============================================

-- Distribution status enum
CREATE TYPE distribution_status AS ENUM (
  'pending',
  'scheduled',
  'publishing',
  'published',
  'failed',
  'cancelled'
);

-- ============================================
-- TABLE
-- ============================================

-- Distribution Tasks Table
CREATE TABLE distribution_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  platforms TEXT[] NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status distribution_status NOT NULL DEFAULT 'pending',
  getlatedev_job_id TEXT,
  published_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_distribution_tasks_status ON distribution_tasks(status);
CREATE INDEX idx_distribution_tasks_scheduled ON distribution_tasks(scheduled_at);
CREATE INDEX idx_distribution_tasks_client ON distribution_tasks(client_id);
CREATE INDEX idx_distribution_tasks_content ON distribution_tasks(content_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE distribution_tasks ENABLE ROW LEVEL SECURITY;

-- Admins can manage all distribution tasks
CREATE POLICY "Admins can manage distribution tasks" ON distribution_tasks
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Clients can view their own distribution tasks
CREATE POLICY "Clients can view their own distribution tasks" ON distribution_tasks
  FOR SELECT USING (auth.jwt() ->> 'email' IN (
    SELECT email FROM "Client" WHERE id = client_id
  ));

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_distribution_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER distribution_tasks_updated_at
  BEFORE UPDATE ON distribution_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_distribution_tasks_updated_at();
