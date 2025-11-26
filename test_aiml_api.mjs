const AIML_API_KEY = 'eb1cd6eaee0d4c5ca30dffe07cdcb600';

async function testAIMLAPI() {
  try {
    console.log('🧪 Testing AIML API...');
    
    const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: 'Hallo, kun je mij horen? Antwoord kort.'
          }
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Success!');
    console.log('📝 Response:', JSON.stringify(data, null, 2));
    
    if (data.choices && data.choices[0]) {
      console.log('\n💬 Assistant message:', data.choices[0].message.content);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAIMLAPI();
