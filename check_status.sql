SELECT status, COUNT(*) as count, MAX(created_at) as latest
FROM writgo_content_opportunities 
GROUP BY status 
ORDER BY count DESC;
