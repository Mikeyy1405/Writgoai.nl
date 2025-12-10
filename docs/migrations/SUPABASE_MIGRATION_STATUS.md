# Supabase Migration Status

## ✅ Completed

### 1. Core Infrastructure
- ✅ Installed `@supabase/supabase-js` package
- ✅ Created `lib/supabase.ts` with Supabase client configuration
- ✅ Updated `lib/db.ts` to export Supabase clients
- ✅ Created `supabase/schema.sql` with database schema
- ✅ Updated `.env.example` with Supabase environment variables

### 2. Prisma Removal
- ✅ Uninstalled `prisma`, `@prisma/client`, and `@next-auth/prisma-adapter`
- ✅ Removed Prisma configuration from `package.json`
- ✅ Deleted `prisma/` directory and schema files

### 3. Authentication
- ✅ Updated `lib/auth-options.ts` to use Supabase instead of PrismaAdapter
- ✅ Converted User and Client authentication queries to Supabase
- ✅ Maintained admin email check for `info@writgo.nl` and `info@writgoai.nl`

### 4. API Routes Converted
- ✅ `app/api/admin/branding/route.ts` (GET/PUT operations)

## ⚠️ Remaining Work

### API Routes to Convert (336 files)
The following files still use Prisma and need to be converted to Supabase:

**High Priority (Core Features):**
- `app/api/admin/branding/upload/route.ts`
- Authentication-related API routes
- Client management routes
- Credit system routes
- Project management routes

**Complete List:**
Run this command to see all files that need conversion:
```bash
grep -r "from '@/lib/db'" /path/to/nextjs_space --include="*.ts" --include="*.tsx" -l | grep -v node_modules
```

### Conversion Pattern

For each file, replace Prisma queries with Supabase equivalents:

#### Example: Find Unique
```typescript
// Before (Prisma)
const user = await prisma.user.findUnique({
  where: { email: email },
});

// After (Supabase)
const { data: user, error } = await supabaseAdmin
  .from('User')
  .select('*')
  .eq('email', email)
  .single();
```

#### Example: Create
```typescript
// Before (Prisma)
const client = await prisma.client.create({
  data: {
    email: 'test@example.com',
    name: 'Test Client',
    password: hashedPassword,
  },
});

// After (Supabase)
const { data: client, error } = await supabaseAdmin
  .from('Client')
  .insert({
    email: 'test@example.com',
    name: 'Test Client',
    password: hashedPassword,
  })
  .select()
  .single();
```

#### Example: Update
```typescript
// Before (Prisma)
const updated = await prisma.client.update({
  where: { id: clientId },
  data: { name: 'New Name' },
});

// After (Supabase)
const { data: updated, error } = await supabaseAdmin
  .from('Client')
  .update({ name: 'New Name' })
  .eq('id', clientId)
  .select()
  .single();
```

#### Example: Delete
```typescript
// Before (Prisma)
await prisma.client.delete({
  where: { id: clientId },
});

// After (Supabase)
const { error } = await supabaseAdmin
  .from('Client')
  .delete()
  .eq('id', clientId);
```

#### Example: Find Many
```typescript
// Before (Prisma)
const clients = await prisma.client.findMany({
  where: { isActive: true },
  orderBy: { createdAt: 'desc' },
  take: 10,
});

// After (Supabase)
const { data: clients, error } = await supabaseAdmin
  .from('Client')
  .select('*')
  .eq('isActive', true)
  .order('createdAt', { ascending: false })
  .limit(10);
```

## 🚀 Next Steps

### For the User:

1. **Set up Supabase Project:**
   - Go to https://supabase.com/dashboard
   - Create a new project
   - Run the SQL schema from `supabase/schema.sql` in the SQL Editor

2. **Update Environment Variables in Render:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Migrate Data (if needed):**
   If you have existing data, use Supabase's import tools or pg_dump/pg_restore

4. **Convert Remaining API Routes:**
   - Start with high-priority routes (auth, clients, projects, credits)
   - Use the conversion patterns above
   - Test each route after conversion

5. **Test the Application:**
   - Test authentication (both admin and client login)
   - Test branding settings
   - Test core features
   - Monitor for errors

### For Developers:

**Automated Migration Tool:**
Consider creating a script to automate the conversion:
- Parse TypeScript files
- Identify Prisma query patterns
- Replace with Supabase equivalents
- Run automated tests

**Import Statement Update:**
All files need to update:
```typescript
// Change this:
import { prisma } from '@/lib/db';

// To this:
import { supabaseAdmin } from '@/lib/supabase';
// or
import { db } from '@/lib/db'; // if using the compatibility export
```

## 📚 Resources

- [Supabase JavaScript Client Docs](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Database Functions](https://supabase.com/docs/reference/javascript/select)
- [Migration from Prisma Guide](https://supabase.com/docs/guides/database/prisma)

## ⚠️ Known Limitations

1. **Prisma Relations:** Supabase doesn't have the same automatic relation loading. You may need to do manual joins or separate queries.

2. **Transactions:** Supabase uses PostgreSQL transactions differently than Prisma. Use RPC functions for complex transactions.

3. **Middleware:** Prisma middleware needs to be replaced with Supabase database functions or triggers.

4. **Type Safety:** Prisma's generated types are lost. Consider using Supabase's type generation:
   ```bash
   npx supabase gen types typescript --project-id your-project-id > types/supabase.ts
   ```

## 🐛 Common Issues

### Issue: "relation does not exist"
**Solution:** Make sure you ran the schema.sql in Supabase SQL Editor

### Issue: "PGRST116" (no rows returned)
**Solution:** This is normal when no data exists. Handle it:
```typescript
if (error && error.code !== 'PGRST116') {
  throw error;
}
```

### Issue: RLS (Row Level Security) blocks queries
**Solution:** Use `supabaseAdmin` for server-side operations which bypasses RLS

## 📊 Migration Progress: 1.2%

- ✅ Completed: 4 files
- ⏳ Remaining: 336 files
- 📈 Progress: 1.2% (4/340)
