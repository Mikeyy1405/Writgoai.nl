# Database Migration Instructions

## Latest Migration: Branding Base64 Storage

### Branding Logo Fields - Base64 Support

Deze migratie wijzigt de `BrandSettings` tabel om Base64-encoded afbeeldingen op te slaan in plaats van S3 URLs.

#### Wijzigingen

De volgende velden in de `BrandSettings` tabel worden gewijzigd van `VARCHAR` naar `TEXT`:
- `logoUrl`
- `logoLightUrl`
- `logoDarkUrl`
- `logoIconUrl`
- `faviconUrl`
- `favicon192Url`
- `favicon512Url`

#### Migratie uitvoeren

Voer de volgende commando's uit in de `nextjs_space` directory:

```bash
cd nextjs_space

# Voer de migratie uit
npx prisma migrate deploy

# Of voor development:
npx prisma migrate dev
```

#### Verificatie

Na de migratie kunt u controleren of de wijzigingen correct zijn toegepast:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'BrandSettings' 
AND column_name IN (
  'logoUrl', 'logoLightUrl', 'logoDarkUrl', 'logoIconUrl',
  'faviconUrl', 'favicon192Url', 'favicon512Url'
);
```

Alle velden moeten het type `text` hebben.

#### Opmerking

⚠️ **Belangrijk:** Bestaande S3 URLs in de database blijven werken. De nieuwe upload functionaliteit zal echter Base64 data URLs gebruiken. Als u wilt migreren van S3 naar Base64, moet u de afbeeldingen opnieuw uploaden via de branding pagina (`/admin/branding`).

---

## Previous Migration: Add contentId to ContentHubArticle

### Issue
The application crashes during article generation with the error:
```
The column `ContentHubArticle.contentId` does not exist in the current database.
```

### Solution
A migration has been created at:
`/nextjs_space/prisma/migrations/20251205101600_add_content_id_to_content_hub_article/migration.sql`

### How to Apply

#### Option 1: Using Prisma Migrate (Recommended)
```bash
cd nextjs_space
npx prisma migrate deploy
```

#### Option 2: Manual SQL Execution
If you have direct database access, run:
```sql
ALTER TABLE "ContentHubArticle" ADD COLUMN "contentId" TEXT;
```

### Verification
After applying the migration, verify it worked:
```bash
cd nextjs_space
npx prisma migrate status
```

You should see all migrations marked as applied.

### Note on BlogPost.seoScore
The `BlogPost.seoScore` column already exists in the schema.prisma file (line 1428).
If you're getting errors about this column, ensure all migrations have been applied:
```bash
cd nextjs_space
npx prisma migrate deploy
```

### Rollback (if needed)
If you need to rollback this migration:
```sql
ALTER TABLE "ContentHubArticle" DROP COLUMN IF EXISTS "contentId";
```
