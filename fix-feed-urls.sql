-- Fix Google Search Central Blog RSS URL
UPDATE writgo_content_triggers 
SET feed_url = 'https://feeds.feedburner.com/blogspot/amDG'
WHERE name = 'Google Search Central Blog';

-- Remove Anthropic News feed (404 error - doesn't exist)
DELETE FROM writgo_content_triggers 
WHERE name = 'Anthropic News';

-- Check if feeds exist
SELECT id, name, feed_url, is_active, last_checked_at 
FROM writgo_content_triggers 
ORDER BY name;
