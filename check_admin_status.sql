-- Check admin status for all users
-- Run this in Supabase SQL Editor to see all admin users

SELECT
  s.id,
  s.user_id,
  u.email,
  s.is_admin,
  s.subscription_active,
  s.subscription_tier,
  s.credits_remaining,
  s.monthly_credits,
  s.created_at
FROM subscribers s
JOIN auth.users u ON s.user_id = u.id
ORDER BY s.is_admin DESC, s.created_at DESC;

-- Check specific user (info@writgo.nl)
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
