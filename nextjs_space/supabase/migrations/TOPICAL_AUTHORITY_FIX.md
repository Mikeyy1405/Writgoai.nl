# Topical Authority Database Migration Fix

## Probleem
De originele migration `20241217000000_topical_authority.sql` gaf de volgende error:

```
ERROR: 42703: column "totalArticlesTarget" of relation "TopicalAuthorityMap" does not exist
```

Dit betekent dat de tabel `TopicalAuthorityMap` al bestond (waarschijnlijk van een eerdere migration) maar niet de juiste kolommen had.

## Oplossing
Een nieuwe migration `20241217120000_topical_authority_fixed.sql` is aangemaakt die:

1. **Eerst alle oude tabellen en structuren dropt** (in de juiste volgorde):
   - Triggers
   - Functions
   - Tabellen (van meest afhankelijk naar minst afhankelijk)

2. **Dan alle tabellen opnieuw aanmaakt** met de correcte structuur:
   - `TopicalAuthorityMap` - met alle benodigde kolommen inclusief `totalArticlesTarget`
   - `PillarTopic` - pillar topics voor het content plan
   - `Subtopic` - subtopics die pillars ondersteunen
   - `PlannedArticle` - individuele geplande artikelen
   - `WordPressSitemapCache` - cache voor WordPress sitemap data
   - `DataForSEOCache` - cache voor DataForSEO API resultaten

3. **Alle indexes, triggers en functions opnieuw aanmaakt**

## Hoe Uitvoeren

### Optie 1: Via Supabase Dashboard (Aanbevolen)
1. Ga naar je Supabase project dashboard
2. Ga naar SQL Editor
3. Open het bestand `supabase/migrations/20241217120000_topical_authority_fixed.sql`
4. Kopieer de volledige inhoud
5. Plak in de SQL Editor
6. Klik op "Run"
7. Verifieer dat alle tabellen correct zijn aangemaakt

### Optie 2: Via Supabase CLI
```bash
# Zorg dat je in de project directory bent
cd /home/ubuntu/writgoai_nl/nextjs_space

# Run de migration
supabase db push

# Of run specifiek deze migration
supabase db execute --file supabase/migrations/20241217120000_topical_authority_fixed.sql
```

### Optie 3: Via psql (Direct Database Toegang)
```bash
# Als je directe database toegang hebt
psql "postgresql://[user]:[password]@[host]:[port]/[database]" \
  -f supabase/migrations/20241217120000_topical_authority_fixed.sql
```

## Verificatie

Na het uitvoeren van de migration, verifieer dat alle tabellen correct zijn aangemaakt:

```sql
-- Check of alle tabellen bestaan
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'TopicalAuthorityMap',
  'PillarTopic',
  'Subtopic',
  'PlannedArticle',
  'WordPressSitemapCache',
  'DataForSEOCache'
);

-- Check de kolommen van TopicalAuthorityMap
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'TopicalAuthorityMap'
ORDER BY ordinal_position;

-- Verwachte kolommen:
-- - id (TEXT)
-- - projectId (TEXT)
-- - clientId (TEXT)
-- - niche (TEXT)
-- - description (TEXT)
-- - totalArticlesTarget (INTEGER) ✅ Deze moet er zijn!
-- - totalArticlesPlanned (INTEGER)
-- - totalArticlesGenerated (INTEGER)
-- - totalArticlesPublished (INTEGER)
-- - status (TEXT)
-- - createdAt (TIMESTAMP)
-- - updatedAt (TIMESTAMP)
```

## Belangrijke Opmerkingen

⚠️ **Deze migration dropt ALLE bestaande Topical Authority tabellen!**
- Alle data in deze tabellen zal verloren gaan
- Zorg dat je een backup hebt als er belangrijke data in deze tabellen staat
- Dit is noodzakelijk om de structuur correct te krijgen

✅ **Veilig voor andere data:**
- Andere tabellen (`Project`, `Client`, `SavedContent`, etc.) worden NIET geraakt
- Alleen de Topical Authority tabellen worden gedropt en opnieuw aangemaakt

## Volgende Stappen

Na het succesvol uitvoeren van de migration:

1. Test de Topical Authority functionaliteit in je applicatie
2. Verifieer dat je nieuwe topical authority maps kunt aanmaken
3. Check of de API endpoints correct werken:
   - `POST /api/client/topical-authority/generate-map`
   - `GET /api/client/topical-authority/map/[mapId]`
   - `GET /api/client/topical-authority/maps`
   - `GET /api/client/topical-authority/articles`

## Troubleshooting

### Error: "relation does not exist"
Dit betekent dat de drop statements zijn geslaagd maar de create statements zijn gefaald.
- Check de logs voor specifieke errors
- Verifieer dat de foreign key tabellen (`Project`, `Client`, `SavedContent`) bestaan

### Error: "permission denied"
Je hebt niet voldoende rechten om tabellen te droppen/aanmaken.
- Gebruik een superuser account
- Of vraag je database administrator om de migration uit te voeren

### Migration loopt maar geeft geen output
De migration kan enkele seconden duren door het droppen en aanmaken van alle tabellen.
- Wacht tot de migration volledig is afgerond
- Check de database logs voor progress

## Files Gewijzigd

- ✅ `supabase/migrations/20241217120000_topical_authority_fixed.sql` - Nieuwe migration
- 📄 `supabase/migrations/TOPICAL_AUTHORITY_FIX.md` - Deze documentatie

## Datum
17 december 2024
