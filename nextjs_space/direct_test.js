const fetch = require('node-fetch');

async function testScan() {
  console.log('Testing scan API...');
  
  const response = await fetch('http://localhost:3000/api/ai-planner/scan-website', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'next-auth.session-token=test'
    },
    body: JSON.stringify({
      url: 'https://WritgoAI.nl',
      clientId: 'cmh1ucd0r0000xn3puer3mc7t'
    })
  });
  
  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

testScan().catch(console.error);
