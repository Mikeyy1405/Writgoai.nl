# AIML API Credit Error Fix

## Problem

Your application is showing this error:
```
Your credit balance is too low to access the Anthropic API.
Please go to Plans & Billing to upgrade or purchase credits.
```

## Root Cause

**Your code is correctly configured!** The error is misleading. Here's what's actually happening:

1. ✅ Your code is using AIML API (not Anthropic directly)
2. ✅ Your code uses the correct base URL: `https://api.aimlapi.com/v1`
3. ✅ Your code uses the correct model: `anthropic/claude-sonnet-4.5`
4. ❌ **Your AIML API account has insufficient credits**

When you use Claude models through AIML API but don't have enough credits, AIML API returns this error message.

## Solution

### Step 1: Verify AIML API Key is Set on Render

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your web service
3. Go to **Environment** tab
4. Verify that `AIML_API_KEY` is set with your AIML API key
5. If not set, add it:
   ```
   Key: AIML_API_KEY
   Value: [your AIML API key from aimlapi.com]
   ```

### Step 2: Add Credits to AIML API Account

1. Go to AIML API dashboard: https://aimlapi.com/app
2. Navigate to **Billing** or **Credits** section
3. Purchase credits for your account
4. Ensure you have sufficient credits for Claude Sonnet 4.5 model

### Step 3: Test Your Configuration (Optional)

Run this script locally to verify your setup:

```bash
npx tsx scripts/check-aiml-credits.ts
```

Or test directly:

```bash
curl -X POST https://api.aimlapi.com/v1/chat/completions \
  -H "Authorization: Bearer $AIML_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4.5",
    "messages": [{"role": "user", "content": "test"}],
    "max_tokens": 10
  }'
```

### Step 4: Trigger Render Rebuild (if needed)

If you made any environment variable changes on Render:

1. Go to your Render dashboard
2. Click **Manual Deploy** → **Deploy latest commit**
3. Wait for the build to complete

## Verification

After adding credits, check your production logs. You should see:

✅ **Working:**
```
AIML response: {"data":[...], "meta":{"usage":{"credits_used":6300}}}
```

❌ **Not working:**
```
Your credit balance is too low to access the Anthropic API
```

## Cost Information

According to AIML API documentation:
- Claude Sonnet 4.5: Check current pricing at https://docs.aimlapi.com/pricing
- Image generation (Flux): ~6,300 credits per image (as seen in your logs)

## Files Using AIML API

Your application correctly uses AIML API in these files:
- `/lib/ai-client.ts` - Main AI client (OpenAI SDK pointing to AIML API)
- `/lib/aiml-image-generator.ts` - Image generation via AIML API
- `/lib/aiml-api-client.ts` - Video/voice generation via AIML API

## Alternative: Use a Different Model

If you want to reduce costs while testing, you can temporarily switch to a cheaper model in `/lib/ai-client.ts`:

```typescript
// Lower cost option
export const BEST_MODELS = {
  CONTENT: 'gpt-4o-mini',      // Cheaper alternative
  // ... or stick with Claude if you have credits
}
```

## Support

- AIML API Documentation: https://docs.aimlapi.com
- AIML API Pricing: https://docs.aimlapi.com/pricing
- AIML API Support: https://aimlapi.com/support
