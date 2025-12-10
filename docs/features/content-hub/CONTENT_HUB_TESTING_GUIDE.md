# Content Hub - Testing Guide

## Prerequisites
Before testing, ensure the database migration has been applied:
```bash
cd nextjs_space
npx prisma migrate deploy
```

Verify migration status:
```bash
npx prisma migrate status
```

## 1. Testing Delete Functionality

### Test Cases

#### TC1: Delete a Pending Article
1. Navigate to Content Hub
2. Find an article with status "pending"
3. Click the trash icon (🗑️) button
4. Verify delete confirmation modal appears with:
   - Article title displayed
   - Warning message
   - "Annuleren" and "Verwijderen" buttons
5. Click "Verwijderen"
6. Verify:
   - Success toast appears: "Artikel succesvol verwijderd"
   - Article disappears from the list
   - Topical map updates (total articles count decrements)

#### TC2: Delete a Published Article
1. Find an article with status "published"
2. Click the trash icon button
3. Follow same verification steps as TC1
4. Verify both totalArticles AND completedArticles decrement

#### TC3: Cancel Delete Operation
1. Click delete button on any article
2. Click "Annuleren" in the modal
3. Verify:
   - Modal closes
   - Article remains in the list
   - No changes to the data

#### TC4: Delete During Generation (Should be Hidden)
1. Start generating an article
2. While status is "researching", "writing", or "publishing"
3. Verify delete button is NOT visible

### API Testing
Test the DELETE endpoint directly:
```bash
curl -X DELETE http://localhost:3000/api/content-hub/articles/{article-id} \
  -H "Cookie: next-auth.session-token={your-token}"
```

Expected Response:
```json
{
  "success": true,
  "message": "Article deleted successfully"
}
```

## 2. Testing Edit Functionality

### Test Cases

#### TC5: Edit a Pending Article
1. Navigate to Content Hub
2. Find an article with status "pending"
3. Click the pencil icon (✏️) button
4. Verify edit modal opens showing:
   - Current title in text field
   - Current keywords as badges
   - "Annuleren" and "Opslaan" buttons
5. Modify the title
6. Remove a keyword by clicking X on badge
7. Add a new keyword using input field and + button
8. Click "Opslaan"
9. Verify:
   - Success toast: "Artikel succesvol bijgewerkt"
   - Modal closes
   - Article row updates with new title and keywords

#### TC6: Edit Modal - Add Keyword with Enter Key
1. Open edit modal
2. Type a keyword in the input field
3. Press Enter key
4. Verify keyword is added to the list
5. Input field clears

#### TC7: Edit Modal - Validation
Test these scenarios:
- Empty title → "Titel is verplicht" error
- Remove all keywords → "Minimaal één keyword is verplicht" error
- Duplicate keyword → Should not be added twice
- Save button disabled when validation fails

#### TC8: Edit Non-Pending Article (Should Show Warning)
1. Try to edit an article with status "published", "writing", etc.
2. API should return error: "Only pending articles can be edited"

#### TC9: Edit Button Visibility
1. Verify edit button (pencil icon) only appears for articles with status "pending"
2. Verify edit button is NOT shown for:
   - Published articles
   - Articles being generated (researching, writing, publishing)
   - Failed articles

### API Testing
Test the PATCH endpoint:
```bash
curl -X PATCH http://localhost:3000/api/content-hub/articles/{article-id} \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={your-token}" \
  -d '{
    "title": "Updated Article Title",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "Article updated successfully",
  "article": {
    "id": "...",
    "title": "Updated Article Title",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "status": "pending"
  }
}
```

## 3. Testing Improved Progress UI

### Test Cases

#### TC10: Article Generation with Progress Tracking
1. Click "Genereer" on a pending article
2. Verify generation modal shows:
   - All 4 phases: Research & Analysis, Content Generation, SEO & Images, Publishing
   - Overall progress bar starting at 0%
   - All phases initially in "pending" state (gray)
3. Click "Start Generatie"
4. Verify Phase 1 (Research & Analysis):
   - Status changes to "in-progress" with blue background
   - Spinning loader icon appears
   - Message: "Analyzing SERP and gathering sources..."
   - Progress bar animates from 5% to 25%
   - Upon completion: green checkmark, "completed" badge, duration shown
5. Verify Phase 2 (Content Generation):
   - Status changes to "in-progress"
   - Message: "Generating high-quality content with AI..."
   - Progress bar animates from 25% to 60%
   - Upon completion: shows word count (e.g., "Generated 2450 words")
6. Verify Phase 3 (SEO & Images):
   - Status changes to "in-progress"
   - Message varies based on settings
   - Progress bar animates from 60% to 85%
7. Verify Phase 4 (Publishing):
   - If auto-publish enabled: "Publishing to WordPress..."
   - If not: "Content saved to library"
   - Progress reaches 100%
8. Verify completion:
   - Success toast with total duration
   - Modal closes after 1.5 seconds
   - Article list updates

#### TC11: Progress UI - Error Handling
1. Start generation
2. Simulate error (disconnect network, invalid API key, etc.)
3. Verify:
   - Current phase shows red "failed" badge
   - Error message displayed
   - Other phases remain in their previous state
   - Progress stops
   - Error toast appears

#### TC12: Cancel During Generation
1. Start generation
2. Click "Annuleren" while generation is in progress
3. Verify:
   - Toast: "Generatie geannuleerd"
   - Modal closes
   - Article status resets to "pending"
   - No partial content saved

#### TC13: Progress UI - Different Configurations
Test with different settings:
- ✅ Generate Images, ✅ Include FAQ, ✅ Auto-publish
- ✅ Generate Images, ✅ Include FAQ, ❌ Auto-publish
- ❌ Generate Images, ❌ Include FAQ, ❌ Auto-publish

Verify phase messages update accordingly.

## 4. Integration Testing

### Scenario 1: Complete Article Lifecycle
1. Create a new topical map with 5 articles
2. Edit 1 article title and keywords
3. Generate 1 article with all options enabled
4. Verify article appears in Content Library
5. Verify article published to WordPress (if auto-publish enabled)
6. Delete 1 pending article
7. Verify article counts are accurate

### Scenario 2: Batch Operations
1. Generate 3 articles simultaneously
2. Verify progress trackers work independently
3. Delete 2 completed articles
4. Edit 1 pending article
5. Verify all operations complete successfully

## 5. Performance Testing

### Test Cases
- **Concurrent Edits**: Open edit modal for multiple articles simultaneously
- **Rapid Delete**: Delete 10 articles in quick succession
- **Long Article Titles**: Edit article with 200-character title
- **Many Keywords**: Add 20+ keywords to an article
- **Large Topical Maps**: Test with 100+ articles

## 6. Browser Compatibility

Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 7. Regression Testing

Ensure existing functionality still works:
- ✅ Article generation without new features
- ✅ WordPress publishing
- ✅ Topical map generation
- ✅ Content library sync
- ✅ Rewrite functionality

## Known Issues & Limitations

1. **Database Migration Required**: The `contentId` column must be added via migration before the app can link articles to content library.
2. **Edit Restriction**: Only pending articles can be edited (by design).
3. **Delete During Generation**: Articles cannot be deleted while being generated (by design).

## Troubleshooting

### Issue: "Column contentId does not exist"
**Solution**: Run the database migration:
```bash
cd nextjs_space
npx prisma migrate deploy
```

### Issue: Edit button not appearing
**Check**: Is the article status "pending"? Edit is only available for pending articles.

### Issue: Delete confirmation modal not closing
**Check**: Look for JavaScript errors in console. Ensure all UI components are properly imported.

### Issue: Progress stuck at a specific phase
**Check**: 
1. Network tab for failed API requests
2. Server logs for generation errors
3. Database connection issues
