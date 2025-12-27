#!/usr/bin/env tsx
/**
 * Script to check AIML API configuration and credit balance
 * Run with: npx tsx scripts/check-aiml-credits.ts
 */

import 'dotenv/config';

const AIML_API_KEY = process.env.AIML_API_KEY;
const AIML_API_URL = 'https://api.aimlapi.com';

async function checkCredits() {
  console.log('🔍 Checking AIML API Configuration...\n');

  // Check if API key is set
  if (!AIML_API_KEY) {
    console.error('❌ AIML_API_KEY is not set!');
    console.log('\nPlease set your AIML API key in environment variables:');
    console.log('  export AIML_API_KEY=your-api-key-here');
    console.log('\nGet your API key from: https://aimlapi.com');
    process.exit(1);
  }

  console.log('✅ AIML_API_KEY is set');
  console.log(`   Key preview: ${AIML_API_KEY.substring(0, 10)}...${AIML_API_KEY.substring(AIML_API_KEY.length - 4)}\n`);

  // Test 1: Check account/balance endpoint
  console.log('📊 Attempting to check account status...');

  try {
    const response = await fetch(`${AIML_API_URL}/v1/account`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`⚠️  Account endpoint returned ${response.status}`);
      console.log(`   Response: ${errorText}\n`);
    } else {
      const data = await response.json();
      console.log('✅ Account data retrieved:');
      console.log(JSON.stringify(data, null, 2));
      console.log('');
    }
  } catch (error: any) {
    console.log('⚠️  Could not fetch account data:', error.message, '\n');
  }

  // Test 2: Try a minimal API call to see the actual error
  console.log('🧪 Testing Claude API call (minimal)...');

  try {
    const response = await fetch(`${AIML_API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [
          { role: 'user', content: 'Say "test" and nothing else.' }
        ],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API call failed!');
      console.error('   Status:', response.status);
      console.error('   Error:', JSON.stringify(errorData, null, 2));

      if (errorData.error?.message?.includes('credit balance')) {
        console.log('\n💡 SOLUTION:');
        console.log('   Your AIML API account needs more credits.');
        console.log('   1. Go to: https://aimlapi.com/app/billing');
        console.log('   2. Purchase credits');
        console.log('   3. Make sure you have enough for Claude Sonnet 4.5 models\n');
      }
    } else {
      const data = await response.json();
      console.log('✅ API call successful!');
      console.log('   Response:', data.choices[0]?.message?.content);
      console.log('   Your AIML API is working correctly!\n');
    }
  } catch (error: any) {
    console.error('❌ Test failed:', error.message, '\n');
  }

  // Print configuration summary
  console.log('📝 Current Configuration:');
  console.log(`   API Base URL: ${AIML_API_URL}/v1`);
  console.log('   Model: anthropic/claude-sonnet-4.5');
  console.log('   This is the correct configuration for using Claude via AIML API\n');
}

checkCredits().catch(console.error);
