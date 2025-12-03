require('dotenv').config();

async function testScanAPI() {
  console.log('Testing scan API endpoint...');
  
  try {
    const response = await fetch('http://localhost:3000/api/ai-planner/scan-website', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: 'cmh1ucd0r0000xn3puer3mc7t',
        url: 'https://WritgoAI.nl'
      }),
    });
    
    console.log('Status:', response.status);
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testScanAPI();
