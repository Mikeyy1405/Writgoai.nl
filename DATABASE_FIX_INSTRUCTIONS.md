# Database Fix Instructions

## Problem
The application is throwing errors because core tables (Project, Client, WebsiteAnalysis) don't exist in the Supabase database.

**Error:** `ERROR: 42P01: relation "Project" does not exist`

## Root Cause
The base table migrations were never executed in Supabase. The existing migrations assume these tables already exist.

## Solution

### Option 1: Run Complete Setup (RECOMMENDED)

**Step 1: Open Supabase SQL Editor**
1. Go to https://supabase.com/dashboard
2. Select your Writgo.nl project
3. Click "SQL Editor" in the left sidebar
4. Click "New query"

**Step 2: Run the Complete Setup Script**
1. Copy the entire contents of `/supabase/migrations/COMPLETE_SETUP.sql`
2. Paste it into the SQL Editor
3. Click "Run" or press `Ctrl+Enter`
4. Wait for completion (should take 10-30 seconds)

**Step 3: Verify Tables Were Created**
```sql
-- Run this query to verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'Client', 'Project', 'BlogPost', 'ContentPlan', 'ContentPlanItem',
  'TopicalAuthorityMap', 'TopicalMapArticle', 'SocialMediaStrategy',
  'SocialMediaPost', 'AutopilotConfig', 'WebsiteAnalysis', 'User'
);
```

You should see **12 tables** listed.

**Step 4: Run RLS Policies**
After creating tables, run the RLS policies migration:
```sql
-- Copy and run contents of: 
-- /supabase/migrations/20251212_fix_client_creation_rls.sql
```

**Step 5: Run Multi-Project Support Migration**
Finally, run the multi-project enhancements:
```sql
-- Copy and run contents of:
-- /supabase/migrations/20251212_multi_project_support.sql
```

### Option 2: Run Individual Migrations in Order

If you prefer to run migrations one by one:

1. **Base Tables** → `20251210_create_base_tables.sql`
2. **Dashboard Tables** → `20251210_client_dashboard_tables.sql`  
3. **Website Analysis** → `20251212_website_analysis_table.sql`
4. **Content Plans** → `20251212_content_plans_tables_FIXED.sql`
5. **Topical Maps** → `20251212_topical_authority_map_tables.sql`
6. **Social Media** → `20251212_social_media_pipeline.sql`
7. **RLS Policies** → `20251212_fix_client_creation_rls.sql`
8. **Multi-Project** → `20251212_multi_project_support.sql`

## After Running Migrations

### Test Client Creation
1. Open `https://writgo.nl/admin/klanten`
2. Click "Nieuwe Klant"
3. Fill in:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "test123"
4. Click "Aanmaken"
5. Should see success message ✅

### Test Website Analyzer
1. Go to `https://writgo.nl/admin/blog`
2. Find "AI Website Analyzer" section
3. Enter URL: "https://writgo.nl"
4. Click "Analyseer Mijn Website"
5. Should see analysis results ✅

### Test Project Switcher
1. Look at sidebar
2. Should see "Project Switcher" dropdown at top
3. Click dropdown
4. Click "Nieuw Project Toevoegen"
5. Fill in details
6. Should create successfully ✅

## Troubleshooting

### Error: "Permission denied for table Client"
**Fix:** Run the RLS policies migration (`20251212_fix_client_creation_rls.sql`)

### Error: "Foreign key violation"
**Fix:** Make sure you ran `COMPLETE_SETUP.sql` first, which creates tables in the correct order

### Error: "relation already exists"
**Fix:** The table already exists. Skip that migration or use `CREATE TABLE IF NOT EXISTS`

### Still Having Issues?
1. Check Supabase logs: Dashboard → Logs
2. Verify your migration files were uploaded correctly
3. Ensure you're connected to the correct Supabase project
4. Check that your API keys in `.env.local` are correct

## Migration Status Checklist

- [ ] COMPLETE_SETUP.sql executed
- [ ] 12 core tables exist in database
- [ ] RLS policies applied
- [ ] Multi-project support enabled
- [ ] Client creation works
- [ ] Website analyzer works
- [ ] Project switcher visible

## Next Steps After Fix

Once database is fixed:
1. Test all features end-to-end
2. Create your first test client
3. Analyze a website
4. Create a project
5. Generate content

## Support

If you still encounter issues after following these steps:
- Check `/nextjs_space/app/api/admin/*/route.ts` for API errors
- Review browser console for frontend errors
- Check Supabase Dashboard → Logs for database errors
- Verify environment variables in `.env.local`
