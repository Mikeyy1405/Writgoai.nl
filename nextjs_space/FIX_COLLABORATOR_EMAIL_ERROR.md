# Fix: ProjectCollaborator.email Error

## Probleem
De database geeft de error: `column ProjectCollaborator.email does not exist` (code 42703)

Dit gebeurt omdat de ProjectCollaborator tabel incompleet is. De migratie `20241217210000_project_collaborator.sql` heeft alleen deze kolommen aangemaakt:
- id, projectId, userId, role, createdAt, updatedAt

Maar de applicatie code verwacht veel meer kolommen:
- **email** (verplicht voor invitations)
- **name** (display name)
- **status** (pending/active/revoked)
- **accessToken** (voor secure access)
- **invitedAt, acceptedAt, lastAccessAt, revokedAt** (timestamps)
- **notifyOnPublish** (notification preference)

## Oplossing

### Stap 1: Run de Fix Migratie

Er is een nieuwe migratie aangemaakt: `supabase/migrations/20241217230000_fix_project_collaborator_columns.sql`

**Optie A: Via Supabase Dashboard (Aanbevolen)**

1. Open je Supabase Dashboard
2. Ga naar SQL Editor
3. Kopieer de inhoud van `20241217230000_fix_project_collaborator_columns.sql`
4. Plak in de SQL Editor
5. Klik op "Run"

**Optie B: Via Supabase CLI**

```bash
cd /home/ubuntu/writgoai_nl/nextjs_space
supabase db push
```

**Optie C: Direct SQL (Emergency Fix)**

Als je direct toegang hebt tot de database, run dit:

```sql
-- Minimale fix voor de email error
ALTER TABLE "ProjectCollaborator" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "ProjectCollaborator" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "ProjectCollaborator" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'pending';
ALTER TABLE "ProjectCollaborator" ADD COLUMN IF NOT EXISTS "accessToken" TEXT;
ALTER TABLE "ProjectCollaborator" ADD COLUMN IF NOT EXISTS "invitedAt" TIMESTAMP;
ALTER TABLE "ProjectCollaborator" ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP;
ALTER TABLE "ProjectCollaborator" ADD COLUMN IF NOT EXISTS "lastAccessAt" TIMESTAMP;
ALTER TABLE "ProjectCollaborator" ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP;
ALTER TABLE "ProjectCollaborator" ADD COLUMN IF NOT EXISTS "notifyOnPublish" BOOLEAN DEFAULT true;

-- Update constraints
ALTER TABLE "ProjectCollaborator" DROP CONSTRAINT IF EXISTS "ProjectCollaborator_projectId_userId_unique";
ALTER TABLE "ProjectCollaborator" ADD CONSTRAINT "ProjectCollaborator_projectId_email_unique" UNIQUE ("projectId", "email");
ALTER TABLE "ProjectCollaborator" ADD CONSTRAINT "ProjectCollaborator_accessToken_unique" UNIQUE ("accessToken");

-- Add indices
CREATE INDEX IF NOT EXISTS "ProjectCollaborator_email_idx" ON "ProjectCollaborator"("email");
CREATE INDEX IF NOT EXISTS "ProjectCollaborator_status_idx" ON "ProjectCollaborator"("status");
CREATE INDEX IF NOT EXISTS "ProjectCollaborator_accessToken_idx" ON "ProjectCollaborator"("accessToken");
```

### Stap 2: Verificatie

Run de test queries om te verifiëren dat alles correct is:

```bash
# In Supabase Dashboard SQL Editor
# Kopieer de inhoud van: supabase/migrations/test_collaborator_fix.sql
```

Verwachte resultaten:
- **15 kolommen** in totaal
- **7 indices** (inclusief nieuwe email, status, accessToken indices)
- **4 constraints** (inclusief nieuwe projectId_email en accessToken unique constraints)

### Stap 3: Test de Applicatie

1. Herstart de applicatie:
   ```bash
   npm run dev
   ```

2. Test de volgende functionaliteit:
   - Dashboard project selector laden
   - Projects pagina openen
   - Collaborators toevoegen aan een project

3. Check de console logs:
   - Er moeten GEEN "Error fetching projects" errors meer zijn
   - Geen "column ProjectCollaborator.email does not exist" errors

## Welke Bestanden Zijn Aangepast

1. **supabase/migrations/20241217230000_fix_project_collaborator_columns.sql** (NIEUW)
   - Voegt alle ontbrekende kolommen toe
   - Voegt nieuwe constraints toe
   - Voegt indices toe

2. **supabase/migrations/test_collaborator_fix.sql** (NIEUW)
   - Test queries om de fix te verifiëren

## Technische Details

### Waarom Deze Kolommen?

De applicatie code gebruikt ProjectCollaborator voor twee doeleinden:

1. **User-based collaboration** (userId)
   - Voor users die ingelogd zijn
   - Relatie met User tabel

2. **Email-based invitations** (email)
   - Voor mensen die nog geen account hebben
   - Kunnen via accessToken zonder login het project bekijken
   - Na acceptatie kan optioneel een User account aangemaakt worden

### Affected API Routes

Deze routes gebruiken de email kolom:
- `app/api/client/projects/route.ts` (regel 69, 150)
- `app/api/client/projects/[id]/collaborators/route.ts`
- `app/api/client/project-members/route.ts`
- `app/api/project-view/route.ts`

### Schema After Fix

```typescript
model ProjectCollaborator {
  id              String    @id @default(uuid())
  projectId       String
  userId          String
  email           String?   // NEW
  name            String?   // NEW
  role            String    @default("viewer")
  status          String    @default("pending")  // NEW
  accessToken     String?   @unique  // NEW
  invitedAt       DateTime? // NEW
  acceptedAt      DateTime? // NEW
  lastAccessAt    DateTime? // NEW
  revokedAt       DateTime? // NEW
  notifyOnPublish Boolean   @default(true) // NEW
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @default(now())
  
  project         Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@unique([projectId, email])
  @@index([projectId])
  @@index([userId])
  @@index([email])
  @@index([status])
  @@index([accessToken])
}
```

## Rollback (Als Nodig)

Als er problemen zijn, rollback met:

```sql
-- ALLEEN GEBRUIKEN ALS LAATSTE REDMIDDEL
ALTER TABLE "ProjectCollaborator" DROP COLUMN IF EXISTS "email";
ALTER TABLE "ProjectCollaborator" DROP COLUMN IF EXISTS "name";
ALTER TABLE "ProjectCollaborator" DROP COLUMN IF EXISTS "status";
ALTER TABLE "ProjectCollaborator" DROP COLUMN IF EXISTS "accessToken";
ALTER TABLE "ProjectCollaborator" DROP COLUMN IF EXISTS "invitedAt";
ALTER TABLE "ProjectCollaborator" DROP COLUMN IF EXISTS "acceptedAt";
ALTER TABLE "ProjectCollaborator" DROP COLUMN IF EXISTS "lastAccessAt";
ALTER TABLE "ProjectCollaborator" DROP COLUMN IF EXISTS "revokedAt";
ALTER TABLE "ProjectCollaborator" DROP COLUMN IF EXISTS "notifyOnPublish";
```

Maar je zult dan ook de applicatie code moeten aanpassen!

## Support

Als je nog steeds errors ziet na de fix:

1. Check de browser console voor specifieke error messages
2. Check de Supabase logs voor database errors
3. Verificeer dat de migratie succesvol is uitgevoerd met de test queries
4. Herstart de applicatie om zeker te zijn dat alle connections refreshed zijn
