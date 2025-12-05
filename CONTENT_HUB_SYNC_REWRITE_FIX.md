# Content Hub Sync & Rewrite Fix - Implementation Summary

## Problem
De sync functie voor bestaande WordPress pagina's bleef continu refreshen in een infinite loop. Gebruikers konden hun bestaande pagina's niet zien en niet herschrijven.

## Solution Implemented

### 1. Fixed Infinite Sync Loop ✅

#### Changes in `topical-map-view.tsx`:
- Added `useRef` for `isSyncingRef` to track sync state independently from React state
- Added `useRef` for `hasSyncedForFilterRef` to track which filters have already been synced
- Implemented 30-second cooldown using localStorage (`content-hub-last-sync-${siteId}`)
- Added checks to prevent multiple simultaneous syncs:
  ```typescript
  if (syncing || isSyncingRef.current) return;
  ```
- Modified useEffect for auto-sync to only trigger once per filter change:
  ```typescript
  if (!hasSyncedForFilterRef.current.has(syncKey)) {
    hasSyncedForFilterRef.current.add(syncKey);
    syncExistingContent(true);
  }
  ```
- Removed `syncExistingContent` from useEffect dependencies to prevent loops

#### Changes in `page.tsx`:
- Added `useRef` for `isSyncingRef` to prevent duplicate syncs
- Implemented same 30-second cooldown mechanism
- Added cooldown feedback to user showing remaining seconds

### 2. Enhanced Rewrite Functionality ✅

#### Created `rewrite-modal.tsx`:
- New modal component with preview functionality
- Shows side-by-side comparison of original vs rewritten content
- Displays improvements summary
- Shows word count comparison
- Tabbed interface for viewing original and rewritten versions
- Auto-starts rewriting when modal opens
- Allows accepting and saving the rewritten article

#### Updated `rewrite-article/route.ts`:
- Completely rewrote API to use Claude 4.5 Sonnet (`claude-sonnet-4-5-20250514`)
- Added comprehensive rewrite prompt in Dutch:
  - Behoud kernboodschap en informatie
  - Verbeter leesbaarheid en structuur
  - Optimaliseer voor SEO met betere koppen (H2, H3)
  - Maak tekst engaging en waardevol
  - Voeg bullet points en lijsten toe waar nodig
  - Zorg voor sterke introductie en conclusie
  - Behoud oorspronkelijke lengte (±10%)
- Added `previewOnly` mode for showing rewritten content before saving
- Returns structured JSON with:
  - Rewritten content
  - Improved meta title
  - Improved meta description
  - Summary of improvements
- Maintains WordPress URL if requested for updating in place

#### Updated `article-row.tsx`:
- Integrated new `RewriteModal` component
- Changed rewrite button to only show for published articles
- Removed old inline rewrite logic
- Shows modal instead of immediate API call

### 3. Technical Details

#### Cooldown Mechanism:
```typescript
const SYNC_COOLDOWN_MS = 30000; // 30 seconds
const lastSyncKey = `content-hub-last-sync-${siteId}`;
const lastSyncTime = localStorage.getItem(lastSyncKey);

if (lastSyncTime) {
  const timeSinceLastSync = Date.now() - parseInt(lastSyncTime, 10);
  if (timeSinceLastSync < SYNC_COOLDOWN_MS) {
    // Show remaining seconds to user
    return;
  }
}

// After successful sync:
localStorage.setItem(lastSyncKey, Date.now().toString());
```

#### Claude 4.5 Sonnet Rewrite:
```typescript
const response = await sendChatCompletion({
  model: 'claude-sonnet-4-5-20250514',
  messages: [
    {
      role: 'system',
      content: 'Je bent een expert SEO copywriter...',
    },
    {
      role: 'user',
      content: rewritePrompt,
    },
  ],
  temperature: 0.7,
  maxTokens: 8000,
});
```

## Benefits

### For Users:
1. **No More Infinite Loops**: Sync only happens when explicitly requested or once per filter change
2. **Better UX**: Clear feedback on sync cooldown with remaining seconds
3. **Rewrite Preview**: See improvements before accepting
4. **Side-by-Side Comparison**: Compare original vs rewritten content
5. **Transparency**: See what improvements were made

### For Performance:
1. **Reduced API Calls**: 30-second cooldown prevents excessive syncs
2. **Efficient State Management**: Using refs prevents unnecessary re-renders
3. **Debounced Syncs**: Only sync once per filter change

### For SEO:
1. **Claude 4.5 Sonnet**: Best-in-class AI for content improvement
2. **SEO Optimization**: Improved headings, structure, and readability
3. **Length Preservation**: Maintains approximately same word count
4. **Meta Improvements**: Better titles and descriptions

## Files Modified

1. `/nextjs_space/app/client-portal/content-hub/components/topical-map-view.tsx`
   - Added sync prevention logic
   - Added cooldown mechanism
   - Fixed useEffect dependencies

2. `/nextjs_space/app/client-portal/content-hub/page.tsx`
   - Added sync prevention logic
   - Added cooldown mechanism

3. `/nextjs_space/app/api/content-hub/rewrite-article/route.ts`
   - Complete rewrite to use Claude 4.5 Sonnet
   - Added preview mode
   - Improved error handling

4. `/nextjs_space/app/client-portal/content-hub/components/article-row.tsx`
   - Integrated RewriteModal
   - Simplified rewrite button logic

## Files Created

1. `/nextjs_space/app/client-portal/content-hub/components/rewrite-modal.tsx`
   - New modal component for article rewriting
   - Preview and comparison functionality
   - Word count analysis

## Testing Recommendations

1. **Test Sync Cooldown**:
   - Navigate to "Gepubliceerd" tab
   - Click sync button multiple times rapidly
   - Verify cooldown message appears
   - Wait 30 seconds and verify sync works again

2. **Test Rewrite Functionality**:
   - Find a published article
   - Click the refresh icon (rewrite button)
   - Verify modal opens and starts rewriting
   - Check preview shows original vs rewritten
   - Accept rewrite and verify article is updated

3. **Test No Infinite Loop**:
   - Navigate between tabs multiple times
   - Verify sync doesn't keep triggering
   - Check browser console for no repeated API calls

## Future Enhancements

1. **Batch Rewriting**: Allow rewriting multiple articles at once
2. **Rewrite History**: Keep track of previous versions
3. **Custom Prompts**: Allow users to specify rewrite instructions
4. **A/B Testing**: Compare original vs rewritten article performance
5. **Scheduled Rewrites**: Automatically rewrite old articles periodically
