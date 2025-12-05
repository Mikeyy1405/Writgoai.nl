# Database Migration Instructions

## Critical Migration: Add contentId to ContentHubArticle

### Issue
The application crashes during article generation with the error:
```
The column `ContentHubArticle.contentId` does not exist in the current database.
```

### Solution
A migration has been created at:
`/nextjs_space/prisma/migrations/20251205101600_add_content_id_to_content_hub_article/migration.sql`

### How to Apply

#### Option 1: Using Prisma Migrate (Recommended)
```bash
cd nextjs_space
npx prisma migrate deploy
```

#### Option 2: Manual SQL Execution
If you have direct database access, run:
```sql
ALTER TABLE "ContentHubArticle" ADD COLUMN "contentId" TEXT;
```

### Verification
After applying the migration, verify it worked:
```bash
cd nextjs_space
npx prisma migrate status
```

You should see all migrations marked as applied.

### Note on BlogPost.seoScore
The `BlogPost.seoScore` column already exists in the schema.prisma file (line 1428).
If you're getting errors about this column, ensure all migrations have been applied:
```bash
cd nextjs_space
npx prisma migrate deploy
```

### Rollback (if needed)
If you need to rollback this migration:
```sql
ALTER TABLE "ContentHubArticle" DROP COLUMN IF EXISTS "contentId";
```
