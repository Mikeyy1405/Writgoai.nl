-- Content Calendar / Scheduled Content Ideas Migration
-- This creates a table for scheduling content ideas with automatic AI writing and publishing

-- Create the scheduled_content table
CREATE TABLE IF NOT EXISTS scheduled_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Content idea data
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'educational', -- storytelling, educational, promotional, engagement, behind_the_scenes
    pillar TEXT,
    hook TEXT,
    cta TEXT,

    -- Scheduling
    scheduled_for TIMESTAMPTZ NOT NULL,

    -- AI Generation settings
    auto_generate BOOLEAN DEFAULT TRUE,
    platforms TEXT[] DEFAULT ARRAY['instagram'],

    -- Status tracking
    status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, generating, generated, published, failed

    -- Generated content (filled after AI generates)
    generated_content TEXT,
    generated_image_url TEXT,
    generated_post_id UUID REFERENCES social_posts(id),

    -- Error tracking
    error_message TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    generated_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_scheduled_content_project ON scheduled_content(project_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_status ON scheduled_content(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_scheduled_for ON scheduled_content(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_pending ON scheduled_content(scheduled_for, status)
    WHERE status = 'scheduled';

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_scheduled_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_scheduled_content_updated_at ON scheduled_content;
CREATE TRIGGER trigger_scheduled_content_updated_at
    BEFORE UPDATE ON scheduled_content
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_content_updated_at();

-- Enable RLS
ALTER TABLE scheduled_content ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own project's scheduled content
CREATE POLICY scheduled_content_policy ON scheduled_content
    FOR ALL USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Add comment for documentation
COMMENT ON TABLE scheduled_content IS 'Stores scheduled content ideas for automatic AI generation and publishing';
