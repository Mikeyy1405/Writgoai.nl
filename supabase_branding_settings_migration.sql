-- Create app_settings table for storing application-wide settings
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read settings
CREATE POLICY "Allow authenticated users to read app settings"
  ON app_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Only allow authenticated users to insert/update settings
CREATE POLICY "Allow authenticated users to update app settings"
  ON app_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default logo setting
INSERT INTO app_settings (key, value)
VALUES ('logo_url', NULL)
ON CONFLICT (key) DO NOTHING;

-- Add comment
COMMENT ON TABLE app_settings IS 'Application-wide settings including branding assets like logos';
