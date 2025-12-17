-- Delete cache entries with /blogs in URL
DELETE FROM "WordPressSitemapCache" WHERE url LIKE '%/blogs%';

-- Show remaining counts
SELECT 
  "projectId",
  COUNT(*) as count
FROM "WordPressSitemapCache" 
GROUP BY "projectId";
