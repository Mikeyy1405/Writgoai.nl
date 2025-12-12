# ClientId Column Fix - Uitvoerings Instructies

## 📋 Probleem

Error: **"column clientId does not exist"**

Dit betekent dat één of meerdere content tabellen geen `clientId` kolom hebben, of dat de foreign key relatie niet correct is ingesteld.

## 🔍 Diagnose (Stap 1)

### Voer het diagnose script uit:

```bash
cd /home/ubuntu/writgoai_app
```

**In Supabase SQL Editor:**
1. Open Supabase Dashboard → SQL Editor
2. Kopieer de inhoud van `supabase/migrations/DIAGNOSE_CLIENTID_ISSUE.sql`
3. Plak en voer uit
4. Bekijk de resultaten

**Lokaal via psql:**
```bash
psql $DATABASE_URL -f supabase/migrations/DIAGNOSE_CLIENTID_ISSUE.sql
```

### Wat te zoeken in de output:

✅ **Goed:**
```
✅ Client table exists
✅ ContentPlan.clientId exists
✅ TopicalAuthorityMap.clientId exists
✅ SocialMediaStrategy.clientId exists
✅ WebsiteAnalysis.clientId exists
```

❌ **Probleem gedetecteerd:**
```
❌ ContentPlan.clientId MISSING
⚠️  TopicalAuthorityMap table does not exist
```

## 🔧 Fix (Stap 2)

### Voer het fix script uit:

**In Supabase SQL Editor:**
1. Open Supabase Dashboard → SQL Editor
2. Kopieer de inhoud van `supabase/migrations/COMPLETE_CLIENTID_FIX.sql`
3. Plak en voer uit
4. Wacht op completion message

**Lokaal via psql:**
```bash
psql $DATABASE_URL -f supabase/migrations/COMPLETE_CLIENTID_FIX.sql
```

### Wat het script doet:

1. ✅ **Verifieert** dat Client table bestaat
2. ✅ **Voegt toe** ontbrekende `clientId` kolommen
3. ✅ **Maakt** foreign key constraints aan
4. ✅ **Zet** NOT NULL constraint waar nodig
5. ✅ **Voegt** indexes toe voor performance
6. ✅ **Verifieert** dat alles correct is

### Verwachte output:

```sql
NOTICE: ✅ Client table exists
NOTICE: Checking ContentPlan table...
NOTICE: ✅ ContentPlan.clientId already exists
NOTICE: ✅ ContentPlan foreign key already exists
...
NOTICE: 🎉 ClientId fix completed successfully!
```

## ✅ Verificatie (Stap 3)

### Check dat de fix werkt:

```sql
-- Run this query in Supabase SQL Editor
SELECT 
  table_name as "Table",
  column_name as "Column",
  data_type as "Type",
  is_nullable as "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'clientId'
ORDER BY table_name;
```

### Verwachte resultaat:

| Table | Column | Type | Nullable |
|-------|--------|------|----------|
| BlogPost | clientId | text | NO |
| ContentPlan | clientId | text | NO |
| SocialMediaStrategy | clientId | text | NO |
| TopicalAuthorityMap | clientId | text | NO |
| WebsiteAnalysis | clientId | text | NO |

### Test de applicatie:

1. Start de dev server:
```bash
cd /home/ubuntu/writgoai_app/nextjs_space
npm run dev
```

2. Ga naar de admin pages:
- `/admin/blog` - Test Blog Management
- `/admin/social` - Test Social Media
- `/admin/dashboard` - Check algemene functionaliteit

3. Check de console voor errors

## 🚀 Belangrijke Kenmerken

### ✨ Idempotent (Veilig om meerdere keren uit te voeren)

Je kunt `COMPLETE_CLIENTID_FIX.sql` meerdere keren uitvoeren zonder problemen:
- Detecteert bestaande kolommen
- Detecteert bestaande foreign keys
- Voegt alleen toe wat ontbreekt
- Geeft duidelijke status messages

### 🔄 Backwards Compatible

De fix:
- Behoudt bestaande data
- Voegt alleen toe, verwijdert niets
- Respecteert bestaande relaties
- Werkt met bestaande migrations

### ⚡ Performance Optimized

Voegt automatisch indexes toe:
```sql
CREATE INDEX idx_contentplan_clientid ON "ContentPlan"("clientId");
CREATE INDEX idx_topicalmap_clientid ON "TopicalAuthorityMap"("clientId");
CREATE INDEX idx_socialstrategy_clientid ON "SocialMediaStrategy"("clientId");
CREATE INDEX idx_websiteanalysis_clientid ON "WebsiteAnalysis"("clientId");
```

## 🐛 Troubleshooting

### Error: "Client table does not exist"

**Oplossing:** Run base tables migration eerst:
```bash
psql $DATABASE_URL -f supabase/migrations/20251210_create_base_tables.sql
```

### Error: "foreign key violation"

**Oorzaak:** Er zijn records zonder geldige clientId.

**Oplossing:**
```sql
-- Check orphaned records
SELECT * FROM "ContentPlan" WHERE "clientId" IS NULL;

-- Fix: Link to first available client
UPDATE "ContentPlan" 
SET "clientId" = (SELECT id FROM "Client" LIMIT 1)
WHERE "clientId" IS NULL;
```

### Error: "relation does not exist"

**Oorzaak:** De tabel is nog niet aangemaakt.

**Oplossing:** Run de relevante migration:
```bash
# Voor ContentPlan
psql $DATABASE_URL -f supabase/migrations/20251212_content_plans_tables_FIXED.sql

# Voor TopicalAuthorityMap
psql $DATABASE_URL -f supabase/migrations/20251212_topical_authority_map_tables.sql

# Voor SocialMediaStrategy
psql $DATABASE_URL -f supabase/migrations/20251212_social_media_pipeline.sql

# Voor WebsiteAnalysis
psql $DATABASE_URL -f supabase/migrations/20251212_website_analysis_table.sql
```

### Script hangt of timeout

**Oorzaak:** Grote tabel of database load.

**Oplossing:** Run in batches:
1. Comment out stappen in `COMPLETE_CLIENTID_FIX.sql`
2. Run per table (uncomment één STEP tegelijk)
3. Wacht tussen runs

## 📝 Wat te Doen Als Het Probleem Blijft

### 1. Check API routes voor hardcoded kolomnamen:

```bash
# Zoek naar client_id (snake_case) in plaats van clientId
grep -r "client_id" nextjs_space/app/api/
```

### 2. Check Prisma schema:

```bash
cat nextjs_space/lib/prisma-shim.ts | grep -A 5 "clientId"
```

### 3. Rebuild de applicatie:

```bash
cd /home/ubuntu/writgoai_app/nextjs_space
rm -rf .next
npm run build
npm run dev
```

### 4. Check logs:

```bash
# Supabase logs
# In Supabase Dashboard → Logs → Database

# Next.js logs
tail -f /home/ubuntu/writgoai_app/nextjs_space/.next/server.log
```

## 🎯 Samenvatting

### Quick Fix (1 minuut):

```bash
cd /home/ubuntu/writgoai_app

# 1. Diagnose
psql $DATABASE_URL -f supabase/migrations/DIAGNOSE_CLIENTID_ISSUE.sql

# 2. Fix
psql $DATABASE_URL -f supabase/migrations/COMPLETE_CLIENTID_FIX.sql

# 3. Test
cd nextjs_space && npm run dev
```

### Via Supabase Dashboard:

1. **SQL Editor** → Plak diagnose script → Run
2. **SQL Editor** → Plak fix script → Run
3. **Refresh** je app

## ✅ Success Criteria

- ✅ Diagnose script toont alle ✅ checks
- ✅ Fix script toont "🎉 ClientId fix completed successfully!"
- ✅ Verification query toont alle content tables met clientId
- ✅ App start zonder errors
- ✅ Admin pages laden correct
- ✅ Geen "column does not exist" errors in console

---

**Hulp nodig?** Check de diagnose output en deel deze in het support kanaal.
