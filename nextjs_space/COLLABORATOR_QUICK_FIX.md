# 🚨 Quick Fix: ProjectCollaborator Email Error

## TL;DR

**Error**: `column ProjectCollaborator.email does not exist`

**Oorzaak**: Migratie is incompleet - tabel mist 9 kolommen

**Fix**: Run `20241217230000_fix_project_collaborator_columns.sql` in Supabase Dashboard

---

## 3-Step Fix

### Step 1: Open Supabase Dashboard
Go to: **SQL Editor**

### Step 2: Copy & Run This SQL

```sql
-- Quick fix for ProjectCollaborator.email error
ALTER TABLE "ProjectCollaborator" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "ProjectCollaborator" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "ProjectCollaborator" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'pending';
ALTER TABLE "ProjectCollaborator" ADD COLUMN IF NOT EXISTS "accessToken" TEXT;
ALTER TABLE "ProjectCollaborator" ADD COLUMN IF NOT EXISTS "invitedAt" TIMESTAMP;
ALTER TABLE "ProjectCollaborator" ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP;
ALTER TABLE "ProjectCollaborator" ADD COLUMN IF NOT EXISTS "lastAccessAt" TIMESTAMP;
ALTER TABLE "ProjectCollaborator" ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP;
ALTER TABLE "ProjectCollaborator" ADD COLUMN IF NOT EXISTS "notifyOnPublish" BOOLEAN DEFAULT true;

ALTER TABLE "ProjectCollaborator" DROP CONSTRAINT IF EXISTS "ProjectCollaborator_projectId_userId_unique";
ALTER TABLE "ProjectCollaborator" ADD CONSTRAINT "ProjectCollaborator_projectId_email_unique" UNIQUE ("projectId", "email");
ALTER TABLE "ProjectCollaborator" ADD CONSTRAINT "ProjectCollaborator_accessToken_unique" UNIQUE ("accessToken");

CREATE INDEX IF NOT EXISTS "ProjectCollaborator_email_idx" ON "ProjectCollaborator"("email");
CREATE INDEX IF NOT EXISTS "ProjectCollaborator_status_idx" ON "ProjectCollaborator"("status");
CREATE INDEX IF NOT EXISTS "ProjectCollaborator_accessToken_idx" ON "ProjectCollaborator"("accessToken");
```

### Step 3: Restart App

```bash
npm run dev
```

---

## What Was Missing?

| Column | Type | Purpose |
|--------|------|---------|
| ❌ **email** | TEXT | Voor invitations en lookups |
| ❌ **name** | TEXT | Display naam collaborator |
| ❌ **status** | TEXT | pending/active/revoked |
| ❌ **accessToken** | TEXT | Secure access zonder login |
| ❌ **invitedAt** | TIMESTAMP | Wanneer uitgenodigd |
| ❌ **acceptedAt** | TIMESTAMP | Wanneer geaccepteerd |
| ❌ **lastAccessAt** | TIMESTAMP | Laatste toegang |
| ❌ **revokedAt** | TIMESTAMP | Wanneer ingetrokken |
| ❌ **notifyOnPublish** | BOOLEAN | Notification preference |

---

## Affected Features

Deze functionaliteit werkte NIET zonder de fix:
- ❌ Project selector op dashboard
- ❌ Projects pagina laden
- ❌ Collaborators toevoegen
- ❌ Project invitations versturen
- ❌ Collaborator access tokens

Na de fix werkt alles weer! ✅

---

## Verification

Run dit om te checken of de fix werkt:

```sql
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'ProjectCollaborator';
-- Expected: 15 columns
```

---

## Files Created

1. `supabase/migrations/20241217230000_fix_project_collaborator_columns.sql` - Full migratie
2. `supabase/migrations/test_collaborator_fix.sql` - Test queries
3. `FIX_COLLABORATOR_EMAIL_ERROR.md` - Uitgebreide documentatie

---

## Need Help?

Zie `FIX_COLLABORATOR_EMAIL_ERROR.md` voor:
- Gedetailleerde uitleg
- Alternatieve fix methodes
- Rollback instructies
- Troubleshooting tips
