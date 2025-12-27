#!/usr/bin/env tsx
/**
 * Test high-quality alternative models if Claude is down
 */

import 'dotenv/config';

const AIML_API_KEY = process.env.AIML_API_KEY;
const AIML_API_URL = 'https://api.aimlapi.com/v1';

// Top alternative models for content generation
const ALTERNATIVE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o (OpenAI)' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini (OpenAI)' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 Chat' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'x-ai/grok-3-beta', name: 'Grok 3 Beta' },
  { id: 'mistralai/mistral-large-latest', name: 'Mistral Large' },
];

async function testModel(model: { id: string; name: string }) {
  try {
    const response = await fetch(`${AIML_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.id,
        messages: [{ role: 'user', content: 'Write one sentence about AI.' }],
        max_tokens: 50,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const reply = data.choices[0]?.message?.content;
      console.log(`✅ ${model.name.padEnd(30)} Works!`);
      console.log(`   "${reply}"`);
      return true;
    } else {
      console.log(`❌ ${model.name.padEnd(30)} Failed`);
      return false;
    }
  } catch (err) {
    console.log(`❌ ${model.name.padEnd(30)} Error`);
    return false;
  }
}

async function main() {
  console.log('🔍 Testing Alternative High-Quality Models\n');
  console.log('='.repeat(80));

  const results = [];

  for (const model of ALTERNATIVE_MODELS) {
    const works = await testModel(model);
    results.push({ ...model, works });
    console.log('');
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('='.repeat(80));
  console.log('\n📊 WORKING ALTERNATIVES:\n');

  const working = results.filter(r => r.works);

  if (working.length > 0) {
    console.log('Use one of these in lib/ai-client.ts:\n');
    working.forEach(r => {
      console.log(`   CONTENT: '${r.id}',  // ${r.name}`);
    });
    console.log('\nThey all provide excellent content quality!');
  } else {
    console.log('❌ No alternative models working either.');
    console.log('This suggests an AIML API account or connectivity issue.');
  }
}

main().catch(console.error);
