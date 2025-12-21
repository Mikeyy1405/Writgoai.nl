const https = require('https');

const SUPABASE_URL = 'https://utursgxvfhhfheeoewfn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0dXJzZ3h2ZmhoZmhlZW9ld2ZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDY4NzU2MCwiZXhwIjoyMDUwMjYzNTYwfQ.gGCMQrZVwqSVdDGPa4PZEzuCbPXdJJxZpqOGtKRRGAo';

const premiumFeeds = [
  // GOOGLE OFFICIAL
  { name: 'Google Search Central Blog', category: 'seo', url: 'https://developers.google.com/search/blog/feeds/posts/default', priority: 10 },
  { name: 'Google AI Blog', category: 'ai', url: 'https://blog.google/technology/ai/rss/', priority: 9 },
  
  // AI MODELS
  { name: 'OpenAI News', category: 'ai', url: 'https://openai.com/news/rss.xml', priority: 10 },
  { name: 'Anthropic News', category: 'ai', url: 'https://www.anthropic.com/news/rss.xml', priority: 9 },
  
  // SEO NEWS
  { name: 'Search Engine Land', category: 'seo', url: 'https://searchengineland.com/feed', priority: 9 },
  { name: 'Search Engine Journal', category: 'seo', url: 'https://www.searchenginejournal.com/feed/', priority: 9 },
  { name: 'Ahrefs Blog', category: 'seo', url: 'https://ahrefs.com/blog/feed/', priority: 8 },
  { name: 'Moz Blog', category: 'seo', url: 'https://moz.com/blog/feed', priority: 8 },
  
  // WORDPRESS
  { name: 'Yoast SEO Blog', category: 'wordpress', url: 'https://yoast.com/feed/', priority: 8 },
  { name: 'WordPress News', category: 'wordpress', url: 'https://wordpress.org/news/feed/', priority: 7 },
  
  // TECH AI
  { name: 'TechCrunch AI', category: 'ai', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', priority: 7 },
  { name: 'The Verge AI', category: 'ai', url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml', priority: 7 }
];

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'utursgxvfhhfheeoewfn.supabase.co',
      path: `/rest/v1/${path}`,
      method: method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body ? JSON.parse(body) : null);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function updateFeeds() {
  console.log('\n🔄 Updating RSS feeds...\n');

  try {
    // Step 1: Delete old feeds
    console.log('1️⃣  Deleting old RSS feeds...');
    await makeRequest('DELETE', 'writgo_content_triggers?trigger_type=eq.rss_feed');
    console.log('   ✅ Old feeds deleted\n');

    // Step 2: Insert new premium feeds
    console.log('2️⃣  Adding premium RSS feeds...\n');
    
    for (const feed of premiumFeeds) {
      const data = {
        name: feed.name,
        trigger_type: 'rss_feed',
        category: feed.category,
        source_url: feed.url,
        check_frequency: feed.priority >= 9 ? 'hourly' : 'daily',
        priority: feed.priority,
        is_active: true
      };

      try {
        await makeRequest('POST', 'writgo_content_triggers', data);
        console.log(`   ✅ ${feed.name} (Priority: ${feed.priority})`);
      } catch (error) {
        console.log(`   ❌ ${feed.name}: ${error.message}`);
      }
    }

    // Step 3: Verify
    console.log('\n3️⃣  Verifying feeds...\n');
    const feeds = await makeRequest('GET', 'writgo_content_triggers?trigger_type=eq.rss_feed&select=name,category,priority,is_active&order=priority.desc,name');
    
    console.log('📊 ACTIVE RSS FEEDS:\n');
    console.log('='.repeat(80));
    
    let byCat = {};
    feeds.forEach(f => {
      if (!byCat[f.category]) byCat[f.category] = [];
      byCat[f.category].push(f);
    });
    
    Object.keys(byCat).sort().forEach(cat => {
      console.log(`\n🏷️  ${cat.toUpperCase()}`);
      byCat[cat].forEach(f => {
        console.log(`   ${f.is_active ? '✅' : '❌'} ${f.name} (Priority: ${f.priority})`);
      });
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n✨ Success! ${feeds.length} premium RSS feeds added!\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

updateFeeds();
