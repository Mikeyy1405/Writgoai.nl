# Content Hub - Deployment Checklist

## Pre-Deployment Checklist

### ⚠️ CRITICAL: Database Migration (MUST DO FIRST)

Before deploying the code changes, the database migration **MUST** be applied:

```bash
cd nextjs_space
npx prisma migrate deploy
```

**Verify the migration was successful:**
```bash
npx prisma migrate status
```

Expected output should show all migrations as "Applied".

### Why This Migration is Critical

The application will **crash** during article generation without this migration because the code tries to update a `contentId` column that doesn't exist in the database. This is a blocking issue.

---

## Deployment Steps

### Step 1: Apply Database Migration ⚠️

```bash
# Navigate to the nextjs_space directory
cd nextjs_space

# Apply all pending migrations
npx prisma migrate deploy

# Verify migration status
npx prisma migrate status
```

**Expected Result:** No pending migrations, all marked as "Applied"

### Step 2: Deploy Code Changes

Once the migration is successfully applied, deploy the code changes:

```bash
# Build the application (if needed)
npm run build

# Deploy to production
# (use your deployment process - Vercel, Render, etc.)
```

### Step 3: Verify Deployment

After deployment, test the following:

1. **Delete Functionality**
   - Go to Content Hub
   - Click delete button (trash icon) on any article
   - Confirm deletion works
   - Verify article counts update correctly

2. **Edit Functionality**
   - Find a pending article
   - Click edit button (pencil icon)
   - Modify title and keywords
   - Save changes
   - Verify changes are reflected

3. **Progress UI**
   - Generate a new article
   - Watch the progress modal
   - Verify all 4 phases show correctly
   - Verify duration tracking works
   - Verify completion message shows

4. **Article Generation**
   - Generate at least one article end-to-end
   - Verify no crashes occur
   - Verify article appears in Content Library
   - Verify contentId is linked correctly

---

## Rollback Plan

If issues occur, here's how to rollback:

### Rollback Code Changes

```bash
# Revert to previous deployment
git revert <commit-hash>
# Or restore previous version from your deployment platform
```

### Rollback Database Migration

```bash
# Connect to your database
psql $DATABASE_URL

# Remove the contentId column (if needed)
ALTER TABLE "ContentHubArticle" DROP COLUMN IF EXISTS "contentId";
```

**Note:** Only rollback the database if you also rollback the code. The code expects this column to exist (but handles it gracefully if it doesn't).

---

## Monitoring

After deployment, monitor for:

1. **Error Logs**
   - Search for "contentId" errors
   - Search for "content-hub" errors
   - Check for memory leak warnings

2. **User Feedback**
   - Article generation success rate
   - Delete operation success rate
   - Edit operation success rate

3. **Database Performance**
   - Check query performance on ContentHubArticle table
   - Check transaction performance for delete operations

---

## Success Criteria

✅ Database migration applied successfully
✅ No errors in application logs
✅ Users can delete articles
✅ Users can edit pending articles
✅ Progress UI shows correctly during generation
✅ Articles generate without crashes
✅ ContentId is linked to Content Library

---

## Common Issues and Solutions

### Issue: "Column contentId does not exist"

**Cause:** Migration not applied
**Solution:** Run `npx prisma migrate deploy`

### Issue: Delete button not visible

**Cause:** Article is being generated
**Solution:** This is expected behavior. Delete is disabled during generation.

### Issue: Edit button not visible

**Cause:** Article is not in "pending" status
**Solution:** This is expected behavior. Only pending articles can be edited.

### Issue: Progress stuck at a phase

**Cause:** API request failed
**Solution:** Check server logs for errors. The UI will show error state.

### Issue: "Only pending articles can be edited" error

**Cause:** User tried to edit a non-pending article
**Solution:** This is expected behavior. Only pending articles can be edited.

---

## Support

For issues:
1. Check MIGRATION_INSTRUCTIONS.md
2. Check CONTENT_HUB_TESTING_GUIDE.md
3. Check server logs for errors
4. Check browser console for client-side errors
5. Verify database migration status

---

## Additional Notes

- All changes are additive - no breaking changes
- Existing functionality remains unchanged
- Migration is non-destructive (adds column, doesn't remove)
- All operations include proper error handling
- Memory leaks have been prevented with proper cleanup
- Data consistency ensured with database transactions

---

## Contacts

For deployment support:
- See PR description for detailed technical information
- See CONTENT_HUB_CHANGES_SUMMARY.md for comprehensive overview
- See CONTENT_HUB_TESTING_GUIDE.md for testing procedures
