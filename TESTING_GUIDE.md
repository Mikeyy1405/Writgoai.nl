# Testing Guide - Content Hub Sync & Rewrite Feature

## Overview
This guide provides step-by-step instructions for testing the new Content Hub sync prevention and article rewrite features.

## Prerequisites
- Access to Content Hub
- WordPress site connected
- At least one published article in WordPress

## Test Scenarios

### 1. Test Infinite Sync Loop Prevention ✅

#### Test 1.1: Sync Cooldown
**Goal**: Verify that sync can't be triggered multiple times rapidly

**Steps**:
1. Navigate to Content Hub
2. Click on "Gepubliceerd" tab
3. Wait for initial auto-sync to complete (if any)
4. Click "Sync WordPress" button
5. Immediately click "Sync WordPress" button again (multiple times)

**Expected Result**:
- Toast message appears: "Wacht nog X seconden voor de volgende sync"
- Sync does not execute until cooldown expires
- After 30 seconds, sync can be triggered again

**Pass Criteria**: ✅ Cooldown message appears, no duplicate syncs

---

#### Test 1.2: Filter Change Sync
**Goal**: Verify auto-sync only happens once per filter

**Steps**:
1. Navigate to Content Hub
2. Click "Gepubliceerd" tab (auto-sync should trigger)
3. Wait for sync to complete
4. Click "Alle Artikelen" tab
5. Click "Gepubliceerd" tab again

**Expected Result**:
- First time: Auto-sync triggers (silent)
- Second time: No sync (already synced for this filter)
- Manual "Sync WordPress" button still works

**Pass Criteria**: ✅ Auto-sync only happens once per filter change

---

#### Test 1.3: No Console Spam
**Goal**: Verify no repeated API calls in console

**Steps**:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "sync-existing"
4. Navigate between tabs multiple times
5. Stay on "Gepubliceerd" tab for 1 minute

**Expected Result**:
- Only 1-2 sync-existing calls visible
- No repeated calls every few seconds
- Console shows no errors

**Pass Criteria**: ✅ No infinite API call loop

---

### 2. Test Article Rewrite Functionality ✅

#### Test 2.1: Open Rewrite Modal
**Goal**: Verify rewrite modal opens and starts rewriting

**Steps**:
1. Navigate to "Gepubliceerd" tab
2. Find a published article with content
3. Click the refresh icon (rewrite button) on the article

**Expected Result**:
- Modal opens immediately
- Shows "Artikel herschrijven met AI..."
- Loading spinner appears
- Message: "Dit kan 30-60 seconden duren"

**Pass Criteria**: ✅ Modal opens with loading state

---

#### Test 2.2: View Rewrite Preview
**Goal**: Verify rewritten content is displayed properly

**Steps**:
1. Continue from Test 2.1
2. Wait for rewriting to complete (30-60 seconds)

**Expected Result**:
- Green "Verbeteringen" card appears with summary
- Word count comparison shows original vs rewritten
- Two tabs appear: "Herschreven Versie" and "Origineel"
- Meta title and description are shown
- Content is displayed with proper HTML formatting
- No script tags or dangerous content visible

**Pass Criteria**: ✅ Preview shows complete rewritten article

---

#### Test 2.3: Compare Versions
**Goal**: Verify side-by-side comparison works

**Steps**:
1. Continue from Test 2.2
2. Click "Origineel" tab
3. Click back to "Herschreven Versie" tab
4. Compare content, meta info, word counts

**Expected Result**:
- Original tab shows original content and meta
- Rewritten tab shows improved content and meta
- Word counts are approximately the same (±10%)
- Improvements summary explains changes

**Pass Criteria**: ✅ Both versions display correctly

---

#### Test 2.4: Accept Rewrite
**Goal**: Verify rewritten article is saved

**Steps**:
1. Continue from Test 2.3
2. Click "Accepteren & Opslaan" button
3. Wait for save to complete

**Expected Result**:
- Button shows "Opslaan..." with spinner
- Toast message: "Artikel herschreven en gepubliceerd naar WordPress!"
- Modal closes
- Article in list refreshes
- If has WordPress URL: publishes to WordPress

**Pass Criteria**: ✅ Article is saved successfully

---

#### Test 2.5: Error Handling
**Goal**: Verify error states work properly

**Steps**:
1. Find an article without content
2. Click rewrite button

**Expected Result**:
- Shows error message clearly
- "Probeer opnieuw" button appears
- Can retry or close modal
- No crashes or blank screens

**Pass Criteria**: ✅ Errors are handled gracefully

---

### 3. Test Edge Cases ✅

#### Test 3.1: Network Interruption
**Goal**: Test behavior when network fails

**Steps**:
1. Start a rewrite
2. Disconnect network during rewriting
3. Wait for timeout

**Expected Result**:
- Error message appears after timeout
- User can retry
- No data corruption

**Pass Criteria**: ✅ Network errors handled

---

#### Test 3.2: Multiple Articles
**Goal**: Test with different article types

**Steps**:
1. Test with short article (~500 words)
2. Test with long article (~2000 words)
3. Test with article containing lists, headings

**Expected Result**:
- All article types rewrite successfully
- Content structure is preserved
- Headings improved (H2, H3)
- Lists formatted properly

**Pass Criteria**: ✅ Works for various content types

---

#### Test 3.3: Concurrent Operations
**Goal**: Test multiple browser tabs

**Steps**:
1. Open Content Hub in two browser tabs
2. Trigger sync in both tabs
3. Try rewriting in both tabs

**Expected Result**:
- Cooldown works across tabs (localStorage)
- No conflicts between tabs
- Both tabs update properly

**Pass Criteria**: ✅ Multi-tab usage works

---

## Visual Testing Checklist

### UI Components
- [ ] Modal is properly styled and responsive
- [ ] Loading states are clear
- [ ] Buttons are properly labeled
- [ ] Tabs work smoothly
- [ ] Word count cards display correctly
- [ ] Green "Verbeteringen" card is visible
- [ ] HTML content renders properly (no raw HTML visible)
- [ ] Toast messages appear and disappear
- [ ] Icons are visible and appropriate

### Responsive Design
- [ ] Works on desktop (1920x1080)
- [ ] Works on laptop (1366x768)
- [ ] Works on tablet (768x1024)
- [ ] Modal scrolls when content is long
- [ ] Tabs work on mobile view

## Performance Testing

### Load Times
- [ ] Modal opens quickly (< 500ms)
- [ ] Rewrite completes in 30-60 seconds
- [ ] Preview renders immediately after completion
- [ ] Accept/save completes in < 5 seconds

### Resource Usage
- [ ] No memory leaks (DevTools Memory profiler)
- [ ] No excessive API calls
- [ ] Images load efficiently
- [ ] Smooth scrolling in modal

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Test Data Requirements

### Minimum Setup
- 1 WordPress site connected
- 3-5 published articles with content
- At least one long article (1500+ words)

### Ideal Setup
- 1 WordPress site connected
- 10+ published articles
- Mix of short and long articles
- Articles with various HTML structures
- Some with images, lists, tables

## Known Limitations

1. **Cooldown**: 30 seconds between syncs (by design)
2. **Rewrite Time**: 30-60 seconds depending on article length
3. **Content Source**: Only works with published articles that have content
4. **Language**: Optimized for Dutch articles

## Troubleshooting

### Sync Not Working
- Check WordPress credentials
- Verify WordPress REST API is accessible
- Check browser console for errors
- Wait for cooldown to expire

### Rewrite Fails
- Verify article has content
- Check API keys are configured
- Check browser console for errors
- Try with a different article

### Modal Not Opening
- Hard refresh page (Ctrl+Shift+R)
- Check browser console for errors
- Verify JavaScript is enabled

## Success Criteria

### Must Pass
✅ No infinite sync loops
✅ Cooldown prevents excessive syncs
✅ Rewrite modal opens and functions
✅ Rewritten content is displayed
✅ Accept button saves article
✅ No JavaScript errors in console
✅ No security vulnerabilities

### Should Pass
✅ Preview is clear and readable
✅ Word count is accurate
✅ Improvements summary is helpful
✅ Error messages are clear
✅ Performance is acceptable

### Nice to Have
- Fast load times (< 30 seconds for rewrite)
- Smooth animations
- Mobile-friendly
- Keyboard shortcuts work

## Reporting Issues

When reporting bugs, include:
1. Browser and version
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots/videos
5. Console errors (if any)
6. Network tab output (if sync issue)

## Sign-off

After completing all tests, document results:

**Date**: _______
**Tester**: _______
**Environment**: _______
**Overall Status**: [ ] PASS [ ] FAIL
**Critical Issues**: _______
**Notes**: _______
