-- Make info@writgo.nl an admin user
-- Run this SQL in your Supabase SQL Editor

-- Update subscriber to be admin with unlimited credits
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

-- Verify the update
SELECT
  s.id,
  s.user_id,
  u.email,
  s.is_admin,
  s.subscription_active,
  s.subscription_tier,
  s.credits_remaining,
  s.monthly_credits
FROM subscribers s
JOIN auth.users u ON s.user_id = u.id
WHERE u.email = 'info@writgo.nl';
