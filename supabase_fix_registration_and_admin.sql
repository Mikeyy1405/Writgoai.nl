-- Fix Registration and Admin System
-- This migration adds:
-- 1. Automatic subscriber creation for new users with 25 free credits
-- 2. Admin role support for unlimited credits
-- 3. Fixes for existing users without subscriber records

-- ============================================
-- ADD ADMIN FIELDS TO SUBSCRIBERS
-- ============================================

-- Add is_admin column to subscribers table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'subscribers' AND column_name = 'is_admin') THEN
    ALTER TABLE subscribers ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Set info@writgo.nl as admin with unlimited credits (case-insensitive)
UPDATE subscribers
SET
  is_admin = true,
  subscription_active = true,
  subscription_tier = 'enterprise',
  credits_remaining = 999999,
  monthly_credits = 999999
WHERE user_id IN (
  SELECT id FROM auth.users WHERE LOWER(email) = LOWER('info@writgo.nl')
);

-- If info@writgo.nl doesn't have a subscriber record yet, create one (case-insensitive)
INSERT INTO subscribers (
  user_id,
  is_admin,
  subscription_active,
  subscription_tier,
  credits_remaining,
  monthly_credits
)
SELECT
  id,
  true,
  true,
  'enterprise',
  999999,
  999999
FROM auth.users
WHERE LOWER(email) = LOWER('info@writgo.nl')
AND id NOT IN (SELECT user_id FROM subscribers)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- AUTO-CREATE SUBSCRIBER ON USER REGISTRATION
-- ============================================

-- Function to create subscriber record for new users
CREATE OR REPLACE FUNCTION create_subscriber_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create subscriber record with 25 free credits
  INSERT INTO subscribers (
    user_id,
    subscription_active,
    subscription_tier,
    credits_remaining,
    monthly_credits,
    is_admin
  ) VALUES (
    NEW.id,
    true,  -- Active by default (free trial)
    'starter',  -- Default tier
    25,  -- 25 free credits
    25,  -- Monthly allowance
    false  -- Not admin by default
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create subscriber on user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_subscriber_for_new_user();

-- ============================================
-- FIX EXISTING USERS WITHOUT SUBSCRIBERS
-- ============================================

-- Create subscriber records for existing users who don't have one
INSERT INTO subscribers (
  user_id,
  subscription_active,
  subscription_tier,
  credits_remaining,
  monthly_credits,
  is_admin
)
SELECT
  u.id,
  true,
  'starter',
  25,
  25,
  false
FROM auth.users u
LEFT JOIN subscribers s ON u.id = s.user_id
WHERE s.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- UPDATE RLS POLICIES FOR ADMIN
-- ============================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Service role has full access to subscribers" ON subscribers;
DROP POLICY IF EXISTS "Users can view own subscription" ON subscribers;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscribers;

-- Recreate policies with admin support
CREATE POLICY "Users can view own subscription"
  ON subscribers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscribers FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role and admins have full access
CREATE POLICY "Service role and admins have full access"
  ON subscribers FOR ALL
  USING (
    auth.jwt()->>'role' = 'service_role'
    OR
    EXISTS (
      SELECT 1 FROM subscribers
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

-- ============================================
-- ADD COMMENTS
-- ============================================

COMMENT ON COLUMN subscribers.is_admin IS 'Admin users have unlimited credits and full access';
COMMENT ON FUNCTION create_subscriber_for_new_user() IS 'Automatically creates subscriber record with 25 free credits when user registers';
