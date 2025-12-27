#!/usr/bin/env tsx
/**
 * Check AIML API credit balance and account status
 * Run with: npx tsx scripts/check-credit-balance.ts
 */

import 'dotenv/config';

const AIML_API_KEY = process.env.AIML_API_KEY;
const AIML_API_URL = 'https://api.aimlapi.com';

async function checkCredits() {
  console.log('🔍 Checking AIML API Credit Balance\n');
  console.log('=' .repeat(70));

  if (!AIML_API_KEY) {
    console.error('\n❌ AIML_API_KEY is not set!');
    process.exit(1);
  }

  console.log(`\n✅ API Key: ${AIML_API_KEY.substring(0, 10)}...${AIML_API_KEY.substring(AIML_API_KEY.length - 4)}`);
  console.log(`✅ Base URL: ${AIML_API_URL}\n`);

  // Try different account/balance endpoints
  const endpoints = [
    '/v1/account',
    '/v1/balance',
    '/account',
    '/balance',
    '/v1/credits',
    '/credits',
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📊 Trying: ${AIML_API_URL}${endpoint}`);
    try {
      const response = await fetch(`${AIML_API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${AIML_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ SUCCESS!');
        console.log('   Response:', JSON.stringify(data, null, 2));
        console.log('\n' + '='.repeat(70));
        console.log('💰 CREDIT BALANCE FOUND!\n');

        // Try to extract credit info
        if (data.credits !== undefined) {
          console.log(`   Total Credits: ${data.credits}`);
        }
        if (data.balance !== undefined) {
          console.log(`   Balance: ${data.balance}`);
        }
        if (data.remaining_credits !== undefined) {
          console.log(`   Remaining: ${data.remaining_credits}`);
        }

        return data;
      } else {
        console.log(`   ❌ Failed (${response.status})`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText.substring(0, 100)}`);
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('⚠️  Could not find credit balance endpoint\n');
  console.log('Trying a test API call to see the actual error...\n');

  // Try actual Claude API call to see error
  try {
    const response = await fetch(`${AIML_API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ Claude API Error:');
      console.log(JSON.stringify(errorData, null, 2));

      if (errorData.error?.message) {
        console.log('\n📝 Error Message:');
        console.log(`   "${errorData.error.message}"`);

        if (errorData.error.message.includes('credit') || errorData.error.message.includes('balance')) {
          console.log('\n💡 SOLUTION:');
          console.log('   1. Go to: https://aimlapi.com/app/billing');
          console.log('   2. Check your credit balance');
          console.log('   3. Add more credits if needed');
          console.log('   4. Credits for Claude may be separate from image credits\n');
        }
      }
    } else {
      const data = await response.json();
      console.log('✅ Claude API works! Response:', data.choices[0]?.message?.content);
    }
  } catch (error: any) {
    console.error('Error testing Claude:', error.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log('📍 Next Steps:\n');
  console.log('1. Go to https://aimlapi.com/app');
  console.log('2. Check "Billing" or "Credits" section');
  console.log('3. Look for:');
  console.log('   - Total credits remaining');
  console.log('   - Separate pools (Anthropic vs General)');
  console.log('   - Usage history (last 2 hours)');
  console.log('4. If credits low, add more');
  console.log('5. If credits high but still failing, contact support\n');
}

checkCredits().catch(console.error);
