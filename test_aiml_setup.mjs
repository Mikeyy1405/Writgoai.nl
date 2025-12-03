import OpenAI from 'openai';

const AIML_API_KEY = 'eb1cd6eaee0d4c5ca30dffe07cdcb600';
const AIML_BASE_URL = 'https://api.aimlapi.com/v1';

// OpenAI SDK client met AIML base URL (zoals in docs)
const client = new OpenAI({
  apiKey: AIML_API_KEY,
  baseURL: AIML_BASE_URL,
});

async function testSetup() {
  try {
    console.log('🧪 Testing AIML API setup met OpenAI SDK...');
    console.log('📍 Base URL:', AIML_BASE_URL);
    console.log('🔑 API Key:', AIML_API_KEY ? '✅ Ingesteld' : '❌ Niet ingesteld');
    console.log('');
    
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Je bent een vriendelijke assistent.' },
        { role: 'user', content: 'Zeg hallo in het Nederlands!' }
      ],
      temperature: 0.7,
      max_tokens: 50,
    });

    const response = completion.choices[0]?.message?.content;
    
    console.log('✅ AIML API SETUP WERKT!');
    console.log('📝 Response:', response);
    console.log('🤖 Model gebruikt:', completion.model);
    
  } catch (error) {
    console.error('❌ AIML API setup test FAILED:');
    console.error('Error:', error.message);
  }
}

testSetup();
