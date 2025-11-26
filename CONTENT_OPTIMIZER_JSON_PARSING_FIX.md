
# Content Optimizer JSON Parsing Fix

## Problem
The Content Optimizer's product analysis and rewrite endpoints were failing with a JSON parsing error:
```
SyntaxError: Unexpected token '`', "```json { ... is not valid JSON
```

This occurred because the AI model (gpt-4o-mini) was returning JSON wrapped in markdown code blocks:
```json
{
  "overall": 85,
  ...
}
```

But the code was trying to parse it directly with `JSON.parse()`, which expects raw JSON without markdown formatting.

## Solution
Added a `stripMarkdownJson()` helper function to both endpoints that:
1. Removes opening markdown code block markers (````json` or ` ``` `)
2. Removes closing markdown code block markers (` ``` `)
3. Trims whitespace
4. Returns clean JSON that can be safely parsed

## Files Modified

### 1. `/app/api/content-optimizer/analyze-product/route.ts`
**Before:**
```typescript
const analysisText = completion.choices[0]?.message?.content || '{}';
const analysisData = JSON.parse(analysisText);
```

**After:**
```typescript
const analysisText = completion.choices[0]?.message?.content || '{}';
const cleanedText = stripMarkdownJson(analysisText);
const analysisData = JSON.parse(cleanedText);
```

### 2. `/app/api/content-optimizer/rewrite-product/route.ts`
**Before:**
```typescript
const rewriteText = completion.choices[0]?.message?.content || '{}';
const rewriteData = JSON.parse(rewriteText);
```

**After:**
```typescript
const rewriteText = completion.choices[0]?.message?.content || '{}';
const cleanedText = stripMarkdownJson(rewriteText);
const rewriteData = JSON.parse(cleanedText);
```

## Helper Function Implementation
```typescript
// Helper function to strip markdown code blocks from JSON responses
function stripMarkdownJson(text: string): string {
  // Remove ```json and ``` markers
  let cleaned = text.trim();
  
  // Remove opening ```json or ``` 
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/, '');
  
  // Remove closing ```
  cleaned = cleaned.replace(/\s*```$/, '');
  
  return cleaned.trim();
}
```

## Impact
- ✅ Product analysis now works correctly
- ✅ Product rewrite functionality is fixed
- ✅ No more JSON parsing errors in Content Optimizer
- ✅ Handles both markdown-wrapped and raw JSON responses

## Testing
1. Navigate to Content Optimizer in the client portal
2. Select a WooCommerce product
3. Click "Analyseren" - should complete without errors
4. Click "Herschrijven" - should complete without errors
5. Verify the analysis scores and rewritten content are displayed correctly

## Technical Details
- **Root Cause**: AI models often format JSON responses with markdown code blocks for better readability
- **Prevention**: The helper function now handles both markdown-wrapped and raw JSON
- **Robustness**: Uses regex patterns that are case-insensitive and whitespace-tolerant
- **Backward Compatible**: Works with both old (raw JSON) and new (markdown-wrapped) responses

## Related Files
- `/app/api/content-optimizer/analyze-product/route.ts`
- `/app/api/content-optimizer/rewrite-product/route.ts`
- `/app/client-portal/content-optimizer/page.tsx` (UI)

## Deployment Status
✅ **Deployed** - 2025-11-07
- Build: Successful
- Tests: Passed
- Status: Live on WritgoAI.nl

