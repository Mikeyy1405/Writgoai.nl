import * as dotenv from 'dotenv';
dotenv.config();

const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret';
const API_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

console.log('Testing cron job trigger...');
console.log('API URL:', API_URL);
console.log('Using CRON_SECRET:', CRON_SECRET ? '✓ (set)' : '✗ (not set)');

async function triggerAutopilot() {
  try {
    const response = await fetch(`${API_URL}/api/cron/autopilot-projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\nResponse status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const text = await response.text();
    console.log('\nResponse text:', text.substring(0, 500));
    
    try {
      const data = JSON.parse(text);
      console.log('\nParsed response:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('\n⚠️  Response is not JSON');
    }
    
    if (response.ok) {
      console.log('\n✅ Autopilot cron job executed successfully!');
    } else {
      console.log('\n❌ Autopilot cron job failed with status:', response.status);
    }
  } catch (error) {
    console.error('\n❌ Error triggering autopilot:', error.message);
  }
}

triggerAutopilot();
