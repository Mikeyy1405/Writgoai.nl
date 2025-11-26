import { config } from 'dotenv';
config();

import { sendChatCompletion } from '@/lib/aiml-chat-client';

async function testAIMLModels() {
  console.log('🧪 Testing AIML Models...\n');
  
  const models = [
    'google/gemini-3-pro-preview',
    'google/gemini-pro',
    'gpt-4o',
    'claude-3-7-sonnet-20250219'
  ];
  
  for (const model of models) {
    console.log(`\n📝 Testing model: ${model}`);
    
    try {
      const response = await sendChatCompletion({
        model,
        messages: [
          { role: 'user', content: 'Say "hello" and nothing else.' }
        ],
        temperature: 0.7,
        max_tokens: 50,
        stream: false
      });
      
      if ('choices' in response) {
        const content = response.choices[0]?.message?.content || '';
        console.log(`✅ ${model} works! Response: ${content.substring(0, 50)}`);
      } else {
        console.log(`❌ ${model} unexpected response format`);
      }
      
    } catch (error: any) {
      console.log(`❌ ${model} failed: ${error.message}`);
    }
  }
}

testAIMLModels();
