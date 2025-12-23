# Knowledge Base Migration Guide

## Problem

The application was unable to save knowledge base entries due to a missing `is_active` column in the `project_knowledge_base` table. The error message was:

```
Could not find the 'is_active' column of 'project_knowledge_base' in the schema cache
```

## Root Cause

The `project_knowledge_base` table either:
1. Did not exist in the database, OR
2. Existed but was missing the `is_active` column

The application code in `app/api/project/knowledge-base/route.ts` and `lib/project-context.ts` both expect and use the `is_active` column when querying and saving knowledge base entries.

## Solution

Created a comprehensive migration SQL file: `supabase_project_knowledge_base_migration.sql`

This migration creates the `project_knowledge_base` table with all necessary columns and proper security policies.

## Migration Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/utursgxvfhhfheeoewfn
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the contents of `supabase_project_knowledge_base_migration.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl/Cmd + Enter)
7. Verify success by running the verification queries at the bottom of the file

### Option 2: Using Command Line (Alternative)

If you have the Supabase CLI installed:

```bash
supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.utursgxvfhhfheeoewfn.supabase.co:5432/postgres" < supabase_project_knowledge_base_migration.sql
```

## Table Structure

The migration creates a table with the following columns:

| Column       | Type                        | Description                                    |
|--------------|-----------------------------|------------------------------------------------|
| id           | UUID (Primary Key)          | Unique identifier for each entry               |
| project_id   | UUID (Foreign Key)          | References the projects table                  |
| title        | TEXT (NOT NULL)             | Title of the knowledge base entry              |
| content      | TEXT (NOT NULL)             | Content/body of the entry                      |
| category     | TEXT                        | Category (defaults to 'general')               |
| source_url   | TEXT                        | Optional source URL                            |
| tags         | TEXT[]                      | Array of tags for categorization               |
| is_active    | BOOLEAN                     | Whether entry is active (defaults to true)     |
| created_at   | TIMESTAMP WITH TIME ZONE    | Creation timestamp                             |
| updated_at   | TIMESTAMP WITH TIME ZONE    | Last update timestamp (auto-updated)           |

## Security (Row Level Security)

The migration includes RLS policies that ensure:
- Users can only view/edit/delete knowledge base entries for projects they own
- Uses auth.uid() to verify user ownership through the projects table

## Features

1. **Foreign Key Constraint**: Ensures data integrity by linking to the projects table
2. **Cascade Deletion**: If a project is deleted, all its knowledge base entries are automatically deleted
3. **Indexes**: Optimizes query performance on frequently accessed columns
4. **Triggers**: Automatically updates the `updated_at` timestamp on row updates
5. **RLS Policies**: Secures data access based on user authentication

## Verification

After running the migration, verify it worked by running these queries in the Supabase SQL Editor:

```sql
-- Check table structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'project_knowledge_base'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'project_knowledge_base';
```

You should see:
- All 10 columns listed with correct types
- 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)

## Testing

After migration, test the knowledge base functionality:

1. Log into the application
2. Navigate to a project's settings
3. Go to the Knowledge Base section
4. Try creating a new entry with:
   - Title
   - Content
   - Category (optional)
   - Tags (optional)
5. Verify the entry saves successfully
6. Try editing and deleting entries

## Rollback

If you need to rollback the migration:

```sql
-- Drop the table (WARNING: This deletes all data!)
DROP TABLE IF EXISTS project_knowledge_base CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_project_knowledge_base_updated_at() CASCADE;
```

## Notes

- The migration is idempotent - it can be run multiple times safely using `IF NOT EXISTS` clauses
- No data migration is needed as this is creating a new table
- The `tags` column uses PostgreSQL's array type for flexible tag management
- The `updated_at` column is automatically maintained by a database trigger

## Support

If you encounter any issues:
1. Check the Supabase logs for detailed error messages
2. Verify your service role key has the necessary permissions
3. Ensure the `projects` table exists and has the expected structure
