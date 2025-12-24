# 🎬 Video Projects Migration Guide

## Problem
The application is failing to create video projects with this error:
```
Error creating project: {
  code: 'PGRST205',
  details: null,
  hint: "Perhaps you meant the table 'public.projects'",
  message: "Could not find the table 'public.video_projects' in the schema cache"
}
```

## Root Cause
The `video_projects` and `video_scenes` tables don't exist in the Supabase database yet. The migration file exists (`supabase_video_projects_migration.sql`) but hasn't been executed.

## Solution

You have **3 options** to run the migration:

---

### ⭐ Option 1: Supabase SQL Editor (Recommended - Easiest)

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/utursgxvfhhfheeoewfn/sql/new

2. **Open the migration file**
   - In your project: `supabase_video_projects_migration.sql`
   - Copy all the contents (109 lines)

3. **Paste and Run**
   - Paste into the SQL Editor
   - Click the **"Run"** button (or press `Ctrl + Enter`)

4. **Verify**
   - You should see: "Success. No rows returned"
   - Run this to verify: `SELECT COUNT(*) FROM video_projects;`

**Done!** ✅ The tables are now created and the video studio will work.

---

### Option 2: Using Node.js Script (Requires Database Access)

If you have direct network access to the Supabase database:

```bash
# Install dependencies (if not already installed)
npm install

# Run the migration script
node scripts/migrate-video-tables.js
```

The script will:
- Connect to the Supabase database
- Execute all 16 SQL statements
- Create the tables, indexes, and RLS policies
- Display progress and confirmation

---

### Option 3: Check Migration Status via API

After deployment, you can check if migration is needed:

```bash
# Check if tables exist
curl https://your-domain.com/api/admin/migrate-video-tables

# Response will show:
# - Whether tables exist
# - Whether migration is needed
# - Instructions for running migration
```

---

## What Gets Created

The migration creates:

### 1️⃣ **video_projects** table
- Stores multi-scene video projects
- Fields: title, description, aspect_ratio, voice_id, music settings, etc.
- Links to user via `user_id`

### 2️⃣ **video_scenes** table
- Individual scenes within a project
- Fields: prompt, narration_text, style, model, video_url, etc.
- Links to project via `project_id` (CASCADE delete)

### 3️⃣ **Indexes** for performance
- `idx_video_projects_user` - Fast user project lookups
- `idx_video_projects_status` - Fast status filtering
- `idx_video_scenes_project` - Fast scene lookups by project
- `idx_video_scenes_status` - Fast scene status filtering

### 4️⃣ **Row Level Security (RLS) Policies**
- Users can only see/edit their own projects
- Service role has full access for backend operations
- Secure by default

### 5️⃣ **Triggers**
- Auto-update `updated_at` timestamp on changes

---

## Verification

After running the migration, verify it worked:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('video_projects', 'video_scenes');

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('video_projects', 'video_scenes');

-- Check policies exist
SELECT tablename, policyname FROM pg_policies
WHERE tablename IN ('video_projects', 'video_scenes');
```

---

## After Migration

Once the migration is complete:

1. ✅ Video project creation will work
2. ✅ Users can create multi-scene video projects
3. ✅ AI will generate scene prompts and narration
4. ✅ Videos can be generated using Luma, Kling, or other models

You can safely delete:
- `/app/api/admin/migrate-video-tables/route.ts` (after migration)
- `/scripts/migrate-video-tables.js` (optional)
- This README file (optional)

---

## Troubleshooting

### "Table already exists" error
This is normal! It means the table was created previously. You're good to go.

### "Permission denied" error
Make sure you're:
- Using the service role key (not anon key)
- Logged in as the database owner
- Using the SQL Editor in Supabase Dashboard

### "Could not connect" error (when using Node script)
- Check your network connection
- Verify database credentials in script
- Try Option 1 (Supabase SQL Editor) instead

---

## Need Help?

- Supabase SQL Editor: https://supabase.com/dashboard/project/utursgxvfhhfheeoewfn/sql
- Migration file location: `supabase_video_projects_migration.sql`
- Check API route: `/app/api/video-studio/projects/route.ts` (uses the tables)

---

**Ready to create videos!** 🎬✨
