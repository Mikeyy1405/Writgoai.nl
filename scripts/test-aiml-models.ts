#!/usr/bin/env tsx
/**
 * Script to test different AIML API models to find which ones work
 * Run with: npx tsx scripts/test-aiml-models.ts
 */

import 'dotenv/config';

const AIML_API_KEY = process.env.AIML_API_KEY;
const AIML_API_URL = 'https://api.aimlapi.com/v1';

// Models to test (ordered by likelihood of working on pay-as-you-go)
const MODELS_TO_TEST = [
  { id: 'gpt-4o', name: 'GPT-4o (OpenAI)' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini (OpenAI)' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo (OpenAI)' },
  { id: 'mistralai/mistral-large-latest', name: 'Mistral Large' },
  { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5 (Anthropic)' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Anthropic)' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
];

async function testModel(model: { id: string; name: string }) {
  console.log(`\n🧪 Testing: ${model.name}`);
  console.log(`   Model ID: ${model.id}`);

  try {
    const response = await fetch(`${AIML_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.id,
        messages: [
          { role: 'user', content: 'Respond with only "OK" and nothing else.' }
        ],
        max_tokens: 10,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log(`   ❌ FAILED (${response.status})`);

      if (errorData.error?.message) {
        console.log(`   Error: ${errorData.error.message.substring(0, 100)}`);

        if (errorData.error.message.includes('credit')) {
          console.log(`   💡 Reason: Insufficient credits or model not in plan`);
        }
      }
      return false;
    } else {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      console.log(`   ✅ SUCCESS`);
      console.log(`   Response: "${content}"`);

      if (data.usage) {
        console.log(`   Usage: ${JSON.stringify(data.usage)}`);
      }

      return true;
    }
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Testing AIML API Models\n');
  console.log('=' .repeat(60));

  if (!AIML_API_KEY) {
    console.error('\n❌ AIML_API_KEY is not set!');
    process.exit(1);
  }

  console.log(`API Key: ${AIML_API_KEY.substring(0, 10)}...${AIML_API_KEY.substring(AIML_API_KEY.length - 4)}`);
  console.log(`Base URL: ${AIML_API_URL}`);

  const results: Array<{ model: string; name: string; works: boolean }> = [];

  for (const model of MODELS_TO_TEST) {
    const works = await testModel(model);
    results.push({ model: model.id, name: model.name, works });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS SUMMARY\n');

  const working = results.filter(r => r.works);
  const failing = results.filter(r => !r.works);

  if (working.length > 0) {
    console.log('✅ WORKING MODELS:');
    working.forEach(r => console.log(`   - ${r.name} (${r.model})`));
  }

  if (failing.length > 0) {
    console.log('\n❌ FAILING MODELS:');
    failing.forEach(r => console.log(`   - ${r.name} (${r.model})`));
  }

  if (working.length > 0) {
    console.log('\n💡 RECOMMENDATION:');
    console.log(`   Update BEST_MODELS in lib/ai-client.ts to use: ${working[0].model}`);
  } else {
    console.log('\n⚠️  No models working. Check:');
    console.log('   1. AIML API key is correct');
    console.log('   2. Account has sufficient credits');
    console.log('   3. Go to https://aimlapi.com/app to check account status');
  }
}

main().catch(console.error);
