-- Fix Admin Access - Case Insensitive Email Check
-- This migration fixes the admin access issue where emails with different
-- capitalization (e.g., 'Info@writgo.nl' vs 'info@writgo.nl') were not recognized

-- ============================================
-- FIX ADMIN STATUS WITH CASE-INSENSITIVE CHECK
-- ============================================

-- Set admin status for info@writgo.nl (case-insensitive)
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
ON CONFLICT (user_id) DO UPDATE SET
  is_admin = true,
  subscription_active = true,
  subscription_tier = 'enterprise',
  credits_remaining = 999999,
  monthly_credits = 999999;

-- ============================================
-- VERIFY THE FIX
-- ============================================

-- This query shows all admin users after the fix
-- SELECT u.email, s.is_admin, s.subscription_tier, s.credits_remaining
-- FROM subscribers s
-- JOIN auth.users u ON s.user_id = u.id
-- WHERE LOWER(u.email) = LOWER('info@writgo.nl');
