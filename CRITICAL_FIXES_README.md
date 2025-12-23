# Database & API Critical Fixes - Implementation Guide

## Overview

This PR fixes critical database schema errors, API endpoint issues, missing pages, and adds content plan item deletion functionality as described in the issue.

## Changes Made

### 1. Database Migration SQL File ✅
**File:** `supabase_critical_fixes_migration.sql`

This migration file contains all necessary database fixes:

- ✅ Adds `word_count` column to `articles` table
- ✅ Adds `project_id` column to `articles` table with foreign key to `projects`
- ✅ Creates `content_plan_jobs` table with 'cancelled' status support
- ✅ Creates `content_plans` table for saved content plans
- ✅ Creates `article_jobs` table for background article generation
- ✅ Adds missing columns to `articles` (slug, excerpt, meta fields, featured_image, views, author_id)
- ✅ Adds `description` and `wp_app_password` columns to `projects` table
- ✅ Includes proper indexes for performance
- ✅ Includes Row Level Security (RLS) policies for all new tables
- ✅ Includes verification queries at the end

### 2. API Endpoint Fixes ✅
**File:** `app/api/simple/generate-content-plan-background/route.ts`

#### GET Endpoint Fix
- **Issue:** Used `.not('status', 'eq', 'cancelled')` which caused errors
- **Fix:** Changed to `.neq('status', 'cancelled')` and `.neq('status', 'failed')`
- **Impact:** GET requests with `projectId` parameter now work correctly

#### DELETE Endpoint Fix
- **Issue:** Did not return updated data, causing 404 errors
- **Fix:** Added `.select()` to return updated data and improved error handling
- **Impact:** DELETE requests now return proper response with job data

### 3. Missing Pages Added ✅

#### `/app/pricing/page.tsx`
- Simple placeholder page for pricing information
- Returns 200 instead of 404

#### `/app/features/page.tsx`
- Simple placeholder page for features overview
- Returns 200 instead of 404

#### `/app/dashboard/writgo-autopilot/page.tsx`
- Client-side rendered page with "In Development" message
- Returns 200 instead of 404

### 4. Content Plan Delete Functionality ✅
**File:** `app/dashboard/content-plan/page.tsx`

- ✅ Added `deleteContentPlanItem()` function with confirmation dialog
- ✅ Added delete button (🗑️) next to "Schrijven" button in UI
- ✅ Integrated with database save to persist deletions
- ✅ Proper error handling

## Testing Performed

- ✅ TypeScript compilation successful (`npx tsc --noEmit`)
- ✅ No syntax errors in modified files
- ✅ All new pages follow Next.js App Router conventions
- ✅ Delete functionality follows existing patterns in codebase

## Deployment Instructions

### Step 1: Run Database Migration in Supabase

1. Go to https://supabase.com/dashboard
2. Select your project (e.g., `utursgxvfhhfheeoewfn`)
3. Click on **SQL Editor** in the sidebar
4. Click on **New query**
5. Copy the contents of `supabase_critical_fixes_migration.sql`
6. Paste into the SQL editor
7. Click **Run**
8. Verify no errors appear

### Step 2: Verify Migration Success

Run these verification queries in the SQL Editor:

```sql
-- Check all required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('articles', 'projects', 'content_plan_jobs', 'content_plans', 'article_jobs')
ORDER BY table_name;

-- Check articles has word_count column
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'articles' 
AND column_name IN ('word_count', 'project_id');

-- Check content_plan_jobs status constraint (should include 'cancelled')
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%content_plan_jobs_status%';
```

Expected results:
- 5 tables should exist: `article_jobs`, `articles`, `content_plan_jobs`, `content_plans`, `projects`
- `articles` table should have both `word_count` and `project_id` columns
- `content_plan_jobs` status constraint should include: `'pending'`, `'processing'`, `'completed'`, `'failed'`, `'cancelled'`

### Step 3: Deploy Code Changes

After the PR is merged:

1. Deploy to production environment
2. Verify the following endpoints return 200:
   - `/pricing`
   - `/features`
   - `/dashboard/writgo-autopilot`

### Step 4: Test Functionality

1. **Test Content Plan Generation:**
   - Navigate to `/dashboard/content-plan`
   - Select a project
   - Generate a content plan
   - Verify no database errors appear

2. **Test Delete Functionality:**
   - Open a content plan
   - Click the 🗑️ button next to any article
   - Confirm the deletion
   - Verify the item is removed from the list

3. **Test Cancel Functionality:**
   - Start generating a content plan
   - Click "Annuleren"
   - Verify the job is cancelled without errors

4. **Test API Endpoints:**
   - Verify GET with `projectId` returns correct data or 404
   - Verify DELETE returns success response with job data

## Expected Impact

✅ **Fixes all critical database schema errors**
- No more "word_count column not found" errors
- No more foreign key violations
- No more check constraint violations for 'cancelled' status

✅ **Fixes all API endpoint errors**
- GET requests with projectId work correctly
- DELETE requests return proper responses
- No more 500 errors on cancel operations

✅ **Fixes all 404 errors**
- `/pricing` returns 200
- `/features` returns 200
- `/dashboard/writgo-autopilot` returns 200

✅ **Adds user-requested functionality**
- Users can delete individual content plan items
- Delete button is visible and functional

## Rollback Plan

If issues occur after deployment:

1. **Database Rollback:**
   ```sql
   -- Only if absolutely necessary, drop new tables:
   DROP TABLE IF EXISTS article_jobs CASCADE;
   DROP TABLE IF EXISTS content_plan_jobs CASCADE;
   DROP TABLE IF EXISTS content_plans CASCADE;
   
   -- Remove new columns from articles:
   ALTER TABLE articles DROP COLUMN IF EXISTS word_count;
   ALTER TABLE articles DROP COLUMN IF EXISTS project_id;
   -- (Add other ALTER TABLE DROP COLUMN commands as needed)
   ```

2. **Code Rollback:**
   - Revert the PR merge
   - Previous functionality will be restored

## Notes

- The migration uses `IF NOT EXISTS` clauses, making it safe to run multiple times
- All new tables have proper RLS policies
- Indexes are added for performance optimization
- The delete functionality asks for user confirmation before deletion

## Security Considerations

- ✅ All new tables have Row Level Security (RLS) enabled
- ✅ Service role policies allow backend operations
- ✅ User policies restrict access to own data
- ✅ No SQL injection vulnerabilities introduced
- ✅ Proper foreign key constraints maintain referential integrity
