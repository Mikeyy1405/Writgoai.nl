#!/usr/bin/env tsx
/**
 * Test ALL Claude model IDs from AIML docs to find one that works
 */

import 'dotenv/config';

const AIML_API_KEY = process.env.AIML_API_KEY;
const AIML_API_URL = 'https://api.aimlapi.com/v1';

// ALL Claude model IDs from AIML documentation
const ALL_CLAUDE_MODELS = [
  // Claude Sonnet 4.5 (alle varianten)
  'anthropic/claude-sonnet-4.5',
  'claude-sonnet-4-5',
  'claude-sonnet-4-5-20250929',

  // Claude 4.5 Haiku
  'anthropic/claude-haiku-4.5',
  'claude-haiku-4-5',
  'claude-haiku-4-5-20251001',

  // Claude 4 Sonnet
  'anthropic/claude-sonnet-4',

  // Claude 4 Opus
  'anthropic/claude-opus-4',

  // Claude 4.1 Opus
  'anthropic/claude-opus-4.1',
  'claude-opus-4-1',
  'claude-opus-4-1-20250805',

  // Claude 3.7 Sonnet
  'claude-3-7-sonnet-20250219',

  // Claude 3.5 Haiku
  'claude-3-5-haiku-20241022',

  // Claude 3 Opus
  'claude-3-opus-20240229',

  // Claude 3 Haiku
  'claude-3-haiku-20240307',
];

async function testModel(modelId: string): Promise<boolean> {
  try {
    const response = await fetch(`${AIML_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 5,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const reply = data.choices[0]?.message?.content;
      console.log(`✅ ${modelId.padEnd(40)} → Works! Reply: "${reply}"`);
      return true;
    } else {
      const error = await response.json();
      const errorMsg = error.error?.message || 'Unknown error';
      console.log(`❌ ${modelId.padEnd(40)} → ${errorMsg.substring(0, 50)}`);
      return false;
    }
  } catch (err: any) {
    console.log(`❌ ${modelId.padEnd(40)} → ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Testing ALL Claude Models from AIML Documentation\n');
  console.log('='.repeat(80));

  if (!AIML_API_KEY) {
    console.error('❌ AIML_API_KEY not set!');
    process.exit(1);
  }

  const results: Array<{ model: string; works: boolean }> = [];

  for (const modelId of ALL_CLAUDE_MODELS) {
    const works = await testModel(modelId);
    results.push({ model: modelId, works });
    await new Promise(r => setTimeout(r, 500)); // Rate limiting
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 RESULTS\n');

  const working = results.filter(r => r.works);
  const failed = results.filter(r => !r.works);

  if (working.length > 0) {
    console.log(`✅ WORKING MODELS (${working.length}):`);
    working.forEach(r => console.log(`   ${r.model}`));

    console.log('\n💡 UPDATE YOUR CODE:');
    console.log(`   CONTENT: '${working[0].model}',`);
  } else {
    console.log('❌ NO WORKING CLAUDE MODELS!');
    console.log('\nThis means:');
    console.log('1. AIML API has issues with Anthropic backend');
    console.log('2. Temporary outage');
    console.log('3. Account issue (contact AIML support)');
  }

  if (failed.length > 0) {
    console.log(`\n❌ FAILED MODELS (${failed.length}):`);
    failed.slice(0, 5).forEach(r => console.log(`   ${r.model}`));
    if (failed.length > 5) {
      console.log(`   ... and ${failed.length - 5} more`);
    }
  }

  console.log('\n' + '='.repeat(80));

  if (working.length === 0) {
    console.log('\n🔧 TRY THESE ALTERNATIVES (also high quality):');
    console.log('   - gpt-4o (OpenAI)');
    console.log('   - deepseek/deepseek-chat (DeepSeek V3)');
    console.log('   - google/gemini-2.5-flash (Google)');
    console.log('\nTest with: npx tsx scripts/test-alternative-models.ts');
  }
}

main().catch(console.error);
