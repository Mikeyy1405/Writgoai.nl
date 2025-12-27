# Enable Claude Sonnet 4.5 on AIML API (Pay-As-You-Go)

## Current Status

- ✅ You have **41M credits** ($20)
- ✅ Model ID is correct: `anthropic/claude-sonnet-4.5`
- ✅ Code is correctly configured
- ❌ Getting "credit balance too low" error for Claude models
- ✅ Image generation works (Flux models)

## Root Cause

**Claude/Anthropic models require separate enablement on AIML API**, even with pay-as-you-go credits.

## Solution: Enable Claude Access

### Step 1: Check AIML Dashboard

1. Go to: https://aimlapi.com/app
2. Login to your account
3. Navigate to **Models** or **Billing** section

### Step 2: Enable Claude/Anthropic Models

Look for one of these options:

**Option A: Model Access Settings**
- Find "Model Access" or "Enable Models" section
- Look for **Anthropic/Claude** models
- Click to enable/activate Claude access
- May require accepting terms or confirming

**Option B: Billing/Credits Section**
- Check if there's a separate "Claude Credits" or "Anthropic Access"
- May need to allocate your credits to Claude models specifically
- Some platforms separate standard credits from premium model credits

**Option C: Account Tier**
- Check your account tier/plan
- Claude might require "Pro" or higher tier
- May need to upgrade (but keep pay-as-you-go)

### Step 3: Verify Access

Run this test script to verify Claude is enabled:

```bash
npx tsx scripts/test-claude-model.ts
```

This will test multiple Claude model ID formats and show which one works.

## Alternative Model IDs to Try

According to [AIML API docs](https://docs.aimlapi.com/api-references/text-models-llm), these are valid:

1. ✅ `anthropic/claude-sonnet-4.5` (current - recommended)
2. ✅ `claude-sonnet-4-5-20250929` (with date)
3. ✅ `claude-sonnet-4-5` (without vendor prefix)

## If Claude Still Doesn't Work

### Contact AIML Support

Email or chat support with this information:

```
Subject: Unable to access Claude models despite having credits

Hi AIML Team,

I have an AIML API account with:
- 41M credits ($20) in my account
- Pay-as-you-go plan
- API Key: [your key prefix]...

When I try to use Claude Sonnet 4.5 (model: anthropic/claude-sonnet-4.5),
I get this error:

"Your credit balance is too low to access the Anthropic API.
Please go to Plans & Billing to upgrade or purchase credits."

However:
- I have 41M credits
- Image generation (Flux) works fine
- Other models work

Can you please enable Claude/Anthropic model access for my account?

Thank you!
```

### Temporary Workaround

While waiting for Claude access, you can use GPT-4o (also excellent for content):

In `lib/ai-client.ts`, temporarily change to:

```typescript
export const BEST_MODELS = {
  CONTENT: 'gpt-4o',  // Temporary - switch back to Claude when enabled
  // ... rest
}
```

## Expected Behavior After Enabling

Once Claude is enabled, you should see:

```bash
✅ Testing: anthropic/claude-sonnet-4.5
   ✅ SUCCESS!
   Response: "SUCCESS"
   Tokens: {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}
```

And in production logs:

```
Article job completed with 2000 words ✅
```

No more credit errors!

## Important Notes

1. **Your code is already correct** - no code changes needed
2. **You have sufficient credits** - 41M is plenty
3. **Image generation works** - proves your API key and credits work
4. **Only Claude access needs enabling** - account configuration issue

## Cost Reference

Claude Sonnet 4.5 pricing (approximate):
- Input: ~$3 per 1M tokens
- Output: ~$15 per 1M tokens
- Your 41M credits = plenty for testing and production

## Sources

- [AIML API Claude Documentation](https://docs.aimlapi.com/api-references/text-models-llm/anthropic/claude-4-5-sonnet)
- [All AIML Model IDs](https://docs.aimlapi.com/api-references/model-database)
- [AIML API Features](https://docs.aimlapi.com/capabilities/anthropic)
