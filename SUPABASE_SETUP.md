# Supabase Setup Guide for WritgoAI

This guide explains how to set up Supabase as the database backend for WritgoAI.

## Table of Contents

1. [Creating a Supabase Project](#1-creating-a-supabase-project)
2. [Database Schema Migration](#2-database-schema-migration)
3. [Row Level Security (RLS) Policies](#3-row-level-security-rls-policies)
4. [Environment Configuration](#4-environment-configuration)
5. [Local Development Setup](#5-local-development-setup)
6. [Render Deployment](#6-render-deployment)
7. [Migrating from Prisma](#7-migrating-from-prisma)

---

## 1. Creating a Supabase Project

### Step 1: Create Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" and sign up with GitHub, Google, or email
3. Verify your email if required

### Step 2: Create New Project
1. Click "New Project" in the dashboard
2. Fill in the details:
   - **Name**: `writgoai-production` (or your preferred name)
   - **Database Password**: Use a strong password (save this securely!)
   - **Region**: Choose `West EU (Ireland)` for best performance in Netherlands
   - **Pricing Plan**: Start with Free tier (500 MB database, 2 GB storage)
3. Click "Create new project" and wait 2-3 minutes

### Step 3: Get API Keys
1. Go to **Settings** → **API** in your project
2. Copy the following values:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Database Schema Migration

### Option A: Using SQL Editor (Recommended)

1. Go to **SQL Editor** in your Supabase dashboard
2. Create a new query
3. Copy and run the SQL from `supabase/migrations/001_initial_schema.sql`
4. This will create all necessary tables matching the Prisma schema

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

---

## 3. Row Level Security (RLS) Policies

For multi-tenant isolation, run these RLS policies in the SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SavedContent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ArticleIdea" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AutopilotJob" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditTransaction" ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can only see their own data
CREATE POLICY "Clients see own data" ON "Client"
  FOR SELECT USING (
    auth.uid()::text = id 
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- Policy: Users can only access their own projects
CREATE POLICY "Users access own projects" ON "Project"
  FOR ALL USING (
    "clientId" = auth.uid()::text 
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- Policy: Users can only access their own content
CREATE POLICY "Users access own content" ON "SavedContent"
  FOR ALL USING (
    "clientId" = auth.uid()::text 
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- Similar policies for other tables...
```

---

## 4. Environment Configuration

### Required Environment Variables

Add these to your `.env` or `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Feature flag to enable Supabase
USE_SUPABASE=true

# Keep existing variables
DATABASE_URL=postgresql://...  # Still needed during migration
NEXTAUTH_URL=https://writgoai.nl
NEXTAUTH_SECRET=your-secret
# ... other existing variables
```

### Security Notes

- **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Only use the `anon` key in client-side code (prefixed with `NEXT_PUBLIC_`)
- The service role key bypasses RLS and should only be used server-side

---

## 5. Local Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase project (see Section 1)

### Setup Steps

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/Mikeyy1405/Writgoai.nl.git
   cd Writgoai.nl
   npm install --legacy-peer-deps
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Run database migrations**
   - Go to Supabase SQL Editor
   - Run migration scripts from `supabase/migrations/`

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Test the connection**
   - Open http://localhost:3000
   - Try logging in or creating content
   - Check Supabase Table Editor for data

### Optional: Local Supabase

For fully local development:

```bash
# Start local Supabase
supabase start

# Use local credentials
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (from supabase start output)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (from supabase start output)
```

---

## 6. Render Deployment

### Update render.yaml

The `render.yaml` has been updated to support Supabase. Key changes:

```yaml
envVars:
  # Add Supabase variables
  - key: NEXT_PUBLIC_SUPABASE_URL
    sync: false
  - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
    sync: false
  - key: SUPABASE_SERVICE_ROLE_KEY
    sync: false
  - key: USE_SUPABASE
    value: "true"
```

### Deployment Steps

1. **Configure Render environment variables**
   - Go to your Render dashboard
   - Navigate to your web service
   - Go to Environment → Environment Variables
   - Add the Supabase variables from Section 4

2. **Remove Render database** (optional, after full migration)
   - Once fully migrated to Supabase, you can remove the Render PostgreSQL database
   - This saves costs and simplifies architecture

3. **Deploy**
   ```bash
   git push origin main
   ```
   Or trigger a manual deploy in Render dashboard.

### Verifying Deployment

1. Check Render logs for successful startup
2. Visit https://writgoai.nl and test:
   - Login/logout
   - Content generation
   - Database operations

---

## 7. Migrating from Prisma

### Gradual Migration Strategy

The codebase supports running both Prisma and Supabase simultaneously:

1. **Phase 1: Dual-write mode**
   - Set `USE_SUPABASE=false`
   - Continue using Prisma
   - Data syncs to Supabase in background

2. **Phase 2: Read from Supabase**
   - Set `USE_SUPABASE=true`
   - Reads come from Supabase
   - Writes still go to both

3. **Phase 3: Full Supabase**
   - Remove Prisma dependencies
   - All operations use Supabase

### Data Migration

To migrate existing data from Prisma/PostgreSQL to Supabase:

```bash
# Export from current database
pg_dump $DATABASE_URL --data-only --no-owner > backup.sql

# Import to Supabase
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" < backup.sql
```

### Removing Prisma (Final Step)

Once fully migrated:

1. Remove packages:
   ```bash
   npm uninstall prisma @prisma/client @next-auth/prisma-adapter
   ```

2. Delete Prisma files:
   ```bash
   rm -rf prisma/
   ```

3. Update imports:
   - Replace `import { prisma } from '@/lib/db'`
   - With `import { supabase } from '@/lib/db'`

---

## Troubleshooting

### Common Issues

**"relation does not exist"**
- Run the schema migration SQL in Supabase SQL Editor
- Check table names are quoted correctly (PostgreSQL is case-sensitive)

**"permission denied"**
- Check RLS policies are configured correctly
- Ensure service role key is being used for server operations

**"connection refused"**
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check if Supabase project is paused (free tier pauses after inactivity)

**"Invalid API key"**
- Ensure keys are copied correctly (no extra spaces)
- Verify you're using the correct key type (anon vs service)

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/Mikeyy1405/Writgoai.nl/issues)

---

## Quick Reference

| Variable | Description | Where to find |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anonymous key | Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Settings → API |

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `supabase start` | Start local Supabase |
| `supabase db push` | Push migrations to remote |
