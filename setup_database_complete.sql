-- COMPLETE DATABASE SETUP FOR WRITGO.AI
-- This script sets up the entire subscribers table and admin system
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: CREATE SUBSCRIBERS TABLE
-- ============================================

-- Create subscribers table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Subscription details
  subscription_tier TEXT CHECK (subscription_tier IN ('starter', 'pro', 'enterprise')),
  subscription_active BOOLEAN DEFAULT false,

  -- Stripe references
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,

  -- Credit management
  credits_remaining INTEGER DEFAULT 0,
  monthly_credits INTEGER DEFAULT 0,

  -- Admin flag
  is_admin BOOLEAN DEFAULT false,

  -- Timestamps
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one subscriber per user
  UNIQUE(user_id)
);

-- ============================================
-- STEP 2: ADD MISSING COLUMNS
-- ============================================

-- Add columns if table exists but columns are missing
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscribers') THEN

    -- Add is_admin if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'subscribers' AND column_name = 'is_admin') THEN
      ALTER TABLE subscribers ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;

    -- Add credits_remaining if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'subscribers' AND column_name = 'credits_remaining') THEN
      ALTER TABLE subscribers ADD COLUMN credits_remaining INTEGER DEFAULT 0;
    END IF;

    -- Add monthly_credits if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'subscribers' AND column_name = 'monthly_credits') THEN
      ALTER TABLE subscribers ADD COLUMN monthly_credits INTEGER DEFAULT 0;
    END IF;

    -- Add subscription_tier if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'subscribers' AND column_name = 'subscription_tier') THEN
      ALTER TABLE subscribers ADD COLUMN subscription_tier TEXT CHECK (subscription_tier IN ('starter', 'pro', 'enterprise'));
    END IF;

    -- Add subscription_active if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'subscribers' AND column_name = 'subscription_active') THEN
      ALTER TABLE subscribers ADD COLUMN subscription_active BOOLEAN DEFAULT false;
    END IF;

  END IF;
END $$;

-- ============================================
-- STEP 3: CREATE CREDIT USAGE LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS credit_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Action details
  action TEXT NOT NULL,
  credits_used INTEGER NOT NULL,

  -- Optional metadata
  metadata JSONB,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 4: CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_customer ON subscribers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_subscription ON subscribers(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers(subscription_active);
CREATE INDEX IF NOT EXISTS idx_subscribers_admin ON subscribers(is_admin);

CREATE INDEX IF NOT EXISTS idx_credit_usage_user_id ON credit_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_created ON credit_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_usage_action ON credit_usage_logs(action);

-- ============================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on subscribers table
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own subscription" ON subscribers;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscribers;
DROP POLICY IF EXISTS "Service role has full access to subscribers" ON subscribers;
DROP POLICY IF EXISTS "Service role and admins have full access" ON subscribers;

-- Users can read their own subscription data
CREATE POLICY "Users can view own subscription"
  ON subscribers FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own subscription (for limited fields)
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

-- Enable RLS on credit_usage_logs
ALTER TABLE credit_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own usage logs" ON credit_usage_logs;
DROP POLICY IF EXISTS "Service role can insert usage logs" ON credit_usage_logs;

-- Users can read their own usage logs
CREATE POLICY "Users can view own usage logs"
  ON credit_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert usage logs
CREATE POLICY "Service role can insert usage logs"
  ON credit_usage_logs FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- STEP 6: CREATE FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update subscribers.updated_at
DROP TRIGGER IF EXISTS update_subscribers_updated_at ON subscribers;
CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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
-- STEP 7: FIX EXISTING USERS
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
-- STEP 8: MAKE info@writgo.nl ADMIN
-- ============================================

-- Update existing record if it exists
UPDATE subscribers
SET
  is_admin = true,
  subscription_active = true,
  subscription_tier = 'enterprise',
  credits_remaining = 999999,
  monthly_credits = 999999
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'info@writgo.nl'
);

-- If info@writgo.nl doesn't have a subscriber record yet, create one
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
WHERE email = 'info@writgo.nl'
AND id NOT IN (SELECT user_id FROM subscribers)
ON CONFLICT (user_id) DO UPDATE SET
  is_admin = true,
  subscription_active = true,
  subscription_tier = 'enterprise',
  credits_remaining = 999999,
  monthly_credits = 999999;

-- ============================================
-- STEP 9: ADD COMMENTS
-- ============================================

COMMENT ON TABLE subscribers IS 'Stores user subscription and credit information for the credit-based pricing system';
COMMENT ON TABLE credit_usage_logs IS 'Logs all credit usage for analytics and transparency';
COMMENT ON COLUMN subscribers.credits_remaining IS 'Current credit balance';
COMMENT ON COLUMN subscribers.monthly_credits IS 'Monthly credit allowance based on subscription tier';
COMMENT ON COLUMN subscribers.subscription_tier IS 'Current subscription tier: starter, pro, or enterprise';
COMMENT ON COLUMN subscribers.is_admin IS 'Admin users have unlimited credits and full access';
COMMENT ON FUNCTION create_subscriber_for_new_user() IS 'Automatically creates subscriber record with 25 free credits when user registers';

-- ============================================
-- VERIFICATION
-- ============================================

-- Check if setup was successful
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM subscribers s
  JOIN auth.users u ON s.user_id = u.id
  WHERE u.email = 'info@writgo.nl' AND s.is_admin = true;

  IF admin_count > 0 THEN
    RAISE NOTICE '✓ SUCCESS: info@writgo.nl is now an admin!';
  ELSE
    RAISE NOTICE '⚠ WARNING: info@writgo.nl admin setup may have failed. Check if the user exists.';
  END IF;
END $$;

-- Show admin users
SELECT
  u.email,
  s.is_admin,
  s.subscription_active,
  s.subscription_tier,
  s.credits_remaining,
  s.monthly_credits
FROM subscribers s
JOIN auth.users u ON s.user_id = u.id
WHERE s.is_admin = true;
