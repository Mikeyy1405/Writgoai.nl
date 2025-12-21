#!/bin/bash

SUPABASE_URL="https://utursgxvfhhfheeoewfn.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0dXJzZ3h2ZmhoZmhlZW9ld2ZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDY4NzU2MCwiZXhwIjoyMDUwMjYzNTYwfQ.gGCMQrZVwqSVdDGPa4PZEzuCbPXdJJxZpqOGtKRRGAo"

echo "🔄 Deleting old RSS feeds..."
curl -X DELETE "${SUPABASE_URL}/rest/v1/writgo_content_triggers?trigger_type=eq.rss_feed" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json"

echo -e "\n\n✅ Old feeds deleted\n"
echo "📡 Adding premium RSS feeds...\n"

# Google Search Central Blog
curl -X POST "${SUPABASE_URL}/rest/v1/writgo_content_triggers" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "name": "Google Search Central Blog",
    "trigger_type": "rss_feed",
    "category": "seo",
    "source_url": "https://developers.google.com/search/blog/feeds/posts/default",
    "check_frequency": "hourly",
    "priority": 10,
    "is_active": true
  }'
echo "✅ Google Search Central Blog"

# OpenAI News
curl -X POST "${SUPABASE_URL}/rest/v1/writgo_content_triggers" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "name": "OpenAI News",
    "trigger_type": "rss_feed",
    "category": "ai",
    "source_url": "https://openai.com/news/rss.xml",
    "check_frequency": "hourly",
    "priority": 10,
    "is_active": true
  }'
echo "✅ OpenAI News"

# Google AI Blog
curl -X POST "${SUPABASE_URL}/rest/v1/writgo_content_triggers" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "name": "Google AI Blog",
    "trigger_type": "rss_feed",
    "category": "ai",
    "source_url": "https://blog.google/technology/ai/rss/",
    "check_frequency": "daily",
    "priority": 9,
    "is_active": true
  }'
echo "✅ Google AI Blog"

# Anthropic News
curl -X POST "${SUPABASE_URL}/rest/v1/writgo_content_triggers" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "name": "Anthropic News",
    "trigger_type": "rss_feed",
    "category": "ai",
    "source_url": "https://www.anthropic.com/news/rss.xml",
    "check_frequency": "daily",
    "priority": 9,
    "is_active": true
  }'
echo "✅ Anthropic News"

# Search Engine Land
curl -X POST "${SUPABASE_URL}/rest/v1/writgo_content_triggers" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "name": "Search Engine Land",
    "trigger_type": "rss_feed",
    "category": "seo",
    "source_url": "https://searchengineland.com/feed",
    "check_frequency": "hourly",
    "priority": 9,
    "is_active": true
  }'
echo "✅ Search Engine Land"

# Search Engine Journal
curl -X POST "${SUPABASE_URL}/rest/v1/writgo_content_triggers" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "name": "Search Engine Journal",
    "trigger_type": "rss_feed",
    "category": "seo",
    "source_url": "https://www.searchenginejournal.com/feed/",
    "check_frequency": "daily",
    "priority": 9,
    "is_active": true
  }'
echo "✅ Search Engine Journal"

# Ahrefs Blog
curl -X POST "${SUPABASE_URL}/rest/v1/writgo_content_triggers" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "name": "Ahrefs Blog",
    "trigger_type": "rss_feed",
    "category": "seo",
    "source_url": "https://ahrefs.com/blog/feed/",
    "check_frequency": "daily",
    "priority": 8,
    "is_active": true
  }'
echo "✅ Ahrefs Blog"

# Moz Blog
curl -X POST "${SUPABASE_URL}/rest/v1/writgo_content_triggers" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "name": "Moz Blog",
    "trigger_type": "rss_feed",
    "category": "seo",
    "source_url": "https://moz.com/blog/feed",
    "check_frequency": "daily",
    "priority": 8,
    "is_active": true
  }'
echo "✅ Moz Blog"

# Yoast SEO Blog
curl -X POST "${SUPABASE_URL}/rest/v1/writgo_content_triggers" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "name": "Yoast SEO Blog",
    "trigger_type": "rss_feed",
    "category": "wordpress",
    "source_url": "https://yoast.com/feed/",
    "check_frequency": "daily",
    "priority": 8,
    "is_active": true
  }'
echo "✅ Yoast SEO Blog"

# WordPress News
curl -X POST "${SUPABASE_URL}/rest/v1/writgo_content_triggers" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "name": "WordPress News",
    "trigger_type": "rss_feed",
    "category": "wordpress",
    "source_url": "https://wordpress.org/news/feed/",
    "check_frequency": "daily",
    "priority": 7,
    "is_active": true
  }'
echo "✅ WordPress News"

# TechCrunch AI
curl -X POST "${SUPABASE_URL}/rest/v1/writgo_content_triggers" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "name": "TechCrunch AI",
    "trigger_type": "rss_feed",
    "category": "ai",
    "source_url": "https://techcrunch.com/category/artificial-intelligence/feed/",
    "check_frequency": "daily",
    "priority": 7,
    "is_active": true
  }'
echo "✅ TechCrunch AI"

# The Verge AI
curl -X POST "${SUPABASE_URL}/rest/v1/writgo_content_triggers" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "name": "The Verge AI",
    "trigger_type": "rss_feed",
    "category": "ai",
    "source_url": "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml",
    "check_frequency": "daily",
    "priority": 7,
    "is_active": true
  }'
echo "✅ The Verge AI"

echo -e "\n\n🎉 Done! 12 premium RSS feeds added!\n"
