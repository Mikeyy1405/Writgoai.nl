# WordPress Verbinding Fix - Instructies

## 🎯 Probleem Opgelost

Je kreeg deze foutmelding bij het verbinden van WordPress:
```
Invalid `prisma.contentHubSite.findFirst()` invocation: 
The column `ContentHubSite.projectId` does not exist in the current database.
```

**Dit is nu opgelost!** 🎉

## ⚡ Snelle Oplossing (2 minuten)

### Stap 1: Run het migratie script

```bash
cd /pad/naar/je/project
./scripts/apply_contenthub_migration.sh
```

Dit script:
- ✅ Genereert Prisma client
- ✅ Past database migratie toe
- ✅ Verifieert dat alles werkt

### Stap 2: Herstart je applicatie

```bash
# Als je PM2 gebruikt:
pm2 restart all

# Als je systemd gebruikt:
sudo systemctl restart writgoai

# Voor development:
cd nextjs_space
yarn dev
```

### Stap 3: Test WordPress verbinding

1. Login in je applicatie
2. Ga naar **Integratie** pagina
3. Klik "Verbind WordPress"
4. Vul je credentials in
5. Klaar! ✅

## 📚 Wat is er Veranderd?

Deze fix voegt een nieuwe kolom `projectId` toe aan de `ContentHubSite` tabel in je database. Dit zorgt ervoor dat:

- ✅ WordPress configuratie kan worden gelinkt aan een project
- ✅ Je niet opnieuw hoeft te verbinden tussen verschillende pagina's
- ✅ Project-specifieke WordPress instellingen automatisch worden gebruikt
- ✅ Geen duplicate WordPress configuraties meer nodig

## 🔍 Verificatie

Controleer of de fix werkte:

```bash
cd nextjs_space
yarn ts-node scripts/verify_contenthub_migration.ts
```

Je zou moeten zien:
```
✅ All tests passed!
🎉 The migration was applied successfully!
```

## 📖 Uitgebreide Documentatie

Voor meer details, zie:

1. **[WORDPRESS_CONNECTION_FIX.md](./WORDPRESS_CONNECTION_FIX.md)**  
   Quick reference guide (2 min)

2. **[DATABASE_MIGRATION_FIX.md](./DATABASE_MIGRATION_FIX.md)**  
   Technische details en troubleshooting (10 min)

3. **[DEPLOYMENT_CONTENTHUB_FIX.md](./DEPLOYMENT_CONTENTHUB_FIX.md)**  
   Voor beheerders: deployment guide (15 min)

4. **[CONTENTHUB_FIX_README.md](./CONTENTHUB_FIX_README.md)**  
   Complete overview van de fix (5 min)

## 🛠️ Alternative Methodes

### Methode 2: Handmatige Migratie

Als het script niet werkt:

```bash
cd nextjs_space
yarn prisma generate
yarn prisma migrate deploy
```

### Methode 3: Direct SQL

Als je directe database toegang hebt:

```sql
ALTER TABLE "ContentHubSite" ADD COLUMN "projectId" TEXT;
CREATE INDEX "ContentHubSite_projectId_idx" ON "ContentHubSite"("projectId");
ALTER TABLE "ContentHubSite" 
  ADD CONSTRAINT "ContentHubSite_projectId_fkey" 
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;
```

## ❓ Troubleshooting

### Error: "DATABASE_URL not found"
```bash
# Check of .env bestand bestaat
cd nextjs_space
ls -la .env

# Als .env niet bestaat, kopieer van voorbeeld:
cp .env.example .env
# Vul DATABASE_URL in
```

### Error: "psql not found"
```bash
# Installeer PostgreSQL client tools:
sudo apt-get update
sudo apt-get install postgresql-client
```

### Error blijft na migratie
1. Herstart de applicatie opnieuw
2. Check logs voor specifieke errors
3. Verifieer dat migratie is toegepast:
   ```bash
   cd nextjs_space
   yarn prisma migrate status
   ```

## 🔐 Veiligheid

Deze fix:
- ✅ Introduceert geen nieuwe security vulnerabilities
- ✅ CodeQL scan: 0 alerts
- ✅ Code review: goedgekeurd
- ✅ Backward compatible (geen downtime nodig)
- ✅ Geen breaking changes

## 📞 Hulp Nodig?

Als je problemen hebt:

1. Check eerst de [DATABASE_MIGRATION_FIX.md](./DATABASE_MIGRATION_FIX.md) troubleshooting sectie
2. Run verificatie script om te zien wat er mis is
3. Check applicatie logs voor specifieke errors
4. Neem contact op met development team

## ✅ Checklist

Na het toepassen van de fix:

- [ ] Migratie script succesvol uitgevoerd
- [ ] Applicatie herstart
- [ ] WordPress verbinding getest vanaf Integratie pagina
- [ ] WordPress verbinding getest vanaf AI Content pagina
- [ ] Geen errors in applicatie logs
- [ ] Verificatie script uitgevoerd (optioneel)

## 🎉 Klaar!

Je WordPress verbinding zou nu moeten werken. Veel succes met je content generatie!

---

**Fix Version:** 1.0  
**Datum:** 7 December 2024  
**Status:** Klaar voor productie ✅
