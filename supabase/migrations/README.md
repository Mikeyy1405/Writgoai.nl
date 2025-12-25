# Supabase Migrations

Deze folder bevat database migrations die automatisch worden uitgevoerd via Supabase GitHub integration.

## Hoe het werkt

1. **Automatische deployment**: Wanneer je pusht naar GitHub, detecteert Supabase nieuwe migrations
2. **Migrations worden uitgevoerd**: In volgorde gebaseerd op timestamp in filename
3. **Idempotent**: Migrations gebruiken `IF NOT EXISTS` en kunnen veilig opnieuw worden uitgevoerd

## Naming conventie

Migrations volgen het formaat: `{timestamp}_{description}.sql`

Bijvoorbeeld:
- `20251225091252_media_library.sql`
- Timestamp: `YYYYMMDDHHMMSS`
- Description: korte beschrijving met underscores

## Huidige migrations

- **20251225091252_media_library.sql**: Voegt media library functionaliteit toe
  - Nieuwe kolommen voor user uploads
  - Metadata fields (title, description, tags)
  - RLS policies voor user-owned media
  - Indices voor performance

## Migration status checken

Je kunt de status van migrations bekijken in:
1. Supabase Dashboard → Database → Migrations
2. Of via CLI: `supabase migration list`

## Handmatig uitvoeren (indien nodig)

Als auto-deploy niet werkt, kun je migrations handmatig uitvoeren:

**Via Dashboard:**
1. Ga naar Supabase Dashboard
2. Klik op SQL Editor
3. Kopieer de SQL uit de migration file
4. Run de query

**Via CLI:**
```bash
supabase db push
```

## Nieuwe migration toevoegen

```bash
# Genereer timestamp
timestamp=$(date +"%Y%m%d%H%M%S")

# Maak migration file
touch supabase/migrations/${timestamp}_your_description.sql

# Schrijf je SQL
# Commit en push
git add supabase/migrations/${timestamp}_your_description.sql
git commit -m "Add migration: your description"
git push
```

## Rollback

Supabase ondersteunt geen automatische rollbacks. Voor rollback:
1. Maak een nieuwe "down" migration die de changes terugdraait
2. Of herstel via SQL in dashboard

## Best practices

- ✅ Gebruik altijd `IF NOT EXISTS` / `IF EXISTS`
- ✅ Test migrations eerst in development
- ✅ Maak kleine, focussed migrations
- ✅ Voeg comments toe aan complexe SQL
- ✅ Never drop data zonder backup
- ⚠️ Wees voorzichtig met `ALTER TABLE` op grote tables
