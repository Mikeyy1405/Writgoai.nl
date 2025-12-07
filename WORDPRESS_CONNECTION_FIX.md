# WordPress Verbinding Fix - Quick Guide

## Probleem
Foutmelding bij WordPress verbinden:
```
Invalid `prisma.contentHubSite.findFirst()` invocation: 
The column `ContentHubSite.projectId` does not exist in the current database.
```

## Snelle Oplossing

**Stap 1:** Run het migratie script
```bash
./scripts/apply_contenthub_migration.sh
```

**Stap 2:** Herstart de applicatie

**Stap 3:** Test WordPress verbinding opnieuw

## Wat als het script niet werkt?

Handmatige methode:
```bash
cd nextjs_space
yarn prisma migrate deploy
```

## Verificatie

Check of de fix werkte:
```bash
cd nextjs_space
ts-node scripts/verify_contenthub_migration.ts
```

## Meer Details

Zie [DATABASE_MIGRATION_FIX.md](./DATABASE_MIGRATION_FIX.md) voor uitgebreide documentatie.

## Wat doet de fix?

Voegt een `projectId` kolom toe aan de `ContentHubSite` tabel zodat:
- WordPress configuratie gelinkt kan worden aan een project
- Je niet opnieuw hoeft te verbinden tussen pagina's
- Project-specifieke instellingen automatisch worden gebruikt

## Support

Bij problemen, check eerst:
1. Is `.env` correct geconfigureerd?
2. Is `DATABASE_URL` ingesteld?
3. Heb je database toegang?
4. Is de applicatie herstart na de migratie?
