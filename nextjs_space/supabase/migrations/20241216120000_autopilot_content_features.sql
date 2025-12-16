-- Add content rules and advanced features to WordPress Autopilot
-- Migration: 20241216120000_autopilot_content_features.sql

-- Add content rules to AutopilotSettings
ALTER TABLE "AutopilotSettings" 
ADD COLUMN IF NOT EXISTS "contentRules" JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "toneOfVoice" TEXT DEFAULT 'professioneel',
ADD COLUMN IF NOT EXISTS "brandGuidelines" TEXT,
ADD COLUMN IF NOT EXISTS "targetAudience" TEXT,
ADD COLUMN IF NOT EXISTS "writingStyle" TEXT,
ADD COLUMN IF NOT EXISTS "dosAndDonts" JSONB DEFAULT '{"dos": [], "donts": []}';

-- Add content intent and media tracking to ContentCalendarItem
ALTER TABLE "ContentCalendarItem"
ADD COLUMN IF NOT EXISTS "contentIntent" TEXT DEFAULT 'informational',
ADD COLUMN IF NOT EXISTS "internalLinks" JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "affiliateLinks" JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "images" JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN "AutopilotSettings"."contentRules" IS 'General content rules and guidelines in JSON format';
COMMENT ON COLUMN "AutopilotSettings"."toneOfVoice" IS 'Tone of voice: professioneel, casual, vriendelijk, formeel, informatief, etc.';
COMMENT ON COLUMN "AutopilotSettings"."brandGuidelines" IS 'Brand-specific guidelines and voice';
COMMENT ON COLUMN "AutopilotSettings"."targetAudience" IS 'Description of target audience';
COMMENT ON COLUMN "AutopilotSettings"."writingStyle" IS 'Preferred writing style';
COMMENT ON COLUMN "AutopilotSettings"."dosAndDonts" IS 'Content dos and donts in JSON format';

COMMENT ON COLUMN "ContentCalendarItem"."contentIntent" IS 'Type of content: informational, best-of-list, review, how-to, guide';
COMMENT ON COLUMN "ContentCalendarItem"."internalLinks" IS 'Array of internal links added to content';
COMMENT ON COLUMN "ContentCalendarItem"."affiliateLinks" IS 'Array of affiliate links added to content';
COMMENT ON COLUMN "ContentCalendarItem"."images" IS 'Array of images generated/added to content';
COMMENT ON COLUMN "ContentCalendarItem"."metadata" IS 'Additional metadata for content item';

-- Create index for content intent queries
CREATE INDEX IF NOT EXISTS "ContentCalendarItem_contentIntent_idx" ON "ContentCalendarItem"("contentIntent");
CREATE INDEX IF NOT EXISTS "ContentCalendarItem_status_intent_idx" ON "ContentCalendarItem"("status", "contentIntent");
