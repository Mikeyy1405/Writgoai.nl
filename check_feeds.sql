SELECT 
  name,
  category,
  source_url,
  is_active,
  last_checked_at
FROM writgo_content_triggers
WHERE trigger_type = 'rss_feed'
ORDER BY category, name;
