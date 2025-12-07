# Testing Guide: ContentHubSite ProjectId Fix

## Test Plan voor WordPress Verbinding Fix

Deze guide beschrijft hoe je de fix uitgebreid test voordat je naar productie gaat.

## Pre-Test Setup

### 1. Test Environment Setup

```bash
# Clone de repository
git clone <repo-url>
cd Writgoai.nl/nextjs_space

# Install dependencies
yarn install

# Setup test database (of gebruik development database)
# Zorg dat je een schone database hebt of backup van productie
```

### 2. Apply Migration

```bash
# Genereer Prisma client
yarn prisma generate

# Apply migration
yarn prisma migrate deploy

# Verify migration
yarn ts-node scripts/verify_contenthub_migration.ts
```

## Test Scenarios

### Test 1: WordPress Verbinding van Integration Page

**Doel:** Test dat je WordPress kan verbinden vanaf de Integration pagina

**Stappen:**
1. Login als client
2. Navigeer naar Integration pagina (`/client-portal/integration`)
3. Klik op "Verbind WordPress" of "Connect WordPress"
4. Vul in:
   - WordPress URL: `https://your-site.com`
   - Username: `admin`
   - Application Password: `xxxx xxxx xxxx xxxx`
5. Klik "Test Connection" of "Verbinden"

**Verwacht Resultaat:**
- ✅ Succesbericht: "WordPress connected successfully"
- ✅ Geen error over "projectId does not exist"
- ✅ Site verschijnt in lijst van connected sites

**Rollback bij falen:**
- Check logs voor specifieke error
- Verifieer dat migration is toegepast
- Check database credentials

---

### Test 2: WordPress Verbinding met Bestaand Project

**Doel:** Test dat WordPress automatisch linkt aan bestaand project met zelfde URL

**Pre-requisite:** 
- Maak eerst een project met WordPress configuratie

**Stappen:**
1. Maak project aan met:
   - Website URL: `https://test-site.com`
   - WordPress URL: `https://test-site.com`
   - WordPress Username: `admin`
   - WordPress Password: `app-password-here`
2. Ga naar Content Hub
3. Verbind WordPress met zelfde URL: `https://test-site.com`

**Verwacht Resultaat:**
- ✅ ContentHubSite wordt automatisch gelinkt aan project
- ✅ Message: "WordPress connected successfully and linked to project: [Project Name]"
- ✅ `projectId` veld is gevuld in database
- ✅ Project info wordt getoond in Content Hub

**Database Verification:**
```sql
SELECT 
  id, 
  wordpressUrl, 
  projectId, 
  isConnected 
FROM "ContentHubSite" 
WHERE wordpressUrl = 'https://test-site.com';
```

Expected: 1 row met ingevuld `projectId`

---

### Test 3: WordPress Verbinding van AI Content Page

**Doel:** Test WordPress verbinding vanuit de AI Content generatie flow

**Stappen:**
1. Ga naar AI Content generatie
2. Selecteer een project
3. Genereer content
4. Klik "Publish to WordPress"
5. Als er geen connectie is, vul WordPress credentials in

**Verwacht Resultaat:**
- ✅ Geen error over projectId
- ✅ WordPress credentials worden gevraagd of hergebruikt van project
- ✅ Content wordt succesvol gepubliceerd

---

### Test 4: Project zonder WordPress Config

**Doel:** Test dat ContentHubSite ook werkt zonder gekoppeld project

**Stappen:**
1. Maak nieuw project ZONDER WordPress configuratie
2. Ga naar Content Hub
3. Verbind WordPress met andere URL dan project website

**Verwacht Resultaat:**
- ✅ ContentHubSite wordt aangemaakt
- ✅ `projectId` is `NULL` (niet gelinkt)
- ✅ Geen errors
- ✅ WordPress functionaliteit werkt normaal

---

### Test 5: Meerdere Sites per Client

**Doel:** Test dat een client meerdere WordPress sites kan hebben

**Stappen:**
1. Verbind eerste WordPress site
2. Verbind tweede WordPress site (andere URL)
3. Check dat beide sites zichtbaar zijn

**Verwacht Resultaat:**
- ✅ Beide sites worden opgeslagen
- ✅ Elke site heeft eigen credentials
- ✅ Sites kunnen onafhankelijk gebruikt worden

**Database Verification:**
```sql
SELECT 
  id, 
  wordpressUrl, 
  projectId, 
  isConnected,
  createdAt
FROM "ContentHubSite" 
WHERE clientId = '<test-client-id>'
ORDER BY createdAt DESC;
```

---

### Test 6: Update Bestaande Connectie

**Doel:** Test dat je bestaande WordPress connectie kan updaten

**Stappen:**
1. Verbind WordPress site
2. Ga terug naar connectie pagina
3. Update credentials (bijv. nieuwe application password)
4. Test connectie opnieuw

**Verwacht Resultaat:**
- ✅ Credentials worden ge-update
- ✅ `projectId` blijft behouden
- ✅ `lastSyncedAt` wordt ge-update
- ✅ Geen duplicate sites

---

### Test 7: Project Link Synchronisatie

**Doel:** Test dat WordPress config tussen Project en ContentHub gesynchroniseerd blijft

**Stappen:**
1. Update WordPress credentials in Project settings
2. Ga naar Content Hub
3. Check of credentials automatisch updated zijn

**Verwacht Resultaat:**
- ✅ Content Hub gebruikt nieuwe Project credentials
- ✅ Geen disconnect nodig
- ✅ Publishing werkt met nieuwe credentials

---

### Test 8: Migration Rollback Test

**Doel:** Verifieer dat rollback veilig is

**Pre-requisite:** Backup van database

**Stappen:**
1. Restore database backup (zonder migration)
2. Start applicatie
3. Probeer WordPress te verbinden

**Verwacht Resultaat:**
- ❌ Error over "projectId does not exist" (verwacht)
- ✅ Applicatie blijft werken voor andere functies
- ✅ Geen crashes of data corruption

Daarna:
4. Apply migration opnieuw
5. Verifieer dat alles werkt

---

## Automated Tests

### Unit Tests

Voeg toe aan test suite:

```typescript
// tests/content-hub/wordpress-connection.test.ts

describe('WordPress Connection with ProjectId', () => {
  it('should create ContentHubSite with projectId when project has matching URL', async () => {
    // Test implementation
  });

  it('should create ContentHubSite without projectId when project URL does not match', async () => {
    // Test implementation
  });

  it('should update existing ContentHubSite and preserve projectId', async () => {
    // Test implementation
  });

  it('should find ContentHubSite by projectId', async () => {
    // Test implementation
  });
});
```

### Integration Tests

```bash
# Run integration tests
yarn test:integration
```

### API Tests

Test de endpoints:

```bash
# Test WordPress connection endpoint
curl -X POST http://localhost:3000/api/content-hub/connect-wordpress \
  -H "Content-Type: application/json" \
  -d '{
    "wordpressUrl": "https://test-site.com",
    "username": "admin",
    "applicationPassword": "xxxx xxxx xxxx xxxx",
    "projectId": "test-project-id"
  }'

# Test get sites endpoint
curl http://localhost:3000/api/content-hub/connect-wordpress
```

## Performance Tests

### Query Performance

Test dat de nieuwe `projectId` index correct werkt:

```sql
-- Test query met projectId filter (should use index)
EXPLAIN ANALYZE
SELECT * FROM "ContentHubSite" WHERE "projectId" = 'test-id';

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE indexname = 'ContentHubSite_projectId_idx';
```

## Regression Tests

Check dat bestaande functionaliteit niet broken is:

- [ ] Content generatie werkt nog
- [ ] WordPress publishing werkt nog
- [ ] Project management werkt nog
- [ ] Client login werkt nog
- [ ] Other Content Hub features werken nog

## Test Checklist

Voor deployment naar productie, check:

- [ ] Test 1: WordPress verbinding van Integration page ✅
- [ ] Test 2: WordPress verbinding met bestaand project ✅
- [ ] Test 3: WordPress verbinding van AI Content page ✅
- [ ] Test 4: Project zonder WordPress config ✅
- [ ] Test 5: Meerdere sites per client ✅
- [ ] Test 6: Update bestaande connectie ✅
- [ ] Test 7: Project link synchronisatie ✅
- [ ] Test 8: Migration rollback test ✅
- [ ] All automated tests pass ✅
- [ ] Performance tests acceptable ✅
- [ ] No regressions detected ✅

## Bug Report Template

Als je een bug vindt tijdens testen:

```markdown
### Bug Report

**Test:** [Test nummer en naam]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[Wat je verwachtte]

**Actual Result:**
[Wat er gebeurde]

**Error Message:**
```
[Error message hier]
```

**Database State:**
```sql
-- Relevante database queries
```

**Logs:**
```
[Relevante log entries]
```

**Environment:**
- Database: PostgreSQL [version]
- Node.js: [version]
- Prisma: [version]

**Severity:** [Critical / High / Medium / Low]
```

## Contact voor Test Support

Bij vragen over testen, contact development team.
