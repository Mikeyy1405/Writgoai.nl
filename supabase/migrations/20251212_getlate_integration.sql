-- Getlate.dev Integration Migration
-- Adds Getlate profile tracking and connected social accounts

-- ============================================================================
-- STEP 1: Add Getlate fields to Project table
-- ============================================================================

-- Add getlateProfileId to track Late API profile
ALTER TABLE "Project" 
ADD COLUMN IF NOT EXISTS "getlateProfileId" TEXT;

-- Add getlateProfileName for easy reference
ALTER TABLE "Project" 
ADD COLUMN IF NOT EXISTS "getlateProfileName" TEXT;

-- Create index for fast profile lookups
CREATE INDEX IF NOT EXISTS "Project_getlateProfileId_idx" 
  ON "Project"("getlateProfileId");

-- ============================================================================
-- STEP 2: Create ConnectedSocialAccount table
-- ============================================================================

-- Table for tracking connected social media accounts from Getlate
CREATE TABLE IF NOT EXISTS "ConnectedSocialAccount" (
  -- Primary key
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Foreign key to Project
  "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  
  -- Getlate account data
  "getlateAccountId" TEXT NOT NULL UNIQUE, -- _id from Getlate API
  "getlateProfileId" TEXT NOT NULL, -- Late profile this account belongs to
  
  -- Platform info
  "platform" TEXT NOT NULL, -- 'linkedin', 'instagram', 'facebook', 'twitter', etc.
  "username" TEXT NOT NULL, -- Platform username/handle
  "displayName" TEXT NOT NULL, -- Display name on platform
  "accountHandle" TEXT, -- @handle if applicable
  
  -- Media
  "profileImage" TEXT, -- Profile picture URL
  
  -- Status
  "isActive" BOOLEAN DEFAULT true,
  "connectedAt" TIMESTAMP DEFAULT NOW(),
  
  -- Analytics (optional, if user has analytics add-on)
  "followersCount" INTEGER,
  "followersLastUpdated" TIMESTAMP,
  
  -- Extra metadata as JSON
  "metadata" JSONB DEFAULT '{}',
  
  -- Timestamps
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

-- Fast project lookups
CREATE INDEX IF NOT EXISTS "ConnectedSocialAccount_projectId_idx" 
  ON "ConnectedSocialAccount"("projectId");

-- Fast platform filtering
CREATE INDEX IF NOT EXISTS "ConnectedSocialAccount_platform_idx" 
  ON "ConnectedSocialAccount"("platform");

-- Fast getlateAccountId lookups
CREATE INDEX IF NOT EXISTS "ConnectedSocialAccount_getlateAccountId_idx" 
  ON "ConnectedSocialAccount"("getlateAccountId");

-- Fast active account queries
CREATE INDEX IF NOT EXISTS "ConnectedSocialAccount_isActive_idx" 
  ON "ConnectedSocialAccount"("isActive");

-- Unique constraint: one Getlate account per project/platform combo
CREATE UNIQUE INDEX IF NOT EXISTS "ConnectedSocialAccount_project_getlate_idx" 
  ON "ConnectedSocialAccount"("projectId", "getlateAccountId");

-- ============================================================================
-- STEP 4: Create update trigger
-- ============================================================================

-- Auto-update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_connected_social_account_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_connected_social_account_updated_at_trigger 
  ON "ConnectedSocialAccount";

CREATE TRIGGER update_connected_social_account_updated_at_trigger
  BEFORE UPDATE ON "ConnectedSocialAccount"
  FOR EACH ROW
  EXECUTE FUNCTION update_connected_social_account_updated_at();

-- ============================================================================
-- STEP 5: Add RLS policies (Row Level Security)
-- ============================================================================

-- Enable RLS
ALTER TABLE "ConnectedSocialAccount" ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage all social accounts"
  ON "ConnectedSocialAccount"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Client"
      WHERE "Client"."id" = (
        SELECT "Project"."clientId" 
        FROM "Project" 
        WHERE "Project"."id" = "ConnectedSocialAccount"."projectId"
      )
      AND "Client"."email" = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- Policy: Clients can view their own project's social accounts
CREATE POLICY "Clients can view their social accounts"
  ON "ConnectedSocialAccount"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Project"
      WHERE "Project"."id" = "ConnectedSocialAccount"."projectId"
      AND "Project"."clientId" = (
        SELECT "id" FROM "Client"
        WHERE "email" = current_setting('request.jwt.claims', true)::json->>'email'
      )
    )
  );

-- ============================================================================
-- STEP 6: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE "ConnectedSocialAccount" IS 
  'Tracks social media accounts connected via Getlate.dev API';

COMMENT ON COLUMN "ConnectedSocialAccount"."getlateAccountId" IS 
  'The _id from Getlate API (/v1/accounts)';

COMMENT ON COLUMN "ConnectedSocialAccount"."getlateProfileId" IS 
  'The profile ID in Getlate that this account belongs to';

COMMENT ON COLUMN "ConnectedSocialAccount"."platform" IS 
  'Social media platform: linkedin, instagram, facebook, twitter, tiktok, youtube, pinterest, reddit, bluesky, threads, googlebusiness';

COMMENT ON COLUMN "ConnectedSocialAccount"."metadata" IS 
  'Additional platform-specific data stored as JSON';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify Project columns were added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Project' AND column_name = 'getlateProfileId'
  ) THEN
    RAISE EXCEPTION 'Failed to add getlateProfileId to Project table';
  END IF;
  
  RAISE NOTICE '✓ Project.getlateProfileId column added';
END $$;

-- Verify ConnectedSocialAccount table was created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'ConnectedSocialAccount'
  ) THEN
    RAISE EXCEPTION 'Failed to create ConnectedSocialAccount table';
  END IF;
  
  RAISE NOTICE '✓ ConnectedSocialAccount table created';
END $$;

-- Count indexes
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename = 'ConnectedSocialAccount';
  
  RAISE NOTICE '✓ Created % indexes on ConnectedSocialAccount', index_count;
END $$;

RAISE NOTICE '=================================================================';
RAISE NOTICE 'Getlate Integration Migration Complete!';
RAISE NOTICE '=================================================================';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '1. Update prisma-shim.ts to include ConnectedSocialAccount model';
RAISE NOTICE '2. Set GETLATE_API_KEY in Render environment variables';
RAISE NOTICE '3. Update project creation API to create Getlate profiles';
RAISE NOTICE '=================================================================';
