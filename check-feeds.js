const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utursgxvfhhfheeoewfn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0dXJzZ3h2ZmhoZmhlZW9ld2ZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDY4NzU2MCwiZXhwIjoyMDUwMjYzNTYwfQ.gGCMQrZVwqSVdDGPa4PZEzuCbPXdJJxZpqOGtKRRGAo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFeeds() {
  const { data, error } = await supabase
    .from('writgo_content_triggers')
    .select('name, category, source_url, is_active, last_checked_at')
    .eq('trigger_type', 'rss_feed')
    .order('category')
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📡 RSS FEEDS DIE WE VOLGEN:\n');
  console.log('='.repeat(100));
  
  let currentCategory = '';
  let totalActive = 0;
  let totalInactive = 0;
  
  data.forEach(feed => {
    if (feed.category !== currentCategory) {
      currentCategory = feed.category;
      console.log(`\n🏷️  ${currentCategory.toUpperCase()}`);
      console.log('-'.repeat(100));
    }
    
    const status = feed.is_active ? '✅' : '❌';
    const lastCheck = feed.last_checked_at 
      ? new Date(feed.last_checked_at).toLocaleString('nl-NL')
      : 'Nog nooit';
    
    console.log(`${status} ${feed.name}`);
    console.log(`   URL: ${feed.source_url}`);
    console.log(`   Laatst gecontroleerd: ${lastCheck}\n`);
    
    if (feed.is_active) totalActive++;
    else totalInactive++;
  });
  
  console.log('='.repeat(100));
  console.log(`\n📊 TOTAAL: ${data.length} feeds (${totalActive} actief, ${totalInactive} inactief)\n`);
}

checkFeeds();
