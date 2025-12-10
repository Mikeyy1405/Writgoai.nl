# Fix voor WordPress Verbinding Error

## Probleem

Bij het verbinden van WordPress krijg je de foutmelding:
```
Invalid `prisma.contentHubSite.findFirst()` invocation: 
The column `ContentHubSite.projectId` does not exist in the current database.
```

## Oorzaak

Er is een nieuwe database migratie aangemaakt op 7 december 2024 die de `projectId` kolom toevoegt aan de `ContentHubSite` tabel. Deze migratie is nog niet toegepast op de productie database.

## Oplossing

### Optie 1: Automatisch Script (Aanbevolen)

Gebruik het meegeleverde script om de migratie automatisch toe te passen:

```bash
# Vanaf de root directory van het project
./scripts/apply_contenthub_migration.sh
```

Dit script zal:
1. Prisma client genereren
2. Alle pending migraties toepassen
3. Verifiëren dat de kolom is aangemaakt

### Optie 2: Handmatige Migratie

Als je het liever handmatig doet:

```bash
cd nextjs_space

# Genereer Prisma client
yarn prisma generate

# Pas migraties toe
yarn prisma migrate deploy
```

### Optie 3: Direct SQL (Voor gevorderde gebruikers)

Als je directe database toegang hebt:

```sql
-- Voeg projectId kolom toe
ALTER TABLE "ContentHubSite" ADD COLUMN "projectId" TEXT;

-- Maak index aan
CREATE INDEX "ContentHubSite_projectId_idx" ON "ContentHubSite"("projectId");

-- Voeg foreign key constraint toe
ALTER TABLE "ContentHubSite" 
ADD CONSTRAINT "ContentHubSite_projectId_fkey" 
FOREIGN KEY ("projectId") REFERENCES "Project"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;
```

## Verificatie

Na het toepassen van de migratie, controleer of het werkt:

1. Start de applicatie opnieuw op
2. Ga naar de **Integratie** pagina
3. Probeer WordPress te verbinden
4. De foutmelding zou niet meer moeten verschijnen

## Wat doet de projectId kolom?

De `projectId` kolom linkt een ContentHubSite aan een specifiek Project. Dit zorgt ervoor dat:

- WordPress configuratie gesynchroniseerd blijft tussen Project en Content Hub
- Je niet opnieuw hoeft te verbinden als je al een project hebt geconfigureerd
- Project-specifieke WordPress instellingen automatisch worden gebruikt

## Technische Details

### Migratie Bestand
Locatie: `nextjs_space/prisma/migrations/20251207060850_add_project_relation_to_contenthub_site/migration.sql`

### Schema Wijzigingen
```prisma
model ContentHubSite {
  // ... andere velden
  
  // Nieuwe relatie toegevoegd
  projectId  String?
  project    Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)
  
  // ... andere velden
}
```

## Troubleshooting

### Error: "DATABASE_URL not found"
Zorg ervoor dat je `.env` bestand bestaat in `nextjs_space/` en dat het een `DATABASE_URL` bevat:
```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

### Error: "Migration already applied"
Dit betekent dat de migratie al is toegepast. De error zou nu opgelost moeten zijn.

### Error blijft na migratie
1. Controleer of de applicatie opnieuw is gestart
2. Verifieer dat de kolom bestaat:
   ```bash
   yarn prisma studio
   ```
   Open `ContentHubSite` tabel en check of `projectId` zichtbaar is

## Voor Beheerders

Als je deze fix deploy naar productie:

1. **Backup eerst de database**
2. Pas de migratie toe tijdens een onderhoudsvenster
3. Test de WordPress verbinding na deployment
4. Monitor de logs voor eventuele errors

## Contact

Als je problemen hebt met deze fix, neem dan contact op met het ontwikkelteam.
