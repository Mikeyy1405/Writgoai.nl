-- Client Dashboard Tables Migration
-- Creates tables for client_subscriptions, connected_platforms, and content_deliveries

-- ============================================
-- ENUMS
-- ============================================

-- Package types enum
CREATE TYPE package_type AS ENUM ('INSTAPPER', 'STARTER', 'GROEI', 'DOMINANT');

-- Content type enum
CREATE TYPE content_type AS ENUM ('pillar', 'cluster', 'social', 'video');

-- Content status enum
CREATE TYPE content_status AS ENUM ('draft', 'scheduled', 'published', 'failed');

-- Platform type enum
CREATE TYPE platform_type AS ENUM (
  'linkedin_personal',
  'linkedin_company',
  'instagram',
  'facebook_personal',
  'facebook_page',
  'twitter',
  'tiktok',
  'pinterest',
  'google_my_business',
  'youtube'
);

-- ============================================
-- TABLES
-- ============================================

-- Client Subscriptions Table
CREATE TABLE client_subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  client_id TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  package_type package_type NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  pillar_articles INTEGER NOT NULL DEFAULT 0,
  cluster_articles INTEGER NOT NULL DEFAULT 0,
  social_posts INTEGER NOT NULL DEFAULT 0,
  videos INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP(3),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Connected Platforms Table
CREATE TABLE connected_platforms (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  client_id TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  platform_type platform_type NOT NULL,
  platform_name TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP(3),
  platform_user_id TEXT,
  platform_username TEXT,
  connected_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Content Deliveries Table
CREATE TABLE content_deliveries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  client_id TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  subscription_id TEXT REFERENCES client_subscriptions(id) ON DELETE SET NULL,
  content_type content_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  status content_status NOT NULL DEFAULT 'draft',
  scheduled_date TIMESTAMP(3),
  published_date TIMESTAMP(3),
  platform_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  impressions INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

-- Client Subscriptions indexes
CREATE INDEX idx_client_subscriptions_client_id ON client_subscriptions(client_id);
CREATE INDEX idx_client_subscriptions_active ON client_subscriptions(active);
CREATE INDEX idx_client_subscriptions_package_type ON client_subscriptions(package_type);

-- Connected Platforms indexes
CREATE INDEX idx_connected_platforms_client_id ON connected_platforms(client_id);
CREATE INDEX idx_connected_platforms_platform_type ON connected_platforms(platform_type);
CREATE INDEX idx_connected_platforms_active ON connected_platforms(active);

-- Content Deliveries indexes
CREATE INDEX idx_content_deliveries_client_id ON content_deliveries(client_id);
CREATE INDEX idx_content_deliveries_subscription_id ON content_deliveries(subscription_id);
CREATE INDEX idx_content_deliveries_content_type ON content_deliveries(content_type);
CREATE INDEX idx_content_deliveries_status ON content_deliveries(status);
CREATE INDEX idx_content_deliveries_scheduled_date ON content_deliveries(scheduled_date);
CREATE INDEX idx_content_deliveries_published_date ON content_deliveries(published_date);

-- ============================================
-- RLS (Row Level Security) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE client_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_deliveries ENABLE ROW LEVEL SECURITY;

-- Client Subscriptions RLS Policies
CREATE POLICY "Clients can view their own subscriptions"
  ON client_subscriptions FOR SELECT
  USING (auth.uid()::text = client_id);

CREATE POLICY "Admins can view all subscriptions"
  ON client_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can manage all subscriptions"
  ON client_subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Connected Platforms RLS Policies
CREATE POLICY "Clients can view their own platforms"
  ON connected_platforms FOR SELECT
  USING (auth.uid()::text = client_id);

CREATE POLICY "Clients can manage their own platforms"
  ON connected_platforms FOR ALL
  USING (auth.uid()::text = client_id);

CREATE POLICY "Admins can view all platforms"
  ON connected_platforms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Content Deliveries RLS Policies
CREATE POLICY "Clients can view their own content"
  ON content_deliveries FOR SELECT
  USING (auth.uid()::text = client_id);

CREATE POLICY "Admins can view all content"
  ON content_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can manage all content"
  ON content_deliveries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND role IN ('admin', 'superadmin')
    )
  );

-- ============================================
-- TRIGGER FUNCTIONS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to all tables
CREATE TRIGGER update_client_subscriptions_updated_at
  BEFORE UPDATE ON client_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connected_platforms_updated_at
  BEFORE UPDATE ON connected_platforms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_deliveries_updated_at
  BEFORE UPDATE ON content_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
