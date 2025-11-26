import { config } from 'dotenv';
config();

async function testDataForSEO() {
  const username = process.env.DATAFORSEO_USERNAME;
  const password = process.env.DATAFORSEO_PASSWORD;
  
  console.log('🔑 Testing DataForSEO API credentials...\n');
  console.log('Username:', username ? '✅ Set' : '❌ Missing');
  console.log('Password:', password ? '✅ Set' : '❌ Missing');
  
  if (!username || !password) {
    console.log('\n❌ Credentials not configured properly');
    return;
  }
  
  try {
    // Test API connection with a simple ping
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    const response = await fetch('https://api.dataforseo.com/v3/appendix/user_data', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ DataForSEO API connection successful!');
      console.log('Account info:', data);
    } else {
      console.log('\n❌ API connection failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
  } catch (error: any) {
    console.error('\n❌ Error testing API:', error.message);
  }
}

testDataForSEO();
