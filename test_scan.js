require('dotenv').config();

async function testOpenAI() {
  console.log('Testing OpenAI API...');
  console.log('API Key:', process.env.OPENAI_API_KEY?.substring(0, 20) + '...');
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'user', content: 'Say "test successful" in JSON format' }
        ],
        temperature: 0.3,
        max_tokens: 50,
        response_format: { type: "json_object" }
      }),
    });
    
    console.log('Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ OpenAI API werkt!');
    console.log('Response:', data.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOpenAI();
