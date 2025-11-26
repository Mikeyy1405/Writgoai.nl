import * as dotenv from 'dotenv';
dotenv.config();

const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret';
const API_URL = 'https://WritgoAI.nl';

console.log('🚀 Triggering autopilot cron job manually...');
console.log('API URL:', API_URL);
console.log('Time:', new Date().toISOString());

async function triggerAutopilot() {
  try {
    const response = await fetch(`${API_URL}/api/cron/autopilot-projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n📊 Response status:', response.status);
    
    const text = await response.text();
    
    try {
      const data = JSON.parse(text);
      console.log('\n✅ Autopilot response:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.results) {
        console.log('\n📈 Summary:');
        console.log(`  Total projects processed: ${data.processed}`);
        console.log(`  Timestamp: ${data.timestamp}`);
        
        data.results.forEach((result, index) => {
          console.log(`\n  ${index + 1}. ${result.projectName} (${result.projectId})`);
          if (result.processed) {
            console.log(`     ✓ Processed: ${result.processed} articles`);
            console.log(`     ✓ Successful: ${result.successful}`);
            if (result.failed > 0) {
              console.log(`     ⚠ Failed: ${result.failed}`);
            }
          } else if (result.status === 'no_articles') {
            console.log(`     ⚠ ${result.message}`);
          } else if (result.error) {
            console.log(`     ❌ Error: ${result.error}`);
          }
        });
      }
      
    } catch (e) {
      console.log('\n⚠️  Response is not JSON:');
      console.log(text.substring(0, 1000));
    }
    
  } catch (error) {
    console.error('\n❌ Error triggering autopilot:', error.message);
  }
}

triggerAutopilot();
