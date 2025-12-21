SELECT status, COUNT(*) as count 
FROM writgo_content_opportunities 
GROUP BY status 
ORDER BY count DESC;
