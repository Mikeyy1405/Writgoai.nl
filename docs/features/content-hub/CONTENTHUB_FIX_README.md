# ContentHub ProjectId Fix - Complete Package

## 📋 Overzicht

Deze PR lost het probleem op waar WordPress verbinding faalt met error:
```
Invalid `prisma.contentHubSite.findFirst()` invocation: 
The column `ContentHubSite.projectId` does not exist in the current database.
```

## 🎯 Wat is de Fix?

Een database migratie die de `projectId` kolom toevoegt aan de `ContentHubSite` tabel, waardoor:
- WordPress configuratie gelinkt kan worden aan een Project
- Je niet opnieuw hoeft te verbinden tussen verschillende pagina's
- Project-specifieke WordPress instellingen automatisch worden gebruikt

## 📁 Wat zit er in deze PR?

### Scripts
1. **`scripts/apply_contenthub_migration.sh`**
   - Automatisch migratie script
   - Voert `prisma migrate deploy` uit
   - Verifieert dat de kolom is aangemaakt

2. **`nextjs_space/scripts/verify_contenthub_migration.ts`**
   - TypeScript verificatie script
   - Test alle queries en relaties
   - Gebruikt voor post-deployment verificatie

### Documentatie
1. **`WORDPRESS_CONNECTION_FIX.md`**
   - Quick start guide (Nederlands)
   - Snelle oplossing voor eindgebruikers
   - 2 minuten read

2. **`DATABASE_MIGRATION_FIX.md`**
   - Uitgebreide technische documentatie (Nederlands)
   - Meerdere migratie opties
   - Troubleshooting guide
   - 10 minuten read

3. **`DEPLOYMENT_CONTENTHUB_FIX.md`**
   - Deployment guide voor beheerders
   - Pre-deployment checklist
   - Rollback procedures
   - Monitoring tips
   - 15 minuten read

4. **`TESTING_GUIDE_CONTENTHUB_FIX.md`**
   - Complete test plan
   - 8 test scenarios
   - Automated test voorbeelden
   - Bug report template
   - 20 minuten read

## 🚀 Quick Start

### Voor Eindgebruikers

```bash
# Run het migratie script
./scripts/apply_contenthub_migration.sh

# Herstart de applicatie
# Test WordPress verbinding
```

Zie: [WORDPRESS_CONNECTION_FIX.md](./WORDPRESS_CONNECTION_FIX.md)

### Voor Developers

```bash
# Apply migration
cd nextjs_space
yarn prisma migrate deploy

# Verify
yarn ts-node scripts/verify_contenthub_migration.ts
```

Zie: [DATABASE_MIGRATION_FIX.md](./DATABASE_MIGRATION_FIX.md)

### Voor DevOps/Beheerders

1. Backup database
2. Run migration
3. Verify migration
4. Test application
5. Monitor

Zie: [DEPLOYMENT_CONTENTHUB_FIX.md](./DEPLOYMENT_CONTENTHUB_FIX.md)

## 🧪 Testing

Uitgebreid test plan beschikbaar in [TESTING_GUIDE_CONTENTHUB_FIX.md](./TESTING_GUIDE_CONTENTHUB_FIX.md)

Key test scenarios:
- ✅ WordPress verbinding van Integration page
- ✅ WordPress verbinding met bestaand project
- ✅ Project zonder WordPress config
- ✅ Meerdere sites per client
- ✅ Update bestaande connectie

## 📊 Migration Details

### Database Changes

```sql
-- Nieuwe kolom
ALTER TABLE "ContentHubSite" ADD COLUMN "projectId" TEXT;

-- Nieuwe index
CREATE INDEX "ContentHubSite_projectId_idx" ON "ContentHubSite"("projectId");

-- Foreign key constraint
ALTER TABLE "ContentHubSite" 
ADD CONSTRAINT "ContentHubSite_projectId_fkey" 
FOREIGN KEY ("projectId") REFERENCES "Project"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;
```

### Impact Analysis

- **Downtime**: Geen (backward compatible)
- **Performance**: Minimaal (nieuwe index zorgt voor snelle queries)
- **Data Loss Risk**: Geen (alleen nieuwe kolom)
- **Breaking Changes**: Geen

## 🔄 Migration Status

```bash
# Check migration status
cd nextjs_space
yarn prisma migrate status
```

## 🐛 Troubleshooting

### Error: "column does not exist"
➡️ Migration is nog niet toegepast. Run: `./scripts/apply_contenthub_migration.sh`

### Error: "DATABASE_URL not found"
➡️ Check of `.env` bestand bestaat met `DATABASE_URL`

### Error blijft na migration
➡️ Herstart applicatie, verify migration is toegepast

Meer troubleshooting in [DATABASE_MIGRATION_FIX.md](./DATABASE_MIGRATION_FIX.md)

## 📝 Migration History

| Date | Migration | Description |
|------|-----------|-------------|
| 2024-12-07 | `20251207060850_add_project_relation_to_contenthub_site` | Add projectId to ContentHubSite |

## 🔗 Related Files

### Modified Files
Geen - alleen nieuwe files toegevoegd

### New Files
- `scripts/apply_contenthub_migration.sh`
- `nextjs_space/scripts/verify_contenthub_migration.ts`
- `WORDPRESS_CONNECTION_FIX.md`
- `DATABASE_MIGRATION_FIX.md`
- `DEPLOYMENT_CONTENTHUB_FIX.md`
- `TESTING_GUIDE_CONTENTHUB_FIX.md`
- `CONTENTHUB_FIX_README.md` (dit bestand)

### Migration Files
- `nextjs_space/prisma/migrations/20251207060850_add_project_relation_to_contenthub_site/migration.sql`

## ✅ Deployment Checklist

Voor productie deployment:

- [ ] Database backup gemaakt
- [ ] Migration toegepast
- [ ] Migration geverifieerd
- [ ] Applicatie herstart
- [ ] WordPress verbinding getest
- [ ] Logs gemonitord
- [ ] Gebruikers geïnformeerd

## 📞 Support

Bij vragen of problemen:
1. Check eerst de troubleshooting secties in de documentatie
2. Run verification script: `yarn ts-node scripts/verify_contenthub_migration.ts`
3. Check applicatie logs
4. Contact development team

## 📚 Documentation Index

| Document | Audience | Time | Purpose |
|----------|----------|------|---------|
| [WORDPRESS_CONNECTION_FIX.md](./WORDPRESS_CONNECTION_FIX.md) | Eindgebruikers | 2 min | Quick fix guide |
| [DATABASE_MIGRATION_FIX.md](./DATABASE_MIGRATION_FIX.md) | Developers | 10 min | Technical details |
| [DEPLOYMENT_CONTENTHUB_FIX.md](./DEPLOYMENT_CONTENTHUB_FIX.md) | DevOps | 15 min | Deployment guide |
| [TESTING_GUIDE_CONTENTHUB_FIX.md](./TESTING_GUIDE_CONTENTHUB_FIX.md) | QA/Testers | 20 min | Test scenarios |
| [CONTENTHUB_FIX_README.md](./CONTENTHUB_FIX_README.md) | Everyone | 5 min | Overview (dit bestand) |

## 🎉 Success Metrics

Na deployment, verwacht:
- ✅ Geen errors over "projectId does not exist"
- ✅ WordPress verbinding werkt van alle pagina's
- ✅ Automatische project linking werkt
- ✅ Gebruikers hoeven niet opnieuw te verbinden

## 🔐 Security Notes

- WordPress application passwords blijven encrypted in database
- Geen nieuwe security risks geïntroduceerd
- Foreign key constraints zorgen voor data integriteit

## 📈 Future Improvements

Mogelijke toekomstige verbeteringen:
- Automatische sync van WordPress configuratie tussen Project en ContentHub
- Bulk WordPress site import
- WordPress site health monitoring
- Automatische credential rotatie

---

**Version:** 1.0  
**Last Updated:** 2024-12-07  
**Author:** GitHub Copilot  
**Status:** Ready for Deployment ✅
