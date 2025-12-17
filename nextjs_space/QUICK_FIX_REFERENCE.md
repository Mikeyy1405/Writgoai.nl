# BlogPost Migration - Quick Fix Reference

## 🚨 The Problem
```
ERROR: column 'category' does not exist
```

## ✅ The Solution
Run this new migration: `20241217220000_blogpost_fixed.sql`

## 🏃 Quick Start (3 Steps)

### 1️⃣ Open Supabase Dashboard
```
https://supabase.com → Your Project → SQL Editor
```

### 2️⃣ Copy & Paste
```bash
cat supabase/migrations/20241217220000_blogpost_fixed.sql
```
→ Paste into SQL Editor → Click **Run**

### 3️⃣ Verify
```sql
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'BlogPost';
-- Should return: 16
```

## ✓ Success Checklist

- [ ] Migratie ran without errors
- [ ] `BlogPost` tabel bestaat
- [ ] Tabel heeft 16 kolommen (inclusief `category`)
- [ ] Test insert werkt: 
  ```sql
  INSERT INTO "BlogPost" (slug, title, content) 
  VALUES ('test', 'Test', 'Test');
  ```
- [ ] `PlannedArticle.blogPostId` kolom bestaat

## 🔧 If Something Goes Wrong

### Nuclear Reset (⚠️ DEV ONLY - DELETES DATA!)
```sql
DROP TABLE IF EXISTS "BlogPost" CASCADE;
-- Then run the migration again
```

### Manual Column Add
```sql
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "category" TEXT;
CREATE INDEX IF NOT EXISTS "BlogPost_category_idx" ON "BlogPost"("category");
```

## 📚 Full Documentation
See: `BLOGPOST_MIGRATION_GUIDE.md`

## 🎯 What Changed

| Old Migration | New Migration |
|--------------|---------------|
| ❌ Direct column creation | ✅ Check if exists first |
| ❌ Index before column | ✅ Column then index |
| ❌ Not idempotent | ✅ Can run multiple times |

## 🚀 After Migration

You can now use BlogPost in your code:

```typescript
import { prisma } from '@/lib/prisma-shim';

const post = await prisma.blogPost.create({
  data: {
    slug: 'my-post',
    title: 'My Post',
    content: 'Content here',
    category: 'Tutorial', // ← This now works!
    status: 'published',
  },
});
```

---

**Quick Help:** Run all test queries from `test_blogpost_migration.sql` to verify everything works.
