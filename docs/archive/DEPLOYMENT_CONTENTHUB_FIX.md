# Deployment Guide: ContentHubSite ProjectId Fix

## Voor Beheerders / DevOps

Deze guide beschrijft hoe je de ContentHubSite.projectId migratie veilig naar productie deploy.

## Pre-Deployment Checklist

- [ ] Backup van productie database gemaakt
- [ ] Downtime window ingepland (optioneel, ~5 minuten)
- [ ] Database credentials beschikbaar
- [ ] Rollback plan klaar

## Deployment Stappen

### 1. Database Backup

**ALTIJD eerst een backup maken!**

```bash
# Maak een backup van de productie database
pg_dump $PRODUCTION_DATABASE_URL > backup_contenthub_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Code Deployment

```bash
# Pull laatste code
git checkout main
git pull origin main

# Of merge de PR
git merge copilot/fix-wordpress-connection-error
```

### 3. Database Migration

**Methode A: Via het deployment script**
```bash
cd nextjs_space
yarn prisma migrate deploy
```

**Methode B: Handmatig SQL (als Prisma niet beschikbaar is)**
```sql
-- Voeg projectId kolom toe aan ContentHubSite
ALTER TABLE "ContentHubSite" ADD COLUMN "projectId" TEXT;

-- Maak index aan voor betere query performance
CREATE INDEX "ContentHubSite_projectId_idx" ON "ContentHubSite"("projectId");

-- Voeg foreign key constraint toe
ALTER TABLE "ContentHubSite" 
ADD CONSTRAINT "ContentHubSite_projectId_fkey" 
FOREIGN KEY ("projectId") REFERENCES "Project"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;
```

### 4. Verificatie

**Test 1: Check of kolom bestaat**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ContentHubSite' 
  AND column_name = 'projectId';
```

Expected result: 1 row met `projectId | text`

**Test 2: Run verificatie script**
```bash
cd nextjs_space
yarn ts-node scripts/verify_contenthub_migration.ts
```

Expected result: All tests pass ✅

### 5. Application Restart

```bash
# Restart je application server
# Dit hangt af van je deployment setup:

# PM2
pm2 restart all

# systemd
sudo systemctl restart writgoai

# Docker
docker-compose restart

# Vercel/Render
# Deploy via dashboard
```

### 6. Post-Deployment Testing

Test de volgende flows:

1. **Integration Page WordPress Connect**
   - Login als client
   - Ga naar Integratie pagina
   - Klik "Verbind WordPress"
   - Vul credentials in
   - Verwacht: Succesvol verbonden ✅

2. **AI Content Page WordPress Connect**
   - Ga naar AI Content
   - Selecteer project
   - Test WordPress functionaliteit
   - Verwacht: Geen "column does not exist" error ✅

3. **Project Linking**
   - Connect WordPress voor project met bestaande WordPress config
   - Verwacht: Automatisch gelinkt aan project ✅

## Rollback Procedure

Als er problemen zijn na deployment:

### Optie 1: Database Rollback (Aanbevolen bij data issues)

```bash
# Restore van backup
psql $PRODUCTION_DATABASE_URL < backup_contenthub_TIMESTAMP.sql
```

### Optie 2: Code Rollback

```bash
# Revert de merge
git revert HEAD
git push

# Restart applicatie
```

### Optie 3: Alleen de kolom verwijderen

```sql
-- Remove foreign key constraint
ALTER TABLE "ContentHubSite" 
DROP CONSTRAINT IF EXISTS "ContentHubSite_projectId_fkey";

-- Remove index
DROP INDEX IF EXISTS "ContentHubSite_projectId_idx";

-- Remove column
ALTER TABLE "ContentHubSite" 
DROP COLUMN IF EXISTS "projectId";
```

**Let op:** Na rollback moet je ook de code terugdraaien!

## Monitoring

Na deployment, monitor de volgende metrics:

1. **Error Logs**
   ```bash
   # Check voor errors gerelateerd aan ContentHubSite
   tail -f /var/log/app/error.log | grep -i "ContentHubSite"
   ```

2. **Database Query Performance**
   ```sql
   -- Check slow queries
   SELECT * FROM pg_stat_statements 
   WHERE query LIKE '%ContentHubSite%' 
   ORDER BY mean_exec_time DESC 
   LIMIT 10;
   ```

3. **Application Health**
   - Check application logs
   - Monitor response times
   - Check error rates in APM tool

## Expected Impact

- **Downtime**: Geen (schema wijziging is backward compatible)
- **Performance**: Minimaal (één extra kolom, geïndexeerd)
- **Data Loss Risk**: Geen (alleen nieuwe kolom toevoegen)
- **User Impact**: Positief (fix voor bestaande bug)

## Communication Template

Voor gebruikers notificatie:

```
Beste gebruiker,

We hebben een update doorgevoerd die een probleem oplost met WordPress verbindingen.

Wat is er veranderd:
- WordPress verbinding werkt nu correct tussen verschillende pagina's
- Je hoeft niet meer opnieuw te verbinden als je tussen pagina's wisselt
- Project-specifieke WordPress instellingen worden nu automatisch gebruikt

Wat moet je doen:
- Niets! De update is automatisch doorgevoerd
- Als je eerder problemen had met WordPress verbinden, probeer het opnieuw

Bij vragen, neem contact met ons op.

Met vriendelijke groet,
Het WritGo Team
```

## Troubleshooting

### Error: "relation already exists"
Dit betekent dat de migratie al is toegepast. Ga door naar verificatie.

### Error: "permission denied"
Database user heeft geen rechten om schema te wijzigen. Use superuser of gebruik handmatige SQL als superuser.

### Error blijft na deployment
1. Check of applicatie is herstart
2. Verifieer dat correct database wordt gebruikt (check DATABASE_URL)
3. Check Prisma client is opnieuw gegenereerd (`yarn prisma generate`)

## Support Contacts

- **Database Issues**: DBA team
- **Application Issues**: Development team
- **Deployment Issues**: DevOps team

## Post-Mortem Checklist

Na succesvolle deployment:

- [ ] Update deployment log
- [ ] Archive backup (bewaar 30 dagen)
- [ ] Update runbook met lessons learned
- [ ] Notify team van succesvolle deployment
- [ ] Remove any temporary monitoring/alerts
