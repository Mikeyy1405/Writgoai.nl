# Fix for Article RLS Error from Bibliotheek

## Problem
When trying to update an article from the Bibliotheek (library) page, users were getting this error:

```
message: 'new row violates row-level security policy for table "articles"'
```

This happened specifically when publishing an article to the WritGo blog, which sets `project_id: null`.

## Root Cause
1. **Incorrect RLS Policy**: The existing RLS policy used `auth.role() = 'authenticated'` which doesn't work correctly in Supabase
2. **Missing user_id**: When updating articles with `project_id: null` (WritGo blog articles), the `user_id` field wasn't being set
3. **Policy Mismatch**: The RLS policy checked for project ownership but didn't handle articles without a project

## Solution

### 1. SQL Migration (`fix_articles_rls_final.sql`)
This migration does the following:
- Drops all existing incorrect RLS policies
- Ensures the `user_id` column exists on the articles table
- Creates proper RLS policies that handle BOTH cases:
  - Articles with a project (checks project ownership via `project_id`)
  - Articles without a project (checks direct ownership via `user_id`)
- Updates existing articles to set `user_id` from their project

**To apply this fix, run this SQL in Supabase SQL Editor:**
```bash
# Copy the contents of fix_articles_rls_final.sql and run in Supabase
```

### 2. API Route Update (`app/api/articles/update/route.ts`)
Updated the article update endpoint to:
- Always set `user_id` when creating new articles (line 150)
- Set `user_id` when setting `project_id` to null for WritGo blog articles (lines 85-87)

This ensures all articles have proper ownership information for RLS checks.

## How It Works

The new RLS policies support two types of article ownership:

### Type 1: Project-based Articles
Articles with a `project_id` belong to whoever owns that project:
```sql
EXISTS (
  SELECT 1 FROM projects
  WHERE projects.id = articles.project_id
  AND projects.user_id = auth.uid()
)
```

### Type 2: User-owned Articles (WritGo Blog)
Articles without a `project_id` (NULL) belong directly to a user:
```sql
user_id = auth.uid()
```

Both checks are combined with OR, so an article can be accessed if EITHER condition is true.

## Testing
After applying the SQL migration, test by:
1. Going to Dashboard → Bibliotheek
2. Select an article
3. Click "🚀 WritGo" to publish to WritGo blog
4. The article should update successfully without RLS errors

## Files Changed
- `fix_articles_rls_final.sql` - New SQL migration to fix RLS policies
- `app/api/articles/update/route.ts` - Updated to set `user_id` properly
- `FIX_ARTICLE_RLS_README.md` - This documentation

## Next Steps
1. Apply the SQL migration in Supabase SQL Editor
2. Test article publishing from bibliotheek
3. Monitor logs to confirm no more RLS errors
