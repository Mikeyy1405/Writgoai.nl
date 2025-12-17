# 🚀 Quick Start: SQL Migration Uitvoeren

## Stap 1: Ga naar Supabase Dashboard
1. Open https://supabase.com
2. Log in op je account
3. Selecteer je **WritGo.nl** project

## Stap 2: Open SQL Editor
1. Klik in het linker menu op **SQL Editor**
2. Klik op **New Query**

## Stap 3: Kopieer en Plak de Migration
De migration staat in:
```
nextjs_space/supabase/migrations/20241217120000_topical_authority_fixed.sql
```

## Stap 4: Run de Migration
1. Klik op de groene **Run** knop (of druk `Ctrl+Enter`)
2. Wacht tot de query klaar is
3. ✅ Je zou moeten zien: "Success. No rows returned"

## Stap 5: Verifieer de Tabellen
Kopieer en run deze query om te verifiëren:

```sql
-- Check of alle tabellen zijn aangemaakt
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'TopicalAuthorityMap',
    'PillarTopic', 
    'Subtopic',
    'PlannedArticle',
    'WordPressSitemapCache',
    'DataForSEOCache'
  )
ORDER BY table_name;
```

**Verwacht resultaat:**
```
TopicalAuthorityMap      | 11 columns
PillarTopic             | 12 columns
Subtopic                | 11 columns
PlannedArticle          | 25 columns
WordPressSitemapCache   | 8 columns
DataForSEOCache         | 10 columns
```

## 🎉 Klaar!
Je Topical Authority systeem is nu klaar voor gebruik!

---

## 🆘 Troubleshooting

### Error: "permission denied"
→ Zorg dat je de **admin/owner** bent van het Supabase project

### Error: "relation already exists"
→ Run eerst deze cleanup query:
```sql
DROP TABLE IF EXISTS "DataForSEOCache" CASCADE;
DROP TABLE IF EXISTS "WordPressSitemapCache" CASCADE;
DROP TABLE IF EXISTS "PlannedArticle" CASCADE;
DROP TABLE IF EXISTS "Subtopic" CASCADE;
DROP TABLE IF EXISTS "PillarTopic" CASCADE;
DROP TABLE IF EXISTS "TopicalAuthorityMap" CASCADE;
```

### Wil je helemaal opnieuw beginnen?
Run de hele migration opnieuw - de `DROP TABLE IF EXISTS` zorgt voor clean start.

---

**Hulp nodig?** Check de volledige documentatie in `MIGRATION_FIX_SUMMARY.md`
