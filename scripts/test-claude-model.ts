#!/usr/bin/env tsx
/**
 * Test Claude Sonnet 4.5 access on AIML API with current credits
 * Run with: npx tsx scripts/test-claude-model.ts
 */

import 'dotenv/config';

const AIML_API_KEY = process.env.AIML_API_KEY;
const AIML_API_URL = 'https://api.aimlapi.com/v1';

// Different possible model ID formats to test
const CLAUDE_MODEL_VARIANTS = [
  'anthropic/claude-sonnet-4.5',
  'anthropic/claude-4.5-sonnet',
  'anthropic/claude-sonnet-4-5',
  'anthropic/claude-4-5-sonnet',
  'claude-sonnet-4.5',
  'claude-4.5-sonnet',
  'anthropic/claude-3.5-sonnet',
  'claude-3-5-sonnet-20241022',
];

async function testClaudeModel(modelId: string) {
  console.log(`\n🧪 Testing: ${modelId}`);

  try {
    const response = await fetch(`${AIML_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'user', content: 'Respond with only "SUCCESS" and nothing else.' }
        ],
        max_tokens: 10,
        temperature: 0,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.log(`   ❌ FAILED (${response.status})`);

      if (responseData.error?.message) {
        const errorMsg = responseData.error.message;
        console.log(`   Error: ${errorMsg.substring(0, 150)}`);

        if (errorMsg.includes('credit') || errorMsg.includes('balance')) {
          console.log(`   💡 This looks like a credit/billing issue`);
        } else if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
          console.log(`   💡 This model ID doesn't exist`);
        } else if (errorMsg.includes('access') || errorMsg.includes('permission')) {
          console.log(`   💡 Access/permission issue with this model`);
        }
      }

      // Log full error for debugging
      console.log(`   Full error:`, JSON.stringify(responseData, null, 2));
      return { success: false, modelId, error: responseData.error?.message };
    } else {
      const content = responseData.choices?.[0]?.message?.content || '';
      console.log(`   ✅ SUCCESS!`);
      console.log(`   Response: "${content}"`);

      if (responseData.usage) {
        console.log(`   Tokens: ${JSON.stringify(responseData.usage)}`);
      }

      return { success: true, modelId, response: content };
    }
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return { success: false, modelId, error: error.message };
  }
}

async function main() {
  console.log('🔍 Testing Claude Model Access on AIML API\n');
  console.log('=' .repeat(70));

  if (!AIML_API_KEY) {
    console.error('\n❌ AIML_API_KEY is not set!');
    console.log('Set it in your .env file or environment:');
    console.log('  export AIML_API_KEY=your-key-here\n');
    process.exit(1);
  }

  console.log(`✅ API Key: ${AIML_API_KEY.substring(0, 10)}...${AIML_API_KEY.substring(AIML_API_KEY.length - 4)}`);
  console.log(`✅ Base URL: ${AIML_API_URL}`);
  console.log(`\nTesting ${CLAUDE_MODEL_VARIANTS.length} different Claude model ID formats...\n`);

  const results = [];

  for (const modelId of CLAUDE_MODEL_VARIANTS) {
    const result = await testClaudeModel(modelId);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 RESULTS SUMMARY\n');

  const working = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  if (working.length > 0) {
    console.log('✅ WORKING MODEL IDs:');
    working.forEach(r => console.log(`   - ${r.modelId}`));
    console.log('\n💡 USE THIS IN lib/ai-client.ts:');
    console.log(`   CONTENT: '${working[0].modelId}',`);
  } else {
    console.log('❌ NO WORKING MODELS FOUND\n');
  }

  if (failed.length > 0) {
    console.log('\n❌ FAILED MODEL IDs:');
    failed.forEach(r => {
      console.log(`   - ${r.modelId}`);
      if (r.error && r.error.includes('credit')) {
        console.log(`     → Credit/billing issue`);
      }
    });
  }

  // Check if all failed with credit errors
  const allCreditErrors = failed.every(r =>
    r.error && (r.error.includes('credit') || r.error.includes('balance'))
  );

  if (allCreditErrors && working.length === 0) {
    console.log('\n⚠️  ALL MODELS FAILED WITH CREDIT ERRORS\n');
    console.log('This suggests:');
    console.log('1. Your AIML API account needs Claude model access enabled');
    console.log('2. Go to https://aimlapi.com/app');
    console.log('3. Check if Claude models require separate enablement');
    console.log('4. Contact AIML support if you have credits but can\'t access Claude\n');
  }

  console.log('\n📝 Next Steps:');
  if (working.length > 0) {
    console.log('✅ Update lib/ai-client.ts with the working model ID above');
    console.log('✅ Commit and push the change');
    console.log('✅ Your production server will use Claude Sonnet 4.5\n');
  } else {
    console.log('1. Check AIML API dashboard: https://aimlapi.com/app');
    console.log('2. Verify Claude model access is enabled');
    console.log('3. Check credit balance shows 41M credits');
    console.log('4. Contact AIML support if issue persists\n');
  }
}

main().catch(console.error);
