-- Credit-Based Pricing System Database Migration
-- This migration creates/updates tables needed for the credit-based subscription system

-- ============================================
-- SUBSCRIBERS TABLE
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
  
  -- Timestamps
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one subscriber per user
  UNIQUE(user_id)
);

-- Add columns if table exists but columns are missing
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscribers') THEN
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
    
    -- Add stripe_customer_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscribers' AND column_name = 'stripe_customer_id') THEN
      ALTER TABLE subscribers ADD COLUMN stripe_customer_id TEXT UNIQUE;
    END IF;
    
    -- Add stripe_subscription_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscribers' AND column_name = 'stripe_subscription_id') THEN
      ALTER TABLE subscribers ADD COLUMN stripe_subscription_id TEXT UNIQUE;
    END IF;
  END IF;
END $$;

-- ============================================
-- CREDIT USAGE LOGS TABLE
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
-- AI GENERATION LOGS UPDATE
-- ============================================
-- Add credits_used field to existing ai_generation_logs if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_generation_logs') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ai_generation_logs' AND column_name = 'credits_used') THEN
      ALTER TABLE ai_generation_logs ADD COLUMN credits_used INTEGER DEFAULT 0;
    END IF;
  END IF;
END $$;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_customer ON subscribers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_subscription ON subscribers(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers(subscription_active);

CREATE INDEX IF NOT EXISTS idx_credit_usage_user_id ON credit_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_created ON credit_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_usage_action ON credit_usage_logs(action);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on subscribers table
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription data
CREATE POLICY "Users can view own subscription"
  ON subscribers FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own subscription (for limited fields)
CREATE POLICY "Users can update own subscription"
  ON subscribers FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can do everything (for Stripe webhooks)
CREATE POLICY "Service role has full access to subscribers"
  ON subscribers FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Enable RLS on credit_usage_logs
ALTER TABLE credit_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage logs
CREATE POLICY "Users can view own usage logs"
  ON credit_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert usage logs
CREATE POLICY "Service role can insert usage logs"
  ON credit_usage_logs FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- FUNCTIONS
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

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE subscribers IS 'Stores user subscription and credit information for the credit-based pricing system';
COMMENT ON TABLE credit_usage_logs IS 'Logs all credit usage for analytics and transparency';
COMMENT ON COLUMN subscribers.credits_remaining IS 'Current credit balance';
COMMENT ON COLUMN subscribers.monthly_credits IS 'Monthly credit allowance based on subscription tier';
COMMENT ON COLUMN subscribers.subscription_tier IS 'Current subscription tier: starter, pro, or enterprise';
