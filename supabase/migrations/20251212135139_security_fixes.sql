-- Security Fixes Migration
-- Created: 2025-12-12
-- Purpose: Fix critical security vulnerabilities identified by Supabase database linter
-- References: 
--   - https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public
--   - https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- =====================================================
-- PART 1: Enable RLS on User table
-- =====================================================
-- The User table stores admin accounts and needs RLS protection

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all users" ON "User";
DROP POLICY IF EXISTS "Users can view own profile" ON "User";
DROP POLICY IF EXISTS "Users can update own profile" ON "User";
DROP POLICY IF EXISTS "Admins can manage all users" ON "User";

-- Policy 1: Admins can do everything with users
CREATE POLICY "Admins can manage all users"
  ON "User"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User" AS u
      WHERE u.id = auth.uid()::text 
      AND u.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User" AS u
      WHERE u.id = auth.uid()::text 
      AND u.role IN ('admin', 'superadmin')
    )
  );

-- Policy 2: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON "User"
  FOR SELECT
  USING (id = auth.uid()::text);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON "User"
  FOR UPDATE
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- =====================================================
-- PART 2: Update BrandSettings RLS policies
-- =====================================================
-- BrandSettings already has RLS enabled, but we need to ensure
-- it has proper policies for both admin management and public read

-- Note: This table already has RLS enabled from migration 20241210_update_brand_settings_rls.sql
-- We're keeping the existing policies as they are already secure:
-- - Public read access (needed for branding display)
-- - Admin-only write access

-- =====================================================
-- PART 3: Fix function search paths
-- =====================================================
-- Set immutable search paths for security functions to prevent
-- search path injection attacks

-- Fix update_updated_at_column function
ALTER FUNCTION "public"."update_updated_at_column"() SET search_path = 'public';

-- Fix update_social_strategy_timestamp function
ALTER FUNCTION "public"."update_social_strategy_timestamp"() SET search_path = 'public';

-- Fix update_autopilot_timestamp function  
ALTER FUNCTION "public"."update_autopilot_timestamp"() SET search_path = 'public';

-- =====================================================
-- PART 4: Add documentation comments
-- =====================================================

COMMENT ON TABLE "User" IS 'Admin user accounts with RLS policies: Admins have full access, users can view/update their own profile';
COMMENT ON TABLE "BrandSettings" IS 'Global branding settings with RLS policies: Public read access, admin-only write access';

-- Add comments for the fixed functions
COMMENT ON FUNCTION "public"."update_updated_at_column"() IS 'Trigger function to update updatedAt timestamp. Search path set to public for security.';
COMMENT ON FUNCTION "public"."update_social_strategy_timestamp"() IS 'Trigger function for SocialMediaStrategy updatedAt. Search path set to public for security.';
COMMENT ON FUNCTION "public"."update_autopilot_timestamp"() IS 'Trigger function for AutopilotConfig updatedAt. Search path set to public for security.';
