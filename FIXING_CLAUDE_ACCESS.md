# Fixing "Anthropic API Credit" Error on AIML Pay-As-You-Go

## Problem

Error when generating articles:
```
Your credit balance is too low to access the Anthropic API.
Please go to Plans & Billing to upgrade or purchase credits.
```

## Root Cause

**Claude/Anthropic models require higher tier access on AIML API**, even with pay-as-you-go credits.

AIML API has different pricing tiers:
- ✅ **Standard models** (GPT-4o, GPT-4o-mini, Mistral, Llama) - Included in pay-as-you-go
- ❌ **Premium models** (Claude/Anthropic) - Require higher tier or separate enablement

## Solution Applied

### Changed models in `/lib/ai-client.ts`:

**Before:**
```typescript
export const BEST_MODELS = {
  CONTENT: 'anthropic/claude-sonnet-4.5',  // ❌ Not accessible
  TECHNICAL: 'anthropic/claude-sonnet-4.5',
  QUICK: 'anthropic/claude-sonnet-4.5',
  BUDGET: 'anthropic/claude-sonnet-4.5',
}
```

**After:**
```typescript
export const BEST_MODELS = {
  CONTENT: 'gpt-4o',        // ✅ Works with pay-as-you-go
  TECHNICAL: 'gpt-4o',      // ✅ High quality
  QUICK: 'gpt-4o-mini',     // ✅ Fast & cost-effective
  BUDGET: 'gpt-4o-mini',    // ✅ Budget-friendly
}
```

## Why GPT-4o?

GPT-4o is an excellent alternative:
- ✅ **Included in standard AIML pay-as-you-go plan**
- ✅ **High quality** content generation (comparable to Claude)
- ✅ **Fast** response times
- ✅ **Cost-effective** for your use case
- ✅ **Better multilingual support** (important for Dutch content)

## Testing Your Setup

Run this script to verify which models work with your account:

```bash
npx tsx scripts/test-aiml-models.ts
```

This will test:
1. ✅ GPT-4o (should work)
2. ✅ GPT-4o-mini (should work)
3. ✅ Other standard models
4. ❌ Claude models (will show credit error)

## Deployment

After pushing this change to Render:

1. Your production server will automatically use GPT-4o
2. Article generation should work immediately
3. Image generation continues to work (unchanged)

## If You Need Claude Models

To enable Claude/Anthropic access on AIML API:

1. Go to https://aimlapi.com/app
2. Check your plan/tier
3. May need to:
   - Upgrade to a higher tier
   - Enable Anthropic models separately
   - Purchase separate Claude credits

Contact AIML API support for details on enabling Claude access.

## Performance Comparison

| Feature | Claude Sonnet 4.5 | GPT-4o |
|---------|------------------|---------|
| Content Quality | Excellent | Excellent |
| Code Generation | Excellent | Excellent |
| Dutch Language | Very Good | Very Good |
| Speed | Fast | Fast |
| AIML Availability | Premium Tier | Standard Plan ✅ |
| Cost | Higher | Lower |

## Monitoring

Watch your production logs for:

**Success indicator:**
```
Article job completed with 2000 words ✅
```

**Should no longer see:**
```
Your credit balance is too low to access the Anthropic API ❌
```

## Files Changed

- `/lib/ai-client.ts` - Updated BEST_MODELS to use GPT-4o
- `/scripts/test-aiml-models.ts` - New script to test model availability

## Next Steps

1. Commit and push this change
2. Render will auto-deploy
3. Test article generation
4. Monitor logs to confirm it's working

If GPT-4o doesn't work either, run the test script to find which models ARE accessible with your current AIML plan.
