-- Social Media Recurring Scheduling Migration
-- Adds support for automatic, recurring post generation and scheduling

-- Create social_schedules table for recurring automation
CREATE TABLE IF NOT EXISTS social_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Schedule configuration
  enabled BOOLEAN DEFAULT true,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'twice_daily', 'three_times_daily', 'weekdays', 'weekly', 'custom')),

  -- For 'custom' frequency - days of week (0=Sunday, 1=Monday, etc.)
  custom_days INTEGER[] DEFAULT NULL,

  -- Posting times (array of HH:MM format strings)
  post_times TEXT[] NOT NULL DEFAULT ARRAY['09:00'],

  -- Content settings
  auto_generate_content BOOLEAN DEFAULT true,
  use_content_ideas BOOLEAN DEFAULT true, -- Use ideas from strategy
  post_types TEXT[] DEFAULT ARRAY['educational', 'storytelling', 'engagement'],

  -- Platform targeting
  target_platforms TEXT[] DEFAULT ARRAY['instagram'],

  -- Publishing settings
  auto_publish BOOLEAN DEFAULT false, -- If true, posts are published immediately
  schedule_posts BOOLEAN DEFAULT true, -- If true, posts are scheduled for future

  -- Last execution tracking
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_social_schedules_project ON social_schedules(project_id);
CREATE INDEX IF NOT EXISTS idx_social_schedules_enabled ON social_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_social_schedules_next_run ON social_schedules(next_run_at) WHERE enabled = true;

-- Add metadata columns to social_posts for tracking automation
ALTER TABLE social_posts
ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES social_schedules(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS variation_seed TEXT; -- For content variation tracking

-- Create index for schedule tracking
CREATE INDEX IF NOT EXISTS idx_social_posts_schedule ON social_posts(schedule_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_auto_generated ON social_posts(auto_generated);

-- Function to calculate next run time based on frequency
CREATE OR REPLACE FUNCTION calculate_next_social_post_time(
  p_frequency TEXT,
  p_custom_days INTEGER[],
  p_post_times TEXT[],
  p_last_run TIMESTAMP WITH TIME ZONE
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_base_time TIMESTAMP WITH TIME ZONE;
  v_next_time TIMESTAMP WITH TIME ZONE;
  v_time TEXT;
  v_day INTEGER;
  v_target_day INTEGER;
  v_days_ahead INTEGER;
BEGIN
  -- Start from last run or now
  v_base_time := COALESCE(p_last_run, v_now);

  CASE p_frequency
    WHEN 'daily' THEN
      -- Next occurrence of the first post time
      v_time := p_post_times[1];
      v_next_time := (DATE(v_base_time) + INTERVAL '1 day' + v_time::TIME)::TIMESTAMP WITH TIME ZONE;

    WHEN 'twice_daily' THEN
      -- Alternate between two times
      v_time := p_post_times[1];
      v_next_time := (DATE(v_base_time) + v_time::TIME)::TIMESTAMP WITH TIME ZONE;
      IF v_next_time <= v_base_time THEN
        IF array_length(p_post_times, 1) > 1 THEN
          v_time := p_post_times[2];
          v_next_time := (DATE(v_base_time) + v_time::TIME)::TIMESTAMP WITH TIME ZONE;
          IF v_next_time <= v_base_time THEN
            v_time := p_post_times[1];
            v_next_time := (DATE(v_base_time) + INTERVAL '1 day' + v_time::TIME)::TIMESTAMP WITH TIME ZONE;
          END IF;
        ELSE
          v_next_time := (DATE(v_base_time) + INTERVAL '1 day' + v_time::TIME)::TIMESTAMP WITH TIME ZONE;
        END IF;
      END IF;

    WHEN 'three_times_daily' THEN
      -- Cycle through three times
      v_time := p_post_times[1];
      v_next_time := (DATE(v_base_time) + v_time::TIME)::TIMESTAMP WITH TIME ZONE;
      IF v_next_time <= v_base_time THEN
        IF array_length(p_post_times, 1) > 1 THEN
          v_time := p_post_times[2];
          v_next_time := (DATE(v_base_time) + v_time::TIME)::TIMESTAMP WITH TIME ZONE;
          IF v_next_time <= v_base_time AND array_length(p_post_times, 1) > 2 THEN
            v_time := p_post_times[3];
            v_next_time := (DATE(v_base_time) + v_time::TIME)::TIMESTAMP WITH TIME ZONE;
            IF v_next_time <= v_base_time THEN
              v_time := p_post_times[1];
              v_next_time := (DATE(v_base_time) + INTERVAL '1 day' + v_time::TIME)::TIMESTAMP WITH TIME ZONE;
            END IF;
          END IF;
        ELSE
          v_next_time := (DATE(v_base_time) + INTERVAL '1 day' + v_time::TIME)::TIMESTAMP WITH TIME ZONE;
        END IF;
      END IF;

    WHEN 'weekdays' THEN
      -- Monday to Friday only
      v_time := p_post_times[1];
      v_next_time := (DATE(v_base_time) + INTERVAL '1 day' + v_time::TIME)::TIMESTAMP WITH TIME ZONE;
      v_day := EXTRACT(DOW FROM v_next_time)::INTEGER;
      -- Skip weekend (0=Sunday, 6=Saturday)
      WHILE v_day = 0 OR v_day = 6 LOOP
        v_next_time := v_next_time + INTERVAL '1 day';
        v_day := EXTRACT(DOW FROM v_next_time)::INTEGER;
      END LOOP;

    WHEN 'weekly' THEN
      -- Same day next week
      v_time := p_post_times[1];
      v_next_time := (DATE(v_base_time) + INTERVAL '7 days' + v_time::TIME)::TIMESTAMP WITH TIME ZONE;

    WHEN 'custom' THEN
      -- Custom days of week
      IF p_custom_days IS NULL OR array_length(p_custom_days, 1) = 0 THEN
        RETURN NULL;
      END IF;

      v_time := p_post_times[1];
      v_day := EXTRACT(DOW FROM v_base_time)::INTEGER;

      -- Find next matching day
      FOR i IN 0..7 LOOP
        v_target_day := (v_day + i) % 7;
        IF v_target_day = ANY(p_custom_days) THEN
          v_next_time := (DATE(v_base_time) + (i || ' days')::INTERVAL + v_time::TIME)::TIMESTAMP WITH TIME ZONE;
          IF v_next_time > v_base_time THEN
            EXIT;
          END IF;
        END IF;
      END LOOP;
  END CASE;

  RETURN v_next_time;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update next_run_at when schedule is created or updated
CREATE OR REPLACE FUNCTION update_social_schedule_next_run()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.enabled THEN
    NEW.next_run_at := calculate_next_social_post_time(
      NEW.frequency,
      NEW.custom_days,
      NEW.post_times,
      NEW.last_run_at
    );
  ELSE
    NEW.next_run_at := NULL;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_social_schedule_next_run
  BEFORE INSERT OR UPDATE ON social_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_social_schedule_next_run();

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON social_schedules TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON social_posts TO authenticated;
