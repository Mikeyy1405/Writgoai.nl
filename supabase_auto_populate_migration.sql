-- Auto-populate Calendar Migration
-- Adds support for automatic content calendar population with holiday awareness

-- Add new columns to social_schedules for auto-populate feature
ALTER TABLE social_schedules
ADD COLUMN IF NOT EXISTS auto_populate_calendar BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS include_holidays BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS days_ahead INTEGER DEFAULT 14,
ADD COLUMN IF NOT EXISTS auto_populate_last_run TIMESTAMP WITH TIME ZONE;

-- Add index for auto-populate queries
CREATE INDEX IF NOT EXISTS idx_social_schedules_auto_populate
ON social_schedules(auto_populate_calendar)
WHERE auto_populate_calendar = true AND enabled = true;

-- Add holiday_theme column to scheduled_content to track holiday-related content
ALTER TABLE scheduled_content
ADD COLUMN IF NOT EXISTS holiday_name TEXT,
ADD COLUMN IF NOT EXISTS holiday_emoji TEXT;

-- Comment explaining the new fields
COMMENT ON COLUMN social_schedules.auto_populate_calendar IS 'When enabled, the system will automatically add items to the content calendar';
COMMENT ON COLUMN social_schedules.include_holidays IS 'When enabled, holiday-themed content will be automatically scheduled';
COMMENT ON COLUMN social_schedules.days_ahead IS 'Number of days ahead to populate the calendar (default 14 days)';
COMMENT ON COLUMN social_schedules.auto_populate_last_run IS 'Timestamp of the last auto-populate run';
COMMENT ON COLUMN scheduled_content.holiday_name IS 'Name of the holiday this content is related to (if any)';
COMMENT ON COLUMN scheduled_content.holiday_emoji IS 'Emoji for the holiday (if any)';
